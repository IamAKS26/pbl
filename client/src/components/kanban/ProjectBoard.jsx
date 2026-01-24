import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import {
    DndContext,
    DragOverlay,
    closestCorners,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import TaskDetails from './TaskDetails';
import { PROJECT_TEMPLATES } from '../../constants/templates';
import GamificationBadge from '../common/GamificationBadge';

const ProjectBoard = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { currentProject, tasks: projectTasks, fetchProject, updateTaskStatus, loading, createTask } = useProject();
    const tasks = projectTasks || [];

    const [activeTask, setActiveTask] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showTaskDetails, setShowTaskDetails] = useState(false);

    // Gamification State
    const [celebration, setCelebration] = useState({ show: false, points: 0 });

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (projectId) {
            fetchProject(projectId);

            // Poll for real-time updates (every 5 seconds)
            const intervalId = setInterval(() => {
                fetchProject(projectId, true); // Silent fetch
            }, 5000);

            return () => clearInterval(intervalId);
        }
    }, [projectId]);

    // Keep selectedTask in sync with global tasks state (for real-time updates)
    useEffect(() => {
        if (selectedTask) {
            const updatedTask = tasks.find(t => t._id === selectedTask._id);
            if (updatedTask) {
                setSelectedTask(updatedTask);
            }
        }
    }, [tasks]);

    const handleDragStart = (event) => {
        const { active } = event;
        const task = tasks.find(t => t._id === active.id);
        setActiveTask(task);
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;

        if (!over) {
            setActiveTask(null);
            return;
        }

        const taskId = active.id;
        const newStatus = over.id;

        const task = tasks.find(t => t._id === taskId);

        if (task && task.status !== newStatus) {
            const result = await updateTaskStatus(taskId, newStatus);

            // Check for XP Award
            if (result.success && result.xpAwarded) {
                setCelebration({ show: true, points: result.points || 10 });
            }
        }

        setActiveTask(null);
    };


    const handleTaskClick = async (task) => {
        let taskToSet = task;

        // Auto-status shift for Students: Backlog -> In Progress
        if (user.role === 'Student' && (task.status === 'Backlog' || task.status === 'To Do')) {
            try {
                const result = await updateTaskStatus(task._id, 'In Progress');
                if (result.success) {
                    taskToSet = result.task; // Use the updated task from server
                    if (result.xpAwarded) {
                        setCelebration({ show: true, points: result.points || 10 });
                    }
                }
            } catch (e) {
                console.error("Auto-move failed", e);
            }
        }
        setSelectedTask(taskToSet);
        setShowTaskDetails(true);
    };

    const getTasksByStatus = (status) => {
        return tasks.filter(task => task.status === status);
    };

    // Task Assignment State
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [selectedTemplateForTasks, setSelectedTemplateForTasks] = useState('');
    const [customTaskData, setCustomTaskData] = useState({ title: '', description: '', points: 10 });
    const [creatingCustom, setCreatingCustom] = useState(false);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!currentProject) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Project not found</h2>
                    <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    const handleCreateCustomTask = async (e) => {
        e.preventDefault();
        if (!customTaskData.title) return;
        try {
            await createTask({
                title: customTaskData.title,
                description: customTaskData.description,
                status: 'Backlog', // Default to Backlog as per request
                project: currentProject._id,
                points: customTaskData.points || 10
            });
            // alert('Custom task created!');
            setCustomTaskData({ title: '', description: '', points: 10 });
            setShowAssignModal(false);
        } catch (err) {
            console.error(err);
            alert('Failed to create custom task');
        }
    };

    const handleAssignTemplateTask = async (taskTemplate) => {
        if (!currentProject) return;
        try {
            await createTask({
                title: taskTemplate.title,
                description: taskTemplate.description,
                status: 'Backlog',
                project: currentProject._id,
            });
            // alert('Task added to board!');
        } catch (err) {
            console.error(err);
            alert('Failed to add task');
        }
    };

    // Need to access createTask from hook. 
    // The component destructures it: const { ... tasks, fetchProject, updateTaskStatus, loading, createTask } = useProject(); 
    // Wait, line 23 destructuring needs to include createTask.

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-emerald-50/30 to-teal-50/30 relative overflow-hidden">
            {/* Gamification Badge */}
            <GamificationBadge
                isOpen={celebration.show}
                points={celebration.points}
                onClose={() => setCelebration({ ...celebration, show: false })}
            />

            {/* Background Splashes */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-emerald-400/10 rounded-full blur-[120px] animate-pulse-slow"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-teal-400/10 rounded-full blur-[100px] animate-pulse-slow delay-1000"></div>
            </div>
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                ← Back
                            </button>
                            <h1 className="text-xl font-bold text-emerald-700">{currentProject.title}</h1>
                        </div>
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => setShowAssignModal(true)}
                                className="btn btn-primary text-sm flex items-center gap-1"
                            >
                                <span>+</span> Assign Task
                            </button>
                            <span className="text-sm text-gray-600">Welcome, {user?.name}</span>
                            <button onClick={logout} className="btn btn-secondary text-sm">
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Kanban Board */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-6">
                    <p className="text-gray-600 mb-4">{currentProject.description}</p>

                    {/* Progress & Deadline */}
                    <div className="glass-panel p-6 border border-white/60 flex flex-col md:flex-row gap-6 items-center justify-between mb-8">
                        {/* Progress Bar */}
                        <div className="w-full md:w-2/3">
                            <div className="flex justify-between text-sm font-medium text-gray-700 mb-2">
                                <span className="font-display font-bold text-gray-800">Project Progress</span>
                                <span className="font-mono text-emerald-600 font-bold">{Math.round((tasks.filter(t => t.status === 'Completed' || t.status === 'Done').length / (tasks.length || 1)) * 100)}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                <div
                                    className="bg-gradient-to-r from-emerald-500 to-teal-500 h-3 rounded-full shadow-lg shadow-emerald-200 transition-all duration-1000 ease-out relative group"
                                    style={{ width: `${Math.round((tasks.filter(t => t.status === 'Completed' || t.status === 'Done').length / (tasks.length || 1)) * 100)}%` }}
                                >
                                    <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-2 font-medium">
                                <span className="text-emerald-700 font-bold">{tasks.filter(t => t.status === 'Completed' || t.status === 'Done').length}</span> of {tasks.length} tasks completed
                            </p>
                        </div>

                        {/* Deadline Timer */}
                        <div className="flex items-center gap-4 bg-white/50 px-5 py-3 rounded-xl border border-white/60 shadow-sm">
                            <div className="p-2 bg-red-50 rounded-lg text-red-500">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <div className="text-sm">
                                <span className="block text-xs text-gray-400 font-bold uppercase tracking-wider mb-0.5">Time Remaining</span>
                                <div className="font-display font-bold text-gray-900 text-lg leading-none">
                                    {currentProject.deadline ? (
                                        <>
                                            {Math.ceil((new Date(currentProject.deadline) - new Date()) / (1000 * 60 * 60 * 24))} Days
                                            {/* <span className="block text-[10px] font-normal opacity-75">Due: {new Date(currentProject.deadline).toLocaleDateString()}</span> */}
                                        </>
                                    ) : 'No Deadline'}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 h-full items-start">
                        {currentProject.columns?.map((column) => (
                            <KanbanColumn
                                key={column}
                                title={column}
                                tasks={getTasksByStatus(column)}
                                onTaskClick={handleTaskClick}
                            />
                        ))}
                    </div>

                    <DragOverlay>
                        {activeTask ? (
                            <div className="opacity-50">
                                <TaskCard task={activeTask} />
                            </div>
                        ) : null}
                    </DragOverlay>
                </DndContext>
            </main>

            {/* Task Details Modal */}
            {showTaskDetails && selectedTask && (
                <TaskDetails
                    task={selectedTask}
                    isStudent={user?.role === 'Student'}
                    onClose={() => {
                        setShowTaskDetails(false);
                        setSelectedTask(null);
                    }}
                    onUpdate={() => {
                        fetchProject(projectId); // Refresh board
                    }}
                />
            )}

            {/* Assign Task Modal */}
            {showAssignModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl p-6 max-w-2xl w-full animate-scale-in max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Add Task to Board</h3>
                            <button onClick={() => setShowAssignModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
                        </div>

                        <div className="flex border-b border-gray-200 mb-4">
                            <button
                                onClick={() => setCreatingCustom(true)}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${creatingCustom ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500'}`}
                            >
                                <span className="flex items-center gap-2">✨ Create Custom</span>
                            </button>
                            <button
                                onClick={() => setCreatingCustom(false)}
                                className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${!creatingCustom ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500'}`}
                            >
                                <span className="flex items-center gap-2">📋 From Template</span>
                            </button>
                        </div>

                        {creatingCustom ? (
                            <form onSubmit={handleCreateCustomTask} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Task Title <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        className="input"
                                        placeholder="e.g. Design Database Schema"
                                        value={customTaskData.title}
                                        onChange={e => setCustomTaskData({ ...customTaskData, title: e.target.value })}
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                    <textarea
                                        className="input"
                                        rows="3"
                                        placeholder="Brief details about the task..."
                                        value={customTaskData.description}
                                        onChange={e => setCustomTaskData({ ...customTaskData, description: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">XP Points</label>
                                    <input
                                        type="number"
                                        min="0"
                                        className="input"
                                        placeholder="e.g. 50"
                                        value={customTaskData.points || ''}
                                        onChange={e => setCustomTaskData({ ...customTaskData, points: parseInt(e.target.value) || 0 })}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Points awarded upon completion.</p>
                                </div>
                                <div className="flex justify-end pt-2">
                                    <button type="submit" className="btn btn-primary">Create Task</button>
                                </div>
                            </form>
                        ) : (
                            <>
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Select Template Source</label>
                                    <select
                                        className="input w-full"
                                        value={selectedTemplateForTasks}
                                        onChange={(e) => setSelectedTemplateForTasks(e.target.value)}
                                    >
                                        <option value="">-- Choose a Template --</option>
                                        {PROJECT_TEMPLATES.map(t => (
                                            <option key={t.id} value={t.id}>{t.title}</option>
                                        ))}
                                    </select>
                                </div>

                                {selectedTemplateForTasks && (
                                    <div className="grid grid-cols-1 gap-3">
                                        <p className="text-sm text-gray-500 mb-2">Click a task to add it to the board:</p>
                                        <div className="space-y-2">
                                            {PROJECT_TEMPLATES.find(t => t.id === selectedTemplateForTasks)?.suggestedTasks?.map((task, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleAssignTemplateTask(task)}
                                                    className="w-full text-left p-3 border rounded hover:bg-emerald-50 hover:border-emerald-200 transition-colors flex justify-between items-center group"
                                                >
                                                    <div>
                                                        <div className="font-medium text-gray-800 group-hover:text-emerald-700">{task.title}</div>
                                                        <div className="text-xs text-gray-500">{task.description}</div>
                                                    </div>
                                                    <span className="text-emerald-600 opacity-0 group-hover:opacity-100 font-bold">+</span>
                                                </button>
                                            )) || <div className="text-gray-400 italic">No suggested tasks in this template.</div>}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProjectBoard;
