const User = require('../models/User');
const Group = require('../models/Group');
const Project = require('../models/Project');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

// @desc    Get system overview stats
// @route   GET /api/admin/stats
// @access  Private (Admin)
exports.getSystemStats = async (req, res) => {
    try {
        const studentCount = await User.countDocuments({ role: 'Student' });
        const teacherCount = await User.countDocuments({ role: 'Teacher' });
        const groupCount = await Group.countDocuments();
        const projectCount = await Project.countDocuments();
        const taskCount = await Task.countDocuments();
        const users = await User.find().select('name email role createdAt lastLogin');

        res.status(200).json({
            success: true,
            stats: {
                students: studentCount,
                teachers: teacherCount,
                groups: groupCount,
                projects: projectCount,
                tasks: taskCount
            },
            recentUsers: users.sort((a, b) => b.createdAt - a.createdAt).slice(0, 5)
        });
    } catch (error) {
        console.error('Get system stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching system stats',
            error: error.message
        });
    }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private (Admin)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching users',
            error: error.message
        });
    }
};

// @desc    Get all groups with details
// @route   GET /api/admin/groups
// @access  Private (Admin)
exports.getAllGroups = async (req, res) => {
    try {
        const groups = await Group.find()
            .populate('members', 'name email role')
            .populate({
                path: 'project',
                select: 'title teacher',
                populate: { path: 'teacher', select: 'name email' }
            })
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: groups.length,
            groups
        });
    } catch (error) {
        console.error('Get all groups error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching groups',
            error: error.message
        });
    }
};

// @desc    Get all projects with details
// @route   GET /api/admin/projects
// @access  Private (Admin)
exports.getAllProjects = async (req, res) => {
    try {
        const projects = await Project.find()
            .populate('teacher', 'name email')
            .sort({ createdAt: -1 });

        // For each project, get task count and completion status (expensive but needed for admin)
        const projectsWithStats = await Promise.all(projects.map(async (project) => {
            const tasks = await Task.find({ project: project._id });
            const completed = tasks.filter(t => t.status === 'Completed' || t.status === 'Done').length;
            const groups = await Group.find({ project: project._id }).select('name');

            return {
                ...project.toObject(),
                stats: {
                    totalTasks: tasks.length,
                    completedTasks: completed,
                    progress: tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
                },
                assignedGroups: groups
            };
        }));

        res.status(200).json({
            success: true,
            count: projectsWithStats.length,
            projects: projectsWithStats
        });
    } catch (error) {
        console.error('Get all projects error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching projects',
            error: error.message
        });
    }
};

// @desc    Toggle user status (Active/Inactive) - Placeholder since schema doesn't have status yet
// @route   PATCH /api/admin/users/:id/status
// @access  Private (Admin)
exports.toggleUserStatus = async (req, res) => {
    // Current User model doesn't have a status field, assuming we might add one or just mock for now
    // If you want to add it, we update the model first. For now, strict guidelines say "extend system", 
    // so let's stick to what's available or add 'isActive' to model if strictly required.
    // The prompt requested "Status (active/inactive)" management.
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Toggle a status field if it existed. 
        // Since it wasn't in the original file, I'll add it to the schema in the next step or mock it.
        // Assuming I'll add 'isActive' to User schema.
        user.isActive = user.isActive === undefined ? false : !user.isActive;
        await user.save({ validateBeforeSave: false }); // Skip validation for now

        res.status(200).json({
            success: true,
            message: `User ${user.isActive ? 'activated' : 'deactivated'}`,
            user
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

// @desc    Get all system logs (notifications)
// @route   GET /api/admin/logs
// @access  Private (Admin)
exports.getSystemLogs = async (req, res) => {
    try {
        const logs = await Notification.find()
            .populate('sender', 'name email role')
            .populate('recipient', 'name email role')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: logs.length,
            logs
        });
    } catch (error) {
        console.error('Get system logs error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching system logs',
            error: error.message
        });
    }
};
