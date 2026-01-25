/**
 * Client-Side Gamification Logic
 */

// Level Thresholds & Rewards Configuration
export const LEVEL_CONFIG = [
    { level: 1, minXP: 0, reward: "College Canteen Voucher (at Lvl 2)" },
    { level: 2, minXP: 200, reward: "Library Fast Pass (at Lvl 3)" },
    { level: 3, minXP: 500, reward: "Cinema Ticket" },
    { level: 4, minXP: 1000, reward: "Tech Access Card" },
    { level: 5, minXP: 2000, reward: "Grand Prize" }
];

export const calculateLevelInfo = (xp) => {
    xp = xp || 0;

    // Find current level
    let currentLevel = LEVEL_CONFIG[0];
    let nextLevel = LEVEL_CONFIG[1];

    for (let i = 0; i < LEVEL_CONFIG.length; i++) {
        if (xp >= LEVEL_CONFIG[i].minXP) {
            currentLevel = LEVEL_CONFIG[i];
            nextLevel = LEVEL_CONFIG[i + 1] || null;
        } else {
            break;
        }
    }

    return {
        currentLevel: currentLevel.level,
        currentLevelReward: currentLevel.reward,
        nextLevel: nextLevel ? nextLevel.level : null,
        nextLevelReward: nextLevel ? nextLevel.reward : "Max Level Reached",
        xpForNextLevel: nextLevel ? nextLevel.minXP : null,
        progress: nextLevel
            ? ((xp - currentLevel.minXP) / (nextLevel.minXP - currentLevel.minXP)) * 100
            : 100,
        xpneeded: nextLevel ? nextLevel.minXP - xp : 0
    };
};
