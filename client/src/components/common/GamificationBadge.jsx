import { useEffect, useState } from 'react';

const GamificationBadge = ({ isOpen, points, title, onClose }) => {
    const [show, setShow] = useState(isOpen);

    useEffect(() => {
        setShow(isOpen);
        if (isOpen) {
            // Auto close after 4 seconds
            const timer = setTimeout(() => {
                onClose();
            }, 4000);
            return () => clearTimeout(timer);
        }
    }, [isOpen, onClose]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop with blur */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-fade-in" onClick={onClose}></div>

            {/* Celebration Card */}
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-8 shadow-2xl transform transition-all animate-bounce-in max-w-sm w-full text-center border-4 border-emerald-400">
                {/* Confetti Background (CSS) */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                    <div className="confetti-piece"></div>
                    <div className="confetti-piece"></div>
                    <div className="confetti-piece"></div>
                    <div className="confetti-piece"></div>
                    <div className="confetti-piece"></div>
                </div>

                {/* Badge Icon */}
                <div className="mx-auto w-24 h-24 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-full flex items-center justify-center mb-6 shadow-lg shadow-yellow-500/50 animate-pulse-slow">
                    <svg className="w-14 h-14 text-white drop-shadow-md" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                    </svg>
                </div>

                {/* Text Content */}
                <h2 className="text-3xl font-display font-black text-gray-900 dark:text-white mb-2">
                    Task Completed!
                </h2>
                <p className="text-gray-500 dark:text-gray-300 mb-6">
                    You've earned a new badge of honor.
                </p>

                {/* Points Pill */}
                <div className="inline-flex items-center gap-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-6 py-2 rounded-full font-bold text-xl mb-2">
                    <span>+{points} XP</span>
                </div>
            </div>

            {/* Simple CSS Styles for this component instance */}
            <style>{`
                @keyframes bounce-in {
                    0% { transform: scale(0.3); opacity: 0; }
                    50% { transform: scale(1.05); }
                    70% { transform: scale(0.9); }
                    100% { transform: scale(1); opacity: 1; }
                }
                @keyframes pulse-slow {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                }
                .confetti-piece {
                    position: absolute;
                    width: 10px;
                    height: 10px;
                    background: #ffd300;
                    top: -10px;
                    opacity: 0;
                }
                .confetti-piece:nth-child(1) { left: 10%; animation: fall 2.5s ease-out infinite; background: #ff5e5e; }
                .confetti-piece:nth-child(2) { left: 30%; animation: fall 2.3s ease-out infinite 0.2s; background: #4caf50; }
                .confetti-piece:nth-child(3) { left: 50%; animation: fall 2.7s ease-out infinite 0.4s; background: #00bcd4; }
                .confetti-piece:nth-child(4) { left: 70%; animation: fall 2.4s ease-out infinite 0.1s; background: #ffeb3b; }
                .confetti-piece:nth-child(5) { left: 90%; animation: fall 2.6s ease-out infinite 0.3s; background: #9c27b0; }
                
                @keyframes fall {
                    0% { top: -10px; opacity: 1; transform: rotate(0deg); }
                    100% { top: 100%; opacity: 0; transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default GamificationBadge;
