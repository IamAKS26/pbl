import { useEffect, useState } from 'react';

const AchievementBadge = ({ achievement, onClose }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (achievement) {
            setShow(true);
            const timer = setTimeout(() => {
                setShow(false);
                setTimeout(onClose, 500); // Wait for animation to finish before removing
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [achievement, onClose]);

    if (!achievement) return null;

    return (
        <div className={`fixed top-24 left-6 z-50 transition-all duration-500 transform ${show ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'}`}>
            <div className="bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-white/40 p-4 flex items-center gap-4 max-w-sm overflow-hidden relative">
                {/* Glow Effect */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-yellow-400 via-orange-500 to-red-500"></div>

                {/* Icon (Hexagon Shape) */}
                <div className="w-16 h-16 relative flex items-center justify-center shrink-0">
                    <svg className="absolute w-full h-full text-indigo-600 drop-shadow-md" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 7v10l10 5 10-5V7L12 2z" />
                    </svg>
                    <div className="relative z-10 text-2xl animate-bounce text-white">
                        {achievement.icon || '🏆'}
                    </div>
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-indigo-600 uppercase tracking-wider mb-0.5">Achievement Unlocked</p>
                    <h3 className="text-gray-900 font-bold leading-tight">{achievement.title}</h3>
                    <p className="text-xs text-gray-500 truncate">{achievement.description || 'You are making great progress!'}</p>
                </div>

                {/* Close Button */}
                <button onClick={() => setShow(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            {/* Sparkles CSS */}
            <style>{`
                @keyframes shine {
                    0% { left: -100%; opacity: 0; }
                    50% { opacity: 0.5; }
                    100% { left: 100%; opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default AchievementBadge;
