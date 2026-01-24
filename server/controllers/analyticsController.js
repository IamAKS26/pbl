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
// @desc    Get student performance (XP history)
// @route   GET /api/analytics/performance
// @access  Private (Student/Teacher)
exports.getStudentPerformance = async (req, res) => {
    try {
        let userId = req.user.id;

        // If teacher, allow viewing a specific student
        if (req.user.role === 'Teacher' && req.query.studentId) {
            userId = req.query.studentId;
        }

        // Find all completed tasks for this user
        const tasks = await Task.find({
            assignee: userId,
            status: { $in: ['Done', 'Completed'] },
            xpAwarded: true
        }).sort({ lastUpdated: 1 }); // Oldest first for cumulative sum

        // Aggregate XP over time
        // Aggregate XP over time (5-minute intervals)
        let cumulativeXP = 0;
        const history = tasks.map(task => {
            cumulativeXP += (task.points || 10) + (task.priority === 'High' ? 20 : 0);

            // 5-minute bucketing
            const dateObj = new Date(task.lastUpdated);
            const minutes = dateObj.getMinutes();
            const roundedMinutes = Math.floor(minutes / 5) * 5;
            dateObj.setMinutes(roundedMinutes, 0, 0); // Reset seconds/ms

            return {
                timestamp: dateObj.getTime(), // Sortable numeric timestamp
                date: dateObj.toISOString(),   // Full ISO string for potential frontend use
                formattedTime: dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                displayDate: dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                xp: cumulativeXP,
                taskTitle: task.title
            };
        });

        // Group by 5-min bucket (keep last entry per bucket)
        const groupedHistory = [];
        const bucketMap = new Map();

        history.forEach(entry => {
            bucketMap.set(entry.timestamp, entry);
        });

        // Convert map to array and ensure sort
        const sortedBuckets = Array.from(bucketMap.values()).sort((a, b) => a.timestamp - b.timestamp);

        // Format for frontend
        const finalHistory = sortedBuckets.map(entry => ({
            date: entry.date, // ISO string for robust parsing
            xp: entry.xp,
            taskTitle: entry.taskTitle
        }));

        res.status(200).json({
            success: true,
            history: finalHistory
        });



    } catch (error) {
        console.error('Performance analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching performance data',
            error: error.message
        });
    }
};
