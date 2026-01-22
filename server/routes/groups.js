const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const { protect, authorizeTeacher } = require('../middleware/auth');

// @desc    Create a group
// @route   POST /api/groups
// @access  Private/Teacher
router.post('/', protect, authorizeTeacher, async (req, res) => {
    try {
        const { name, members, averageMastery } = req.body;

        const group = await Group.create({
            name,
            members,
            averageMastery,
            createdBy: req.user.id
        });

        // Populate members
        await group.populate('members', 'name email mastery');

        res.status(201).json({ success: true, group });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @desc    Get all groups created by teacher
// @route   GET /api/groups
// @access  Private/Teacher
router.get('/', protect, authorizeTeacher, async (req, res) => {
    try {
        const groups = await Group.find({ createdBy: req.user.id })
            .populate('members', 'name email mastery')
            .populate('project', 'title');

        res.json({ success: true, groups });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @desc    Update group (manage members or assign project)
// @route   PUT /api/groups/:id
// @access  Private/Teacher
router.put('/:id', protect, authorizeTeacher, async (req, res) => {
    try {
        const { name, members, project, averageMastery } = req.body;

        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        // Ensure teacher owns the group
        if (group.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        group.name = name || group.name;
        group.members = members || group.members;
        group.project = project === 'null' ? null : (project || group.project); // Handle unassignment
        group.averageMastery = averageMastery || group.averageMastery;

        await group.save();
        await group.populate('members', 'name email mastery');
        if (group.project) await group.populate('project', 'title');

        res.json({ success: true, group });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

// @desc    Delete a group
// @route   DELETE /api/groups/:id
// @access  Private/Teacher
router.delete('/:id', protect, authorizeTeacher, async (req, res) => {
    try {
        const group = await Group.findById(req.params.id);

        if (!group) {
            return res.status(404).json({ success: false, message: 'Group not found' });
        }

        // Ensure teacher owns the group
        if (group.createdBy.toString() !== req.user.id) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        await group.deleteOne();

        res.json({ success: true, message: 'Group removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server Error' });
    }
});

module.exports = router;
