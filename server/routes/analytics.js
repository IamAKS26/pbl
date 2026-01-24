const express = require('express');
const router = express.Router();
const {
    getStudentActivity,
    getInactiveStudents,
    getStudentPerformance
} = require('../controllers/analyticsController');
const { protect, authorizeTeacher } = require('../middleware/auth');

// Public analytics (protected but allowed for students)
router.get('/performance', protect, getStudentPerformance);

// Teacher-only analytics
router.use(protect);
router.use(authorizeTeacher);

router.get('/student-activity', getStudentActivity);
router.get('/inactive-students', getInactiveStudents);

module.exports = router;
