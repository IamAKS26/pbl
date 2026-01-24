const express = require('express');
const router = express.Router();
const {
    getTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    addEvidence,
    linkGitHubRepo,
    syncGitHubCommits,
    addFeedback,
} = require('../controllers/taskController');
const { protect, authorizeTeacher } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

router.route('/')
    .get(getTasks)
    .post(authorizeTeacher, createTask);

router.route('/:id')
    .get(getTask)
    .put(updateTask)
    .delete(authorizeTeacher, deleteTask);

router.post('/:id/evidence', addEvidence);
router.post('/:id/github-repo', linkGitHubRepo);
router.post('/:id/sync-commits', syncGitHubCommits);

router.patch('/:id/feedback', authorizeTeacher, addFeedback);

module.exports = router;
