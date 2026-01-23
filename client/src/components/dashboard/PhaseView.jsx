import React from 'react';
import TaskCard from '../kanban/TaskCard';

const PhaseView = ({ phase, project, tasks, onTaskClick, onSubmitClick }) => {
    // Filter tasks for this phase (mock logic for now if phases aren't in DB)
    // We assume 'tasks' passed here are relevant to the current context.

    const activeTasks = tasks.filter(t => t.status !== 'Done');
    const completedTasks = tasks.filter(t => t.status === 'Done');

    return (
        <div className="flex-1 bg-gray-50 min-h-screen overflow-y-auto">
            {/* Header / Banner */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-5xl mx-auto px-6 py-6">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <span className="text-emerald-600 font-semibold tracking-wide text-sm uppercase">
                                Current Mission
                            </span>
                            <h1 className="text-3xl font-bold text-gray-900 mt-1">
                                {phase.title}
                            </h1>
                            <p className="text-gray-500 mt-2 max-w-2xl">
                                {phase.description}
                            </p>
                        </div>
                        {/* Optional: Radial progress or phase stats could go here */}
                    </div>

                    {/* Driving Question Banner */}
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-xl p-4 flex items-start gap-4 shadow-sm">
                        <div className="bg-white p-2 rounded-lg shadow-sm text-2xl">
                            💡
                        </div>
                        <div>
                            <h3 className="text-sm font-semibold text-emerald-800 uppercase tracking-wide mb-1">
                                Driving Question
                            </h3>
                            <p className="text-emerald-900 font-medium text-lg italic">
                                "{project.description || "How can we solve the problem using technology?"}"
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-5xl mx-auto px-6 py-8">

                {/* Active Tasks */}
                <div className="mb-10">
                    <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span>🚀 Active Tasks</span>
                        <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                            {activeTasks.length}
                        </span>
                    </h2>

                    {activeTasks.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {activeTasks.map(task => (
                                <TaskCard
                                    key={task._id}
                                    task={task}
                                    onClick={() => onTaskClick(task)}
                                    onSubmitClick={onSubmitClick}
                                    isStudent={true}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500">No active tasks. Good job!</p>
                        </div>
                    )}
                </div>

                {/* Completed Tasks (Collapsible or section) */}
                {completedTasks.length > 0 && (
                    <div className="opacity-75">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            ✅ Completed
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {completedTasks.map(task => (
                                <TaskCard
                                    key={task._id}
                                    task={task}
                                    onClick={() => onTaskClick(task)}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PhaseView;
