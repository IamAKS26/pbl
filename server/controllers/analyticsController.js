const Task = require('../models/Task');
const User = require('../models/User');

// @desc    Get student activity metrics
// @route   GET /api/analytics/student-activity
// @access  Private (Teacher only)
exports.getStudentActivity = async (req, res) => {
    try {
        const { projectId } = req.query;

        // Get all students
        const students = await User.find({ role: 'Student' });

        const activityData = await Promise.all(
            students.map(async (student) => {
                let query = { assignee: student._id };
                if (projectId) {
                    query.project = projectId;
                }

                const tasks = await Task.find(query);

                // Calculate metrics
                const totalTasks = tasks.length;
                const completedTasks = tasks.filter(t => t.status === 'Completed').length;
                const evidenceCount = tasks.reduce((sum, t) => sum + t.evidenceLinks.length, 0);
                const commitCount = tasks.reduce((sum, t) => sum + t.githubCommits.length, 0);

                // Find most recent activity
                let lastActivity = null;
                if (tasks.length > 0) {
                    const mostRecent = tasks.reduce((latest, task) => {
                        return task.lastUpdated > latest.lastUpdated ? task : latest;
                    });
                    lastActivity = mostRecent.lastUpdated;
                }

                // Calculate days since last activity
                let daysSinceActivity = null;
                if (lastActivity) {
                    const diffTime = Math.abs(new Date() - new Date(lastActivity));
                    daysSinceActivity = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                }

                return {
                    student: {
                        id: student._id,
                        name: student.name,
                        email: student.email,
                    },
                    metrics: {
                        totalTasks,
                        completedTasks,
                        evidenceCount,
                        commitCount,
                        lastActivity,
                        daysSinceActivity,
                        completionRate: totalTasks > 0 ? ((completedTasks / totalTasks) * 100).toFixed(1) : 0,
                    },
                };
            })
        );

        res.status(200).json({
            success: true,
            count: activityData.length,
            data: activityData,
        });
    } catch (error) {
        console.error('Get student activity error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching student activity',
            error: error.message,
        });
    }
};

// @desc    Get inactive students (>3 days)
// @route   GET /api/analytics/inactive-students
// @access  Private (Teacher only)
exports.getInactiveStudents = async (req, res) => {
    try {
        const { projectId, days = 3 } = req.query;

        const students = await User.find({ role: 'Student' });

        const inactiveStudents = [];

        for (const student of students) {
            let query = { assignee: student._id };
            if (projectId) {
                query.project = projectId;
            }

            const tasks = await Task.find(query);

            if (tasks.length === 0) {
                // Student has no tasks
                inactiveStudents.push({
                    student: {
                        id: student._id,
                        name: student.name,
                        email: student.email,
                    },
                    reason: 'No tasks assigned',
                    daysSinceActivity: null,
                });
                continue;
            }

            // Find most recent activity
            const mostRecent = tasks.reduce((latest, task) => {
                return task.lastUpdated > latest.lastUpdated ? task : latest;
            });

            const diffTime = Math.abs(new Date() - new Date(mostRecent.lastUpdated));
            const daysSinceActivity = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (daysSinceActivity > parseInt(days)) {
                inactiveStudents.push({
                    student: {
                        id: student._id,
                        name: student.name,
                        email: student.email,
                    },
                    reason: `No activity for ${daysSinceActivity} days`,
                    daysSinceActivity,
                    lastActivity: mostRecent.lastUpdated,
                });
            }
        }

        res.status(200).json({
            success: true,
            count: inactiveStudents.length,
            threshold: `${days} days`,
            students: inactiveStudents,
        });
    } catch (error) {
        console.error('Get inactive students error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching inactive students',
            error: error.message,
        });
    }
};
