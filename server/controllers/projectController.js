const Project = require('../models/Project');
const Task = require('../models/Task');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Private
exports.getProjects = async (req, res) => {
    try {
        let query;

        // Teachers see their own projects
        if (req.user.role === 'Teacher') {
            query = { teacher: req.user.id };
        } else {
            // Students see projects they're assigned to
            query = { students: req.user.id };
        }

        const projects = await Project.find(query)
            .populate('teacher', 'name email')
            .populate('students', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: projects.length,
            projects,
        });
    } catch (error) {
        console.error('Get projects error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching projects',
            error: error.message,
        });
    }
};

// @desc    Get single project
// @route   GET /api/projects/:id
// @access  Private
exports.getProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('teacher', 'name email')
            .populate('students', 'name email');

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found',
            });
        }

        // Check authorization
        const isTeacher = project.teacher._id.toString() === req.user.id;
        const isStudent = project.students.some(s => s._id.toString() === req.user.id);

        if (!isTeacher && !isStudent) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to access this project',
            });
        }

        // Get tasks for this project
        const tasks = await Task.find({ project: project._id })
            .populate('assignee', 'name email');

        res.status(200).json({
            success: true,
            project,
            tasks,
        });
    } catch (error) {
        console.error('Get project error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching project',
            error: error.message,
        });
    }
};

// @desc    Create new project
// @route   POST /api/projects
// @access  Private (Teacher only)
exports.createProject = async (req, res) => {
    try {
        const { title, description, deadline, columns, students } = req.body;

        // Validate required fields
        if (!title || !description || !deadline) {
            return res.status(400).json({
                success: false,
                message: 'Please provide title, description, and deadline',
            });
        }

        const project = await Project.create({
            title,
            description,
            deadline,
            teacher: req.user.id,
            columns: columns || ['Backlog', 'In Progress', 'Ready for Review', 'Done'],
            students: students || [],
        });

        const populatedProject = await Project.findById(project._id)
            .populate('teacher', 'name email')
            .populate('students', 'name email');

        res.status(201).json({
            success: true,
            message: 'Project created successfully',
            project: populatedProject,
        });
    } catch (error) {
        console.error('Create project error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating project',
            error: error.message,
        });
    }
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (Teacher only - own projects)
exports.updateProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found',
            });
        }

        // Check if user is the project owner
        if (project.teacher.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this project',
            });
        }

        const updatedProject = await Project.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('teacher', 'name email')
            .populate('students', 'name email');

        res.status(200).json({
            success: true,
            message: 'Project updated successfully',
            project: updatedProject,
        });
    } catch (error) {
        console.error('Update project error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating project',
            error: error.message,
        });
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (Teacher only - own projects)
exports.deleteProject = async (req, res) => {
    try {
        const project = await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({
                success: false,
                message: 'Project not found',
            });
        }

        // Check if user is the project owner
        if (project.teacher.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this project',
            });
        }

        // Delete all tasks associated with this project
        await Task.deleteMany({ project: req.params.id });

        await project.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Project and associated tasks deleted successfully',
        });
    } catch (error) {
        console.error('Delete project error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting project',
            error: error.message,
        });
    }
};
// @desc    Assign a project template to a group
// @route   POST /api/projects/assign-template
// @access  Private (Teacher only)
exports.assignTemplate = async (req, res) => {
    try {
        const { groupId, templateId, deadline } = req.body;
        const templates = require('../config/templates');
        const Group = require('../models/Group');

        if (!templates[templateId]) {
            return res.status(404).json({
                success: false,
                message: 'Template not found'
            });
        }

        const template = templates[templateId];
        const group = await Group.findById(groupId);

        if (!group) {
            return res.status(404).json({
                success: false,
                message: 'Group not found'
            });
        }

        // 1. Create Project
        const projectDeadline = deadline || new Date(Date.now() + (template.deadlineOffsetDays * 24 * 60 * 60 * 1000));

        const project = await Project.create({
            title: template.title,
            description: template.description,
            deadline: projectDeadline,
            teacher: req.user.id,
            columns: template.columns,
            students: group.members // Assign all group members to project
        });

        // 2. Create Tasks
        const tasksToCreate = template.tasks.map(t => ({
            ...t,
            project: project._id,
            assignee: group.members[0], // Initally assign to first member or leave unassigned? 
            // Better strategy: Round robin or just unassigned? 
            // For now, let's assign to the first member to avoid validation errors if 'assignee' is required.
            // Model says: assignee required: true.
            // Let's pick random member? Or first.
            // Let's modify Task model to allow null assignee? Or just assign properly.
            // Let's assign to the first member for now.
            assignee: group.members[0]
        }));

        await Task.insertMany(tasksToCreate);

        // 3. Update Group
        group.project = project._id;
        await group.save();

        res.status(200).json({
            success: true,
            message: 'Template assigned successfully',
            project
        });

    } catch (error) {
        console.error('Assign template error:', error);
        res.status(500).json({
            success: false,
            message: 'Error assigning template',
            error: error.message
        });
    }
};
