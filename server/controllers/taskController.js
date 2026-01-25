const Task = require('../models/Task');
const Project = require('../models/Project'); // Trigger restart
const Group = require('../models/Group');
const Notification = require('../models/Notification'); // Import Notification model
const User = require('../models/User'); // Import User model for XP updates
const { fetchCommits, parseGitHubUrl } = require('../config/github');
const gamification = require('../utils/gamification');

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

        // Students see tasks if:
        // 1. They are the assignee (direct assignment)
        // 2. The task belongs to a project assigned to their group
        if (req.user.role === 'Student') {
            const group = await Group.findOne({ members: req.user.id });

            if (group && group.project) {
                // If student is in a group with a project, show ALL tasks for that project
                // OR tasks explicitly assigned to them (though usually project tasks cover it)
                query = {
                    $or: [
                        { project: group.project },
                        { assignee: req.user.id }
                    ]
                }
            } else {
                // Fallback: only show direct assignments
                query.assignee = req.user.id;
            }
        } else if (req.user.role === 'Teacher') {
            // Teachers should only see tasks for their own projects
            const myProjects = await Project.find({ teacher: req.user.id }).select('_id');
            const myProjectIds = myProjects.map(p => p._id);

            if (projectId) {
                // Verify this project belongs to teacher
                // If projectId is in query but not in myProjectIds, return empty result (or 403, but empty is safe filter)
                if (!myProjectIds.some(id => id.toString() === projectId)) {
                    return res.status(200).json({ success: true, count: 0, tasks: [] });
                }
                query.project = projectId;
            } else {
                query.project = { $in: myProjectIds };
            }
        }

        const tasks = await Task.find(query)
            .populate('assignee', 'name email')
            .populate({
                path: 'project',
                select: 'title teacher',
                populate: {
                    path: 'teacher',
                    select: 'name email'
                }
            })
            .populate('feedbackBy', 'name email')
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
            .populate({
                path: 'project',
                select: 'title teacher',
                populate: {
                    path: 'teacher',
                    select: 'name email'
                }
            })
            .populate('feedbackBy', 'name email');

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
        const { title, description, project, assignee, status, priority, points } = req.body;

        // Validate required fields
        if (!title || !project) {
            return res.status(400).json({
                success: false,
                message: 'Please provide title and project',
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
            status: status || 'Backlog',
            priority: priority || 'Medium',
            points: points || 10, // Default to 10 if not specified
        });

        const populatedTask = await Task.findById(task._id)
            .populate('assignee', 'name email')
            .populate({
                path: 'project',
                select: 'title teacher',
                populate: {
                    path: 'teacher',
                    select: 'name email'
                }
            });

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

        if (!task.project) {
            console.error(`[UpdateTask] Task ${req.params.id} has no project linked.`);
            // Allow update if user is assignee? No, unsafe. 
            // But if we return 404 here, at least it's not a 500 crash.
            return res.status(404).json({
                success: false,
                message: 'Task project not found',
            });
        }

        // Safely check for teacher and assignee with robust logging
        const teacherId = task.project.teacher ? task.project.teacher.toString() : null;
        const assigneeId = task.assignee ? task.assignee.toString() : null;
        // Use explicitly cast IDs for comparison
        const userId = req.user.id ? req.user.id.toString() : (req.user._id ? req.user._id.toString() : null);

        console.log(`[UpdateTask Auth] Task: ${req.params.id}`);
        console.log(`[UpdateTask Auth] Teacher: ${teacherId} vs User: ${userId}`);
        console.log(`[UpdateTask Auth] Assignee: ${assigneeId} vs User: ${userId}`);

        const isTeacher = teacherId && teacherId === userId;
        const isAssignee = assigneeId && assigneeId === userId;

        let isGroupMember = false;
        if (!isTeacher && !isAssignee) {
            // Check if user is in the group assigned to this project
            const userGroup = await Group.findOne({ project: task.project, members: req.user.id });
            if (userGroup) {
                isGroupMember = true;
            }
        }

        if (!isTeacher && !isAssignee && !isGroupMember) {
            console.log('[UpdateTask] Auth Failed: User is neither teacher, assignee, nor group member');
            return res.status(403).json({
                success: false,
                message: 'Not authorized to update this task',
                debug: `User: ${userId}, Assignee: ${assigneeId}, Teacher: ${teacherId}`
            });
        }

        // Students can only update status (for drag-drop) or submit code
        let updateData = req.body;

        if (req.user.role === 'Student') {
            const allowedKeys = ['status', 'codeSubmission', 'submissionType', 'evidenceLinks']; // Added submissionType/evidenceLinks just in case
            const keys = Object.keys(req.body);
            const hasInvalidKeys = keys.some(key => !allowedKeys.includes(key));

            if (hasInvalidKeys) {
                console.log('[UpdateTask] Blocked student update with invalid keys:', keys);
                return res.status(403).json({
                    success: false,
                    message: 'You are only allowed to update task status or submission details.'
                });
            }
        }

        const updatedTask = await Task.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        )
            .populate('assignee', 'name email')
            .populate({
                path: 'project',
                select: 'title teacher',
                populate: {
                    path: 'teacher',
                    select: 'name email'
                }
            });

        // NOTIFICATION LOGIC:
        // If student submits code (status change to Review) or just code submission
        if (req.user.role === 'Student' && (req.body.status === 'Review' || req.body.status === 'Ready for Review' || req.body.codeSubmission)) {
            try {
                // Find project teacher
                const project = await Project.findById(updatedTask.project._id || updatedTask.project);
                if (project && project.teacher) {
                    await Notification.create({
                        recipient: project.teacher,
                        sender: req.user.id,
                        type: 'submission',
                        message: `${req.user.name || 'Student'} submitted code for task "${updatedTask.title}"`,
                        relatedId: updatedTask._id,
                        onModel: 'Task'
                    });
                }
            } catch (notifErr) {
                console.error('Notification error:', notifErr);
                // Don't fail the request if notification fails
            }
        }

        // Gamification: Pay out XP and Check Achievements
        let xpAwarded = false;
        let points = 0;
        let newAchievments = [];
        let levelUp = false;

        if (updatedTask.assignee && (updatedTask.status === 'Done' || updatedTask.status === 'Completed') && !updatedTask.xpAwarded) {
            const user = await User.findById(updatedTask.assignee);
            if (user) {
                // 1. Award XP
                points = updatedTask.points || 10;
                user.xp = (user.xp || 0) + points;

                // 2. Calculate Level
                const oldLevel = gamification.calculateLevel(user.xp - points);
                const newLevel = gamification.calculateLevel(user.xp);
                if (newLevel > oldLevel) {
                    levelUp = true;
                }

                updatedTask.xpAwarded = true;
                xpAwarded = true;
                await updatedTask.save();

                // 3. Check Achievements
                const completedTasks = await Task.countDocuments({
                    assignee: user._id,
                    status: { $in: ['Done', 'Completed'] }
                });

                const projectTasks = await Task.find({ project: updatedTask.project });
                const allDone = projectTasks.length > 0 && projectTasks.every(t => t.status === 'Done' || t.status === 'Completed');

                const stats = {
                    completedTasks,
                    projectCompleted: allDone
                };

                const badges = gamification.checkBadges(user, updatedTask, stats);

                if (badges.length > 0) {
                    badges.forEach(b => {
                        if (!user.badges.includes(b.id)) {
                            user.badges.push(b.id);
                            newAchievments.push(b);
                        }
                    });
                }

                await user.save();
            }
        }

        res.status(200).json({
            success: true,
            message: 'Task updated successfully',
            task: updatedTask,
            xpAwarded,
            points,
            achievements: newAchievments,
            levelUp,
            userXP: xpAwarded ? (await User.findById(updatedTask.assignee)).xp : undefined,
            userLevel: xpAwarded ? gamification.calculateLevel((await User.findById(updatedTask.assignee)).xp) : undefined
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

        // Allow assignee OR group member
        const isAssignee = task.assignee && task.assignee.toString() === req.user.id;
        let isAuthorized = isAssignee;

        if (!isAuthorized) {
            const userGroup = await Group.findOne({ project: task.project, members: req.user.id });
            if (userGroup) isAuthorized = true;
        }

        if (!isAuthorized) {
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

        // NOTIFICATION LOGIC: Evidence Added
        const project = await Project.findById(task.project);
        if (project && project.teacher) {
            await Notification.create({
                recipient: project.teacher,
                sender: req.user.id,
                type: 'evidence',
                message: `${req.user.name} added evidence to task "${task.title}"`,
                relatedId: task._id,
                onModel: 'Task'
            });
        }

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

        // Allow assignee OR group member
        const isAssignee = task.assignee && task.assignee.toString() === req.user.id;
        let isAuthorized = isAssignee;

        if (!isAuthorized) {
            const userGroup = await Group.findOne({ project: task.project, members: req.user.id });
            if (userGroup) isAuthorized = true;
        }

        if (!isAuthorized) {
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

        // NOTIFICATION LOGIC: Repo Linked
        const project = await Project.findById(task.project);
        if (project && project.teacher) {
            await Notification.create({
                recipient: project.teacher,
                sender: req.user.id,
                type: 'submission',
                message: `${req.user.name} linked GitHub repo to task "${task.title}"`,
                relatedId: task._id,
                onModel: 'Task'
            });
        }

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

        // Allow assignee OR group member
        const isAssignee = task.assignee && task.assignee.toString() === req.user.id;
        let isAuthorized = isAssignee;

        if (!isAuthorized) {
            const userGroup = await Group.findOne({ project: task.project, members: req.user.id });
            if (userGroup) isAuthorized = true;
        }

        if (!isAuthorized) {
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

// @desc    Add teacher feedback to task
// @route   PATCH /api/tasks/:id/feedback
// @access  Private (Teacher only)
exports.addFeedback = async (req, res) => {
    try {
        const { feedback } = req.body;
        if (!feedback) {
            return res.status(400).json({ success: false, message: 'Feedback text is required' });
        }
        const task = await Task.findById(req.params.id).populate('project');
        if (!task) {
            return res.status(404).json({ success: false, message: 'Task not found' });
        }
        // Verify teacher is the project teacher
        if (task.project.teacher.toString() !== req.user.id) {
            return res.status(403).json({ success: false, message: 'Not authorized to add feedback' });
        }
        task.feedback = feedback;
        task.feedbackBy = req.user.id;
        task.feedbackAt = new Date();
        await task.save();
        // Notify student
        await Notification.create({
            recipient: task.assignee,
            sender: req.user.id,
            type: 'feedback',
            message: `${req.user.name} provided feedback for task "${task.title}"`,
            relatedId: task._id,
            onModel: 'Task'
        });
        const populatedTask = await Task.findById(task._id)
            .populate('assignee', 'name email')
            .populate('project', 'title');
        res.status(200).json({ success: true, message: 'Feedback added', task: populatedTask });
    } catch (error) {
        console.error('Add feedback error:', error);
        res.status(500).json({ success: false, message: error.message || 'Error adding feedback' });
    }
};
