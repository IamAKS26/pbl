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

const ProjectBoard = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { currentProject, tasks, fetchProject, updateTaskStatus, loading } = useProject();

    const [activeTask, setActiveTask] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [showTaskDetails, setShowTaskDetails] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        if (projectId) {
            fetchProject(projectId);
        }
    }, [projectId]);

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
            await updateTaskStatus(taskId, newStatus);
        }

        setActiveTask(null);
    };

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        setShowTaskDetails(true);
    };

    const getTasksByStatus = (status) => {
        return tasks.filter(task => task.status === status);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (!currentProject) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">Project not found</h2>
                    <button onClick={() => navigate('/')} className="btn btn-primary">
                        Back to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center space-x-4">
                            <button
                                onClick={() => navigate('/')}
                                className="text-gray-600 hover:text-gray-900"
                            >
                                ← Back
                            </button>
                            <h1 className="text-xl font-bold text-emerald-700">{currentProject.title}</h1>
                        </div>
                        <div className="flex items-center space-x-4">
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
                    <p className="text-gray-600">{currentProject.description}</p>
                </div>

                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCorners}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    onClose={() => {
                        setShowTaskDetails(false);
                        setSelectedTask(null);
                    }}
                />
            )}
        </div>
    );
};

export default ProjectBoard;
