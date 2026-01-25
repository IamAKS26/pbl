const express = require('express');
const router = express.Router();
const {
    getSystemStats,
    getAllUsers,
    getAllGroups,
    getAllProjects,
    toggleUserStatus,
    getSystemLogs
} = require('../controllers/adminController');
const { protect, authorizeAdmin } = require('../middleware/auth');

// All routes are protected and require Admin role
router.use(protect);
router.use(authorizeAdmin);

router.get('/stats', getSystemStats);
router.get('/users', getAllUsers);
router.get('/groups', getAllGroups);
router.get('/projects', getAllProjects);
router.get('/logs', getSystemLogs);
router.patch('/users/:id/status', toggleUserStatus);

module.exports = router;
