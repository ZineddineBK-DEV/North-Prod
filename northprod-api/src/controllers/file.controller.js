const path = require('path');
const fs = require('fs');
const File = require('../models/File');
const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { createError } = require('../middleware/error');

// ── POST /api/files/upload ────────────────────────────────
const uploadFile = async (req, res, next) => {
  try {
    if (!req.file) return next(createError('Aucun fichier reçu.', 400));
    const { projectId, parentFileId } = req.body;
    if (!projectId) return next(createError('projectId requis.', 400));

    const project = await Project.findById(projectId).populate('artist');
    if (!project) return next(createError('Projet introuvable.', 404));

    // Check access: artist can upload to own project, production to assigned
    const isOwner = project.artist._id.toString() === req.user._id.toString();
    const isEngineer = project.engineer?.toString() === req.user._id.toString();
    if (req.user.role === 'artist' && !isOwner) return next(createError('Accès refusé.', 403));
    if (req.user.role === 'production' && !isEngineer && !isOwner) return next(createError('Accès refusé.', 403));

    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    let versionNumber = 1;

    // Handle versioning
    if (parentFileId) {
      const parent = await File.findById(parentFileId);
      if (!parent) return next(createError('Fichier parent introuvable.', 404));
      // Get latest version number for this lineage
      const latest = await File.findOne({ parentFile: parentFileId }).sort({ versionNumber: -1 });
      versionNumber = (latest?.versionNumber || parent.versionNumber) + 1;
      // Mark old versions as not latest
      await File.updateMany(
        { $or: [{ _id: parentFileId }, { parentFile: parentFileId }] },
        { isLatestVersion: false }
      );
    }

    const relativePath = `projects/${req.file.filename}`;
    const file = await File.create({
      project: projectId,
      uploadedBy: req.user._id,
      originalName: req.file.originalname,
      storedName: req.file.filename,
      filePath: relativePath,
      mimeType: req.file.mimetype,
      size: req.file.size,
      extension: ext,
      versionNumber,
      parentFile: parentFileId || null,
      isLatestVersion: true,
    });

    // Link to project
    await Project.findByIdAndUpdate(projectId, { $addToSet: { files: file._id } });

    // Notify the other party (artist if engineer uploads, engineer if artist uploads)
    const notifyUserId = isOwner ? project.engineer : project.artist._id;
    if (notifyUserId) {
      await Notification.createAndEmit({
        recipient: notifyUserId,
        type: 'file_uploaded',
        title: 'Nouveau fichier ajouté',
        message: `"${req.file.originalname}" (v${versionNumber}) a été ajouté au projet "${project.title}".`,
        link: `/artist/projects/${projectId}/files`,
        resourceId: file._id,
        resourceType: 'File',
      });
    }

    await file.populate('uploadedBy', 'aka avatar');
    res.status(201).json({ success: true, message: 'Fichier uploadé avec succès.', file });
  } catch (err) { next(err); }
};

// ── GET /api/files/project/:projectId ─────────────────────
const getProjectFiles = async (req, res, next) => {
  try {
    const { category, latestOnly } = req.query;
    const filter = { project: req.params.projectId, isDeleted: false };
    if (category) filter.category = category;
    if (latestOnly === 'true') filter.isLatestVersion = true;

    const files = await File.find(filter)
      .sort({ createdAt: -1 })
      .populate('uploadedBy', 'aka avatar')
      .populate('parentFile', 'originalName versionNumber');

    res.json({ success: true, files });
  } catch (err) { next(err); }
};

// ── GET /api/files/:id/versions ───────────────────────────
const getFileVersions = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return next(createError('Fichier introuvable.', 404));

    // Find root of the version tree
    const rootId = file.parentFile || file._id;
    const versions = await File.find({
      $or: [{ _id: rootId }, { parentFile: rootId }],
      isDeleted: false,
    }).sort({ versionNumber: 1 }).populate('uploadedBy', 'aka');

    res.json({ success: true, versions });
  } catch (err) { next(err); }
};

// ── POST /api/files/:id/comment ───────────────────────────
const addFileComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return next(createError('Commentaire requis.', 400));

    const file = await File.findById(req.params.id);
    if (!file) return next(createError('Fichier introuvable.', 404));

    file.comments.push({ author: req.user._id, content });
    await file.save();
    await file.populate('comments.author', 'aka avatar');

    res.json({ success: true, comments: file.comments });
  } catch (err) { next(err); }
};

// ── DELETE /api/files/:id ─────────────────────────────────
const deleteFile = async (req, res, next) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return next(createError('Fichier introuvable.', 404));

    // Soft delete
    file.isDeleted = true;
    file.deletedAt = new Date();
    await file.save();

    res.json({ success: true, message: 'Fichier supprimé.' });
  } catch (err) { next(err); }
};

module.exports = { uploadFile, getProjectFiles, getFileVersions, addFileComment, deleteFile };
