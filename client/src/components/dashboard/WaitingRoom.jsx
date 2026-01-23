import React from 'react';
import { useAuth } from '../../context/AuthContext';

const WaitingRoom = ({ group }) => {
    const { logout } = useAuth();

    // Derived state for Group Icon
    const groupInitial = group?.name ? group.name.trim().slice(-1).toUpperCase() : '?';

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
            <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center space-y-6 animate-fade-in">

                {/* Group Identity */}
                <div className="flex justify-center">
                    <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center text-3xl font-bold text-emerald-700 shadow-inner">
                        {groupInitial}
                    </div>
                </div>

                <div className="space-y-2">
                    <h2 className="text-2xl font-bold text-gray-900">
                        Welcome, {group?.name || 'Team'}!
                    </h2>
                    <p className="text-gray-500">
                        Your teacher has formed your team.
                        <br />
                        <span className="font-medium text-gray-700">Please wait for a project topic to be assigned.</span>
                    </p>
                </div>

                {/* Status Indicator */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 flex items-center justify-center gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                    <span className="text-sm font-medium text-blue-700">Status: Standing By</span>
                </div>

                {/* Illustration / Placeholder visual could go here */}

                <div className="pt-4 border-t border-gray-100">
                    <button
                        onClick={logout}
                        className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
                    >
                        Log out
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WaitingRoom;
