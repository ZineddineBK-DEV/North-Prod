const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  getMyProjects, getAllProjects, getProject,
  updateProjectStage, addComment, updateProjectDetails,
} = require('../controllers/project.controller');

router.get('/all', protect, authorize('production', 'admin'), getAllProjects);
router.get('/', protect, getMyProjects);
router.get('/:id', protect, getProject);
router.put('/:id/stage', protect, authorize('production', 'admin'), updateProjectStage);
router.post('/:id/comment', protect, authorize('production', 'admin'), addComment);
router.put('/:id/details', protect, authorize('production', 'admin'), updateProjectDetails);

module.exports = router;
