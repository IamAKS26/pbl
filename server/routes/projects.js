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

// @desc    Create a project
// @route   POST /api/projects
// @access  Private/Teacher
router.post('/', protect, authorizeTeacher, async (req, res) => {
    try {
        const { title, description, deadline, tasks } = req.body; // Added tasks

        // Assuming Project model is available, e.g., imported or globally accessible
        // If not, you'd need to import it: const Project = require('../models/Project');
        const Project = require('../models/Project'); // Explicitly importing Project model here

        const project = await Project.create({
            title,
            description,
            deadline,
            teacher: req.user.id
        });

        // If initial tasks are provided (e.g. from AI)
        if (tasks && tasks.length > 0) {
            const Task = require('../models/Task'); // Ensure Task model is imported
            const initialTasks = tasks.map(t => ({
                title: t.title,
                description: t.description, // detailed markdown from AI
                project: project._id,
                status: 'To Do',
                // phase: t.phase // optionally store phase if Task model supports it
            }));
            await Task.insertMany(initialTasks);
        }

        res.status(201).json({ success: true, project });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

router.route('/:id')
    .get(getProject)
    .put(authorizeTeacher, updateProject)
    .delete(authorizeTeacher, deleteProject);

module.exports = router;
