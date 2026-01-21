const Task = require('../models/Task');
const Project = require('../models/Project');
const { fetchCommits, parseGitHubUrl } = require('../config/github');

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Private
exports.getTasks = async (req, res) => {
    try {
        const { projectId } = req.query;
        let query = {};

        if (projectId) {
            query.project = projectId;
        }

        // Students only see their own tasks
        if (req.user.role === 'Student') {
            query.assignee = req.user.id;
        }

        const tasks = await Task.find(query)
            .populate('assignee', 'name email')
            .populate('project', 'title')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: tasks.length,
            tasks,
        });
    } catch (error) {
        console.error('Get tasks error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching tasks',
            error: error.message,
        });
    }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
// @access  Private
exports.getTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id)
            .populate('assignee', 'name email')
            .populate('project', 'title teacher');

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        res.status(200).json({
            success: true,
            task,
        });
    } catch (error) {
        console.error('Get task error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching task',
            error: error.message,
        });
    }
};

// @desc    Create new task
// @route   POST /api/tasks
// @access  Private (Teacher only)
exports.createTask = async (req, res) => {
    try {
        const { title, description, project, assignee, status, priority } = req.body;

        // Validate required fields
        if (!title || !project || !assignee) {
            return res.status(400).json({
                success: false,
                message: 'Please provide title, project, and assignee',
            });
        }

        // Verify project exists and user is the teacher
        const projectDoc = await Project.findById(project);
        if (!projectDoc) {
            return res.status(404).json({
                success: false,
                message: 'Project not found',
            });
        }

        if (projectDoc.teacher.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to create tasks for this project',
            });
        }

        const task = await Task.create({
            title,
            description,
            project,
            assignee,
            status: status || projectDoc.columns[0], // Default to first column
            priority: priority || 'Medium',
        });

        const populatedTask = await Task.findById(task._id)
            .populate('assignee', 'name email')
            .populate('project', 'title');

        res.status(201).json({
            success: true,
            message: 'Task created successfully',
            task: populatedTask,
        });
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating task',
            error: error.message,
        });
    }
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
exports.updateTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate('project');

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        // Teachers can update any task in their projects
        // Students can only update their own tasks (for status changes via drag-drop)
        const isTeacher = task.project.teacher.toString() === req.user.id;
        const isAssignee = task.assignee.toString() === req.user.id;

        if (!isTeacher && !isAssignee) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this task',
            });
        }

        // Students can only update status (for drag-drop)
        if (req.user.role === 'Student' && Object.keys(req.body).some(key => key !== 'status')) {
            return res.status(403).json({
                success: false,
                message: 'Students can only update task status',
            });
        }

        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        )
            .populate('assignee', 'name email')
            .populate('project', 'title');

        res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            task: updatedTask,
        });
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({
            success: false,
            message: 'Error updating task',
            error: error.message,
        });
    }
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private (Teacher only)
exports.deleteTask = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id).populate('project');

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        // Only project teacher can delete tasks
        if (task.project.teacher.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this task',
            });
        }

        await task.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Task deleted successfully',
        });
    } catch (error) {
        console.error('Delete task error:', error);
        res.status(500).json({
            success: false,
            message: 'Error deleting task',
            error: error.message,
        });
    }
};

// @desc    Add evidence to task
// @route   POST /api/tasks/:id/evidence
// @access  Private (Student - own tasks)
exports.addEvidence = async (req, res) => {
    try {
        const { url, publicId, resourceType } = req.body;

        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        // Only assignee can add evidence
        if (task.assignee.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to add evidence to this task',
            });
        }

        task.evidenceLinks.push({
            url,
            publicId,
            resourceType,
            uploadedAt: new Date(),
        });

        await task.save();

        res.status(200).json({
            success: true,
            message: 'Evidence added successfully',
            task,
        });
    } catch (error) {
        console.error('Add evidence error:', error);
        res.status(500).json({
            success: false,
            message: 'Error adding evidence',
            error: error.message,
        });
    }
};

// @desc    Link GitHub repository to task
// @route   POST /api/tasks/:id/github-repo
// @access  Private (Student - own tasks)
exports.linkGitHubRepo = async (req, res) => {
    try {
        const { repoUrl } = req.body;

        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        // Only assignee can link GitHub repo
        if (task.assignee.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to link GitHub repo to this task',
            });
        }

        // Parse GitHub URL
        const { owner, repo } = parseGitHubUrl(repoUrl);

        task.githubRepo = {
            url: repoUrl,
            owner,
            repo,
        };

        await task.save();

        res.status(200).json({
            success: true,
            message: 'GitHub repository linked successfully',
            task,
        });
    } catch (error) {
        console.error('Link GitHub repo error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error linking GitHub repository',
        });
    }
};

// @desc    Sync commits from GitHub repository
// @route   POST /api/tasks/:id/sync-commits
// @access  Private (Student - own tasks)
exports.syncGitHubCommits = async (req, res) => {
    try {
        const task = await Task.findById(req.params.id);

        if (!task) {
            return res.status(404).json({
                success: false,
                message: 'Task not found',
            });
        }

        // Only assignee can sync commits
        if (task.assignee.toString() !== req.user.id) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to sync commits for this task',
            });
        }

        if (!task.githubRepo || !task.githubRepo.owner || !task.githubRepo.repo) {
            return res.status(400).json({
                success: false,
                message: 'No GitHub repository linked to this task',
            });
        }

        // Fetch commits from GitHub
        const commits = await fetchCommits(task.githubRepo.owner, task.githubRepo.repo);

        task.githubCommits = commits;
        await task.save();

        res.status(200).json({
            success: true,
            message: `Synced ${commits.length} commits successfully`,
            commits,
        });
    } catch (error) {
        console.error('Sync commits error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error syncing GitHub commits',
        });
    }
};
