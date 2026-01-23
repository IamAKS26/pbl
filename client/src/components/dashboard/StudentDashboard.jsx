import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import api from '../../utils/api';

// Components
import StudentSidebar from './StudentSidebar';
import WaitingRoom from './WaitingRoom';
import PhaseView from './PhaseView';
import SubmissionModal from '../kanban/SubmissionModal';
import TaskDetails from '../kanban/TaskDetails';

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const { tasks, fetchUserTasks, loading: tasksLoading } = useProject();

    // State
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentPhase, setCurrentPhase] = useState(0); // Default to Phase 1
    const [submissionTask, setSubmissionTask] = useState(null);
    const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);

    // Mock Phases (In a real app, this would come from the Project model)
    const phases = [
        { id: 1, title: 'Phase 1: Planning & Design', description: 'Understand the problem and design your solution.' },
        { id: 2, title: 'Phase 2: Development', description: 'Build your prototype and implement core features.' },
        { id: 3, title: 'Phase 3: Testing & Launch', description: 'Test your solution and prepare for final presentation.' }
    ];

    useEffect(() => {
        const initDashboard = async () => {
            setLoading(true);
            try {
                // 1. Fetch User Tasks (Context)
                await fetchUserTasks();

                // 2. Find User's Group
                const res = await api.get('/api/groups');

                // Backend filters by membership, so just take the first one found
                const userGroup = res.data.groups.length > 0 ? res.data.groups[0] : null;
                setGroup(userGroup);

                // 3. Determine Phase (Mock logic: based on tasks completion)
                // If 30% tasks done -> Phase 2, 70% -> Phase 3.
                // For now, statically 0 (Phase 1) or let user toggle in real app?
                // We'll leave it as 0.
            } catch (err) {
                console.error("Error initializing dashboard:", err);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            initDashboard();
        }
    }, [user]);

    const handleSubmitEvidence = async ({ url, type }) => {
        if (!submissionTask) return;

        try {
            // Optimistic Update: Update local task state immediately
            // Note: In a real app we'd update the Context state or refetch
            // Here we assume api call succeeds.

            // 1. Call API
            await api.post(`/api/tasks/${submissionTask._id}/evidence`, {
                url,
                type
            });

            // 2. Refresh tasks to show updated state
            await fetchUserTasks();

            setSubmissionTask(null);
            // Optional: Show toast success
            alert(`Evidence submitted for ${submissionTask.title}!`);

        } catch (err) {
            console.error("Submission error:", err);
            alert("Failed to submit evidence. Please try again.");
        }
    };

    if (loading || tasksLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    // 1. Waiting Room State: Group exists but no Project assigned
    if (group && !group.project) {
        return <WaitingRoom group={group} />;
    }

    // 2. No Group State: Fallback (Show a minimal dashboard instead of error)
    if (!group) {
        return (
            <div className="flex h-screen bg-gray-50 overflow-hidden">
                {/* Sidebar Placeholder */}
                <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
                    <div className="p-6 border-b border-gray-100">
                        <h2 className="font-bold text-gray-900">Student Panel</h2>
                        <span className="text-xs text-gray-500">Welcome, {user?.name}</span>
                    </div>
                    <div className="p-4 mt-auto border-t border-gray-200">
                        <button onClick={logout} className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-red-600 transition-colors w-full px-2 py-2 rounded-lg hover:bg-red-50">
                            Logout
                        </button>
                    </div>
                </aside>

                <main className="flex-1 p-8 flex flex-col items-center justify-center bg-gray-50">
                    <div className="bg-white p-8 rounded-xl shadow-sm text-center max-w-md w-full border border-gray-100">
                        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">
                            👋
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to PBL!</h2>
                        <p className="text-gray-500 mb-6">
                            You are not part of a project group yet. <br />
                            Please ask your teacher to add you to a team to get started.
                        </p>
                        <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg">
                            Status: <strong>Unassigned</strong>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    // 3. Main Dashboard State
    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            {/* Sidebar */}
            <StudentSidebar
                group={group}
                currentPhase={currentPhase}
                phases={phases}
                onLogout={logout}
            />

            {/* Main Workspace (Phase View) */}
            <PhaseView
                phase={phases[currentPhase]}
                project={group.project || { description: "Complete your project tasks." }}
                tasks={tasks}
                onTaskClick={(task) => setSelectedTaskDetails(task)}
                onSubmitClick={(task) => setSubmissionTask(task)}
            />

            {/* Modals */}
            {submissionTask && (
                <SubmissionModal
                    task={submissionTask}
                    onClose={() => setSubmissionTask(null)}
                    onSubmit={handleSubmitEvidence}
                />
            )}

            {selectedTaskDetails && (
                <TaskDetails
                    task={selectedTaskDetails}
                    onClose={() => setSelectedTaskDetails(null)}
                    onUpdate={() => {
                        fetchUserTasks();
                        setSelectedTaskDetails(null);
                    }}
                />
            )}
        </div>
    );
};

export default StudentDashboard;
