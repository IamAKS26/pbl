import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import GamifiedDashboard from '../student/GamifiedDashboard';
import TaskDetails from '../kanban/TaskDetails';
import ExitTicket from '../student/ExitTicket';
import ProjectReport from '../reports/ProjectReport';

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const { tasks, fetchUserTasks, loading } = useProject();
    const [selectedTask, setSelectedTask] = useState(null);
    const [showExitTicket, setShowExitTicket] = useState(false);
    const [projectCompleted, setProjectCompleted] = useState(false);

    useEffect(() => {
        fetchUserTasks();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-emerald-700">PBL by GyanSetu</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
                            <span className="badge bg-blue-100 text-blue-700">Student</span>
                            <button
                                onClick={logout}
                                className="btn btn-secondary text-sm"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Gamified Hero Section */}
                <GamifiedDashboard />

                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-900">My Tasks</h2>
                    <p className="mt-1 text-sm text-gray-600">
                        View and manage your assigned project tasks
                    </p>
                </div>

                {/* Tasks List */}
                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                    </div>
                ) : tasks && tasks.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {tasks.map((task) => (
                            <div
                                key={task._id}
                                onClick={() => setSelectedTask(task)}
                                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${task.priority === 'High' ? 'bg-red-100 text-red-800' :
                                        task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                        {task.priority}
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        {new Date(task.createdAt).toLocaleDateString()}
                                    </span>
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">{task.title}</h3>
                                <p className="text-gray-500 text-sm line-clamp-3 mb-4">{task.description}</p>
                                <div className="flex items-center justify-between mt-auto">
                                    <span className="text-sm font-medium text-emerald-600">
                                        {task.status}
                                    </span>
                                    {task.githubRepo && (
                                        <span className="text-gray-400" title="GitHub Repo Linked">
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-1.334-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                            </svg>
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="card">
                        <div className="text-center py-12">
                            <h3 className="mt-2 text-sm font-medium text-gray-900">No tasks assigned</h3>
                            <p className="mt-1 text-sm text-gray-500">
                                Checks back later!
                            </p>
                        </div>
                    </div>
                )}

                {/* Task Details Modal */}
                {selectedTask && (
                    <TaskDetails
                        task={selectedTask}
                        onClose={() => setSelectedTask(null)}
                        onUpdate={() => {
                            fetchUserTasks(); // Refresh data
                            setSelectedTask(null);
                        }}
                    />
                )}

                {/* Sticky Bottom Bar for Mission Completion */}
                {tasks && tasks.length > 0 && (
                    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg animate-slide-up z-40">
                        <div className="max-w-7xl mx-auto flex justify-between items-center">
                            <div>
                                <p className="text-sm font-medium text-gray-900">Mission Progress</p>
                                <p className="text-xs text-gray-500">{tasks.filter(t => t.status === 'Done').length}/{tasks.length} Tasks Completed</p>
                            </div>

                            {!projectCompleted ? (
                                <button
                                    onClick={() => setShowExitTicket(true)}
                                    className="btn btn-primary bg-gradient-to-r from-emerald-500 to-teal-600 border-none shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                                >
                                    Complete Mission 🚀
                                </button>
                            ) : (
                                <ProjectReport
                                    project={tasks[0]?.project || { title: "PBL Mission", description: "Full stack development project." }}
                                    user={user}
                                    tasks={tasks}
                                />
                            )}
                        </div>
                    </div>
                )}

                {showExitTicket && (
                    <ExitTicket
                        onClose={() => setShowExitTicket(false)}
                        onComplete={(result) => {
                            setProjectCompleted(true);
                            setShowExitTicket(false);
                            // Ideally save result to backend here
                        }}
                    />
                )}    </main>
        </div>
    );
};

export default StudentDashboard;
