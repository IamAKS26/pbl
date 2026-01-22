import React from 'react';
import { useAuth } from '../../context/AuthContext';

const GamifiedDashboard = () => {
    const { user } = useAuth();

    // Default values if undefined (for safety)
    const xp = user?.xp || 0;
    const level = user?.level || 1;
    const badges = user?.badges || [];
    const nextLevelXp = level * 100;
    const progress = (xp % 100);

    const getBadgeIcon = (badge) => {
        switch (badge) {
            case 'Code Warrior': return '⚔️';
            case 'Team Player': return '🤝';
            case 'Bug Hunter': return '🐛';
            default: return '🏅';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Hero Stats</h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Level & XP */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl p-5 text-white shadow-lg transform hover:scale-105 transition-transform duration-200">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-indigo-100 text-sm font-medium uppercase tracking-wider">Current Level</p>
                            <h3 className="text-4xl font-extrabold mt-1">{level}</h3>
                        </div>
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <span className="text-2xl">⚡</span>
                        </div>
                    </div>

                    <div className="mt-4">
                        <div className="flex justify-between text-xs mb-1 text-indigo-100 font-medium">
                            <span>{xp} XP</span>
                            <span>{nextLevelXp} XP</span>
                        </div>
                        <div className="w-full bg-black/20 rounded-full h-2.5 backdrop-blur-sm">
                            <div
                                className="bg-yellow-400 h-2.5 rounded-full shadow-lg"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <p className="text-xs mt-2 text-indigo-100 opacity-90">
                            {100 - progress} XP to Level {level + 1}
                        </p>
                    </div>
                </div>

                {/* Badges */}
                <div className="md:col-span-2 bg-gray-50 rounded-xl p-5 border border-gray-100">
                    <h3 className="font-bold text-gray-700 mb-4 flex items-center">
                        <span className="mr-2">🏆</span> Achievements
                    </h3>

                    {badges.length > 0 ? (
                        <div className="flex flex-wrap gap-4">
                            {badges.map((badge, index) => (
                                <div key={index} className="flex flex-col items-center bg-white p-3 rounded-lg shadow-sm border border-gray-100 w-24 text-center transform hover:-translate-y-1 transition-transform duration-200">
                                    <div className="text-3xl mb-1">{getBadgeIcon(badge)}</div>
                                    <span className="text-xs font-semibold text-gray-600 leading-tight">{badge}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-24 text-gray-400 bg-white rounded-lg border border-dashed border-gray-200">
                            <span className="text-2xl mb-1 opacity-50">🔒</span>
                            <span className="text-sm">No badges earned yet</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GamifiedDashboard;
