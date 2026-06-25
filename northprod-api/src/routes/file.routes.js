const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadProjectFile } = require('../config/multer');
const {
  uploadFile, getProjectFiles, getFileVersions,
  addFileComment, deleteFile,
} = require('../controllers/file.controller');

router.post('/upload', protect, uploadProjectFile.single('file'), uploadFile);
router.get('/project/:projectId', protect, getProjectFiles);
router.get('/:id/versions', protect, getFileVersions);
router.post('/:id/comment', protect, addFileComment);
router.delete('/:id', protect, deleteFile);

module.exports = router;
