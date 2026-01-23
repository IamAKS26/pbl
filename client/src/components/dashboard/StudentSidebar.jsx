import React from 'react';

const StudentSidebar = ({ group, currentPhase, phases, onLogout }) => {
    // Derived state
    const groupInitial = group?.name ? group.name.trim().slice(-1).toUpperCase() : '?';

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen sticky top-0">
            {/* Group Identity Header */}
            <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center text-xl font-bold text-emerald-700 shrink-0">
                        {groupInitial}
                    </div>
                    <div className="overflow-hidden">
                        <h2 className="font-bold text-gray-900 truncate" title={group?.name}>
                            {group?.name || 'My Group'}
                        </h2>
                        <span className="text-xs text-gray-500">Team Workspace</span>
                    </div>
                </div>

                {/* Member List (Mini) */}
                <div className="flex -space-x-2 overflow-hidden py-1">
                    {group?.members?.map((member, i) => (
                        <div
                            key={member._id || i}
                            className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600"
                            title={member.name}
                        >
                            {member.name.charAt(0)}
                        </div>
                    ))}
                </div>
            </div>

            {/* Phase Timeline */}
            <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 px-2">
                    Project Phases
                </h3>

                {phases.map((phase, index) => {
                    const isActive = currentPhase === index;
                    // Logic: Phase is locked if index > currentPhase. Completed if index < currentPhase.
                    // Actually, let's assume 'currentPhase' is the index of the active one.
                    const isCompleted = index < currentPhase;
                    const isLocked = index > currentPhase;

                    return (
                        <div
                            key={phase.id}
                            className={`
                                relative flex items-center gap-3 p-3 rounded-lg transition-all
                                ${isActive ? 'bg-emerald-50 text-emerald-900 shadow-sm ring-1 ring-emerald-200' : ''}
                                ${isCompleted ? 'text-gray-600 hover:bg-gray-50' : ''}
                                ${isLocked ? 'text-gray-400 cursor-not-allowed opacity-60' : ''}
                            `}
                        >
                            {/* Status Icon */}
                            <div className={`
                                w-6 h-6 rounded-full flex items-center justify-center text-xs shrink-0 border
                                ${isActive ? 'bg-emerald-500 text-white border-emerald-500' : ''}
                                ${isCompleted ? 'bg-green-100 text-green-600 border-green-200' : ''}
                                ${isLocked ? 'bg-gray-100 text-gray-400 border-gray-200' : ''}
                            `}>
                                {isCompleted ? (
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                    </svg>
                                ) : (
                                    <span>{index + 1}</span>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${isLocked ? 'text-gray-400' : 'text-gray-900'}`}>
                                    {phase.title}
                                </p>
                                {isActive && (
                                    <p className="text-xs text-emerald-600 font-medium animate-pulse">
                                        In Progress
                                    </p>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Footer / Logout */}
            <div className="p-4 border-t border-gray-200">
                <button
                    onClick={onLogout}
                    className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors w-full px-2 py-2 rounded-lg hover:bg-red-50"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Logout
                </button>
            </div>
        </aside>
    );
};

export default StudentSidebar;
