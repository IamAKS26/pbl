/**
 * Gamification Service
 * Handles XP calculations, Level Logic, and Badge awarding.
 */

// Calculate Level from XP
// Curve: Level = 1 + floor(XP / 100)
exports.calculateLevel = (xp) => {
    return 1 + Math.floor((xp || 0) / 100);
};

// Calculate XP for a task
exports.calculateTaskXP = (task) => {
    let xp = task.points || 10; // Base XP

    // Priority Bonus
    if (task.priority === 'High') xp += 20;
    if (task.priority === 'Urgent') xp += 30;

    // Speed Bonus (Completed within 24h of creation)
    if (task.createdAt) {
        const created = new Date(task.createdAt);
        const now = new Date();
        const diffHours = Math.abs(now - created) / 36e5;
        if (diffHours < 24) {
            xp += 5;
        }
    }

    return xp;
};

// Check for new badges
exports.checkBadges = (user, task, stats) => {
    const newBadges = [];
    const currentBadges = user.badges || [];

    // Helper to add badge if not present
    const addBadge = (id, title, icon, description, tier = 'BRONZE') => {
        if (!currentBadges.includes(id)) {
            newBadges.push({ id, title, icon, description, tier });
        }
    };

    // 1. Task Count Badges (Tiered)
    const completedTasks = stats.completedTasks || 0;

    if (completedTasks >= 1) {
        addBadge('TASK_BRONZE', 'Bronze Tasker', '🛡️', 'Completed your first task!', 'BRONZE');
    }
    if (completedTasks >= 10) {
        addBadge('TASK_SILVER', 'Silver Tasker', '⚔️', 'Completed 10 tasks!', 'SILVER');
    }
    if (completedTasks >= 50) {
        addBadge('TASK_GOLD', 'Gold Tasker', '👑', 'Completed 50 tasks! You are a legend.', 'GOLD');
    }

    // 2. Speed Badge
    if (task) {
        const created = new Date(task.createdAt);
        const now = new Date();
        const diffHours = Math.abs(now - created) / 36e5;
        if (diffHours < 24) {
            addBadge('SPEEDSTER', 'Speedster', '⚡', 'Completed a task in under 24 hours!', 'SILVER');
        }
    }

    // 3. Project Completion
    if (stats.projectCompleted) {
        addBadge('PROJECT_MASTER', 'Project Master', '🏆', 'Completed an entire project!', 'GOLD');
    }

    return newBadges;
};
