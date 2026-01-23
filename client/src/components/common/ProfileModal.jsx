import { useRef, useEffect } from 'react';

const ProfileModal = ({ user, group, onClose, onLogout }) => {
    const modalRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (modalRef.current && !modalRef.current.contains(event.target)) {
                onClose();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [onClose]);

    return (
        <div className="absolute top-16 right-4 w-80 bg-white rounded-xl shadow-xl border border-gray-100 z-50 animate-scale-in origin-top-right" ref={modalRef}>
            <div className="p-6 text-center border-b border-gray-100">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3 text-3xl font-bold">
                    {user?.name?.charAt(0) || 'U'}
                </div>
                <h3 className="font-bold text-gray-900 text-lg">{user?.name}</h3>
                <p className="text-sm text-gray-500">{user?.email}</p>
                <div className="mt-3 inline-block px-3 py-1 bg-purple-50 text-purple-700 text-xs font-semibold rounded-full border border-purple-100">
                    {user?.role}
                </div>
            </div>

            <div className="p-4">
                {group && (
                    <div className="mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100">
                        <span className="text-xs text-gray-500 uppercase tracking-wide font-semibold">Current Team</span>
                        <p className="font-medium text-gray-900 mt-1">{group.name}</p>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-blue-600">Level 5</span>
                        <span className="text-xs text-blue-600/80 font-medium">Rank</span>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg text-center">
                        <span className="block text-2xl font-bold text-amber-600">1,250</span>
                        <span className="text-xs text-amber-600/80 font-medium">XP Earned</span>
                    </div>
                </div>

                <button
                    onClick={onLogout}
                    className="w-full py-2 flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors font-medium"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                </button>
            </div>
        </div>
    );
};

export default ProfileModal;
