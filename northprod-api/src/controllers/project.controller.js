const Project = require('../models/Project');
const Notification = require('../models/Notification');
const { createError } = require('../middleware/error');
const { sendProjectUpdate } = require('../services/email.service');

// ── GET /api/projects ─────────────────────────────────────
const getMyProjects = async (req, res, next) => {
  try {
    const { stage, archived, page = 1, limit = 10 } = req.query;
    const filter = {};

    if (req.user.role === 'artist') {
      filter.artist = req.user._id;
    }
    // production and admin see all projects (no user-scoped filter)

    if (stage) filter.stage = stage;
    filter.isArchived = archived === 'true';

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('artist', 'aka avatar email')
        .populate('engineer', 'aka avatar')
        .populate('booking', 'date type startTime'),
      Project.countDocuments(filter),
    ]);

    res.json({ success: true, projects, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// ── GET /api/projects/all (admin) ─────────────────────────
const getAllProjects = async (req, res, next) => {
  try {
    const { stage, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (stage) filter.stage = stage;

    const [projects, total] = await Promise.all([
      Project.find(filter)
        .sort({ updatedAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .populate('artist', 'aka avatar email')
        .populate('engineer', 'aka'),
      Project.countDocuments(filter),
    ]);

    res.json({ success: true, projects, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

// ── GET /api/projects/:id ─────────────────────────────────
const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('artist', 'aka avatar email phone')
      .populate('engineer', 'aka avatar')
      .populate('booking', 'date type startTime totalPrice')
      .populate({ path: 'files', match: { isDeleted: false } })
      .populate('history.updatedBy', 'aka role');

    if (!project) return next(createError('Projet introuvable.', 404));

    // Access control
    if (req.user.role === 'artist' && project.artist._id.toString() !== req.user._id.toString()) {
      return next(createError('Accès refusé.', 403));
    }

    res.json({ success: true, project });
  } catch (err) { next(err); }
};

// ── PUT /api/projects/:id/stage (production/admin) ────────
const updateProjectStage = async (req, res, next) => {
  try {
    const { stage, comment } = req.body;
    const validStages = Project.getStages();

    if (!validStages.includes(stage)) {
      return next(createError('Étape invalide.', 400));
    }

    const project = await Project.findById(req.params.id).populate('artist');
    if (!project) return next(createError('Projet introuvable.', 404));

    const previousStage = project.stage;
    project.stage = stage;

    // Add to history
    project.history.push({
      stage,
      comment: comment || `Passage à l'étape: ${stage}`,
      updatedBy: req.user._id,
    });

    await project.save();

    // Notify artist
    await Notification.createAndEmit({
      recipient: project.artist._id,
      type: 'project_updated',
      title: 'Mise à jour de votre projet 🎚️',
      message: `"${project.title}" est maintenant en phase: ${project.stageLabel}. ${project.progress}% complété.`,
      link: `/artist/projects/${project._id}`,
      resourceId: project._id,
      resourceType: 'Project',
    });

    // Send email notification
    sendProjectUpdate(project.artist, project, comment).catch(console.error);

    res.json({ success: true, message: 'Étape mise à jour.', project });
  } catch (err) { next(err); }
};

// ── POST /api/projects/:id/comment ────────────────────────
const addComment = async (req, res, next) => {
  try {
    const { comment } = req.body;
    if (!comment?.trim()) return next(createError('Commentaire requis.', 400));

    const project = await Project.findById(req.params.id).populate('artist');
    if (!project) return next(createError('Projet introuvable.', 404));

    project.history.push({
      stage: project.stage,
      comment,
      updatedBy: req.user._id,
    });

    await project.save();

    // Notify artist if comment from engineer
    if (req.user.role !== 'artist') {
      await Notification.createAndEmit({
        recipient: project.artist._id,
        type: 'project_updated',
        title: 'Nouveau commentaire sur votre projet',
        message: `L'ingénieur a ajouté une note sur "${project.title}".`,
        link: `/artist/projects/${project._id}`,
        resourceId: project._id,
        resourceType: 'Project',
      });
    }

    res.json({ success: true, message: 'Commentaire ajouté.', history: project.history });
  } catch (err) { next(err); }
};

// ── PUT /api/projects/:id/details ─────────────────────────
const updateProjectDetails = async (req, res, next) => {
  try {
    const allowed = ['title', 'description', 'genre', 'bpm', 'key', 'engineer'];
    const updates = {};
    allowed.forEach((f) => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    const project = await Project.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!project) return next(createError('Projet introuvable.', 404));

    res.json({ success: true, message: 'Projet mis à jour.', project });
  } catch (err) { next(err); }
};

module.exports = {
  getMyProjects, getAllProjects, getProject,
  updateProjectStage, addComment, updateProjectDetails,
};
