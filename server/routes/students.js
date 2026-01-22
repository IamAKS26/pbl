const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect, authorizeTeacher } = require('../middleware/auth');

// @desc    Get all students
// @route   GET /api/students
// @access  Private/Teacher
router.get('/', protect, authorizeTeacher, async (req, res) => {
    try {
        const students = await User.find({ role: 'Student' }).select('-password');
        res.json({ success: true, students });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @desc    Update student mastery
// @route   PUT /api/students/:id/mastery
// @access  Private/Teacher
router.put('/:id/mastery', protect, authorizeTeacher, async (req, res) => {
    try {
        const { mastery } = req.body;
        const student = await User.findByIdAndUpdate(
            req.params.id,
            { mastery },
            { new: true, runValidators: true }
        ).select('-password');

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        res.json({ success: true, student });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
