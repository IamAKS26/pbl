const express = require('express');
const router = express.Router();
const {
    getProjects,
    getProject,
    createProject,
    updateProject,
    deleteProject,
    assignTemplate
} = require('../controllers/projectController');
const { protect, authorizeTeacher } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.post('/assign-template', authorizeTeacher, assignTemplate);

router.route('/')
    .get(getProjects)
    .post(authorizeTeacher, createProject);

router.route('/:id')
    .get(getProject)
    .put(authorizeTeacher, updateProject)
    .delete(authorizeTeacher, deleteProject);

module.exports = router;
