const express = require('express');
const router = express.Router();
const {
    getStudentActivity,
    getInactiveStudents,
} = require('../controllers/analyticsController');
const { protect, authorizeTeacher } = require('../middleware/auth');

// All routes require authentication and teacher role
router.use(protect);
router.use(authorizeTeacher);

router.get('/student-activity', getStudentActivity);
router.get('/inactive-students', getInactiveStudents);

module.exports = router;
