import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import api from '../../utils/api';

// Components
import WaitingRoom from './WaitingRoom';
import CodeEditor from '../common/CodeEditor';
import TaskDetails from '../kanban/TaskDetails'; // We'll modify this to handle non-modal props if needed
import ProfileModal from '../common/ProfileModal';
import { formatDateTime } from '../../utils/dateHelpers';

const StudentDashboard = () => {
    const { user, logout } = useAuth();
    const { tasks, fetchUserTasks, loading: tasksLoading } = useProject();

    // State
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'workplace'
    const [selectedTask, setSelectedTask] = useState(null);
    const [showProfile, setShowProfile] = useState(false);

    // Code Editor State (lifting state here for the split view)
    const [code, setCode] = useState('// Select a task to start coding');
    const [codeLanguage, setCodeLanguage] = useState('javascript');

    useEffect(() => {
        const initDashboard = async () => {
            setLoading(true);
            try {
                await fetchUserTasks();
                const res = await api.get('/api/groups');
                const userGroup = res.data.groups.length > 0 ? res.data.groups[0] : null;
                setGroup(userGroup);
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

    const handleTaskClick = (task) => {
        setSelectedTask(task);
        if (task.submissionType === 'code') {
            setCode(task.codeSubmission?.code || '// Write your code here');
            setCodeLanguage(task.codeSubmission?.language || 'javascript');
            setViewMode('workplace');
        } else {
            // For non-code tasks, strictly speaking we might keep them in a modal or simpler view
            // But let's use the workspace for consistent "focus mode" or just a modal
            // For now, let's treat all tasks as "focusable" in workplace view for consistency?
            // User asked for "like leetcode", so focus mode is good.
            setViewMode('workplace');
        }
    };

    const handleBackToDashboard = () => {
        setViewMode('dashboard');
        setSelectedTask(null);
    };

    // --- RENDER HELPERS ---

    if (loading || tasksLoading) {
        return (
            <div className="min-h-screen flex justify-center items-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
            </div>
        );
    }

    if (group && !group.project) return <WaitingRoom group={group} />;

    if (!group) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-center p-8">
            <div className="text-6xl mb-4">👋</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to PBL!</h2>
            <p className="text-gray-500 mb-6">Please ask your teacher to add you to a team.</p>
            <button onClick={logout} className="text-red-500 font-medium hover:underline">Logout</button>
        </div>
    );

    // --- MAIN LAYOUT ---

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            {/* 1. TOP NAVBAR */}
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 z-20 relative">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold">P</div>
                        <span className="font-bold text-gray-900 text-lg tracking-tight">PBL <span className="text-emerald-600">GyanSetu</span></span>
                    </div>

                    {/* Breadcrumbs / Context */}
                    {viewMode === 'workplace' && selectedTask && (
                        <div className="hidden md:flex items-center gap-2 text-sm">
                            <span className="text-gray-400">/</span>
                            <button onClick={handleBackToDashboard} className="text-gray-600 hover:text-emerald-600 font-medium transition-colors">Dashboard</button>
                            <span className="text-gray-400">/</span>
                            <span className="text-gray-900 font-semibold truncate max-w-xs">{selectedTask.title}</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-6">
                    {/* Gamification Stats */}
                    <div className="hidden md:flex items-center gap-4 bg-gray-50 px-4 py-1.5 rounded-full border border-gray-100">
                        <div className="flex items-center gap-2" title="Experience Points">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span className="text-xs font-bold text-gray-700">1,250 XP</span>
                        </div>
                        <div className="w-px h-4 bg-gray-300"></div>
                        <div className="flex items-center gap-2" title="Current Level">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span className="text-xs font-bold text-gray-700">Level 5</span>
                        </div>
                    </div>

                    {/* Profile Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowProfile(!showProfile)}
                            className="flex items-center gap-3 hover:bg-gray-50 p-1.5 rounded-full transition-colors border border-transparent hover:border-gray-200 focus:outline-none"
                        >
                            <span className="hidden md:block text-sm font-medium text-gray-700 text-right">
                                {user?.name}
                                <span className="block text-[10px] text-gray-500 font-normal leading-none mt-0.5">{group?.name}</span>
                            </span>
                            <div className="w-9 h-9 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm">
                                {user?.name?.charAt(0) || 'U'}
                            </div>
                        </button>

                        {showProfile && (
                            <ProfileModal
                                user={user}
                                group={group}
                                onClose={() => setShowProfile(false)}
                                onLogout={logout}
                            />
                        )}
                    </div>
                </div>
            </header>

            {/* 2. MAIN CONTENT AREA */}
            <main className="flex-1 overflow-hidden relative">

                {/* VIEW MODE: DASHBOARD (GRID) */}
                {viewMode === 'dashboard' && (
                    <div className="h-full overflow-y-auto p-6 md:p-8">
                        <div className="max-w-7xl mx-auto">
                            {/* Welcome Banner */}
                            <div className="mb-8 p-6 bg-gradient-to-r from-emerald-600 to-teal-500 rounded-2xl text-white shadow-lg relative overflow-hidden">
                                <div className="relative z-10">
                                    <h1 className="text-2xl font-bold mb-2">Welcome Back, {user?.name.split(' ')[0]}! 🚀</h1>
                                    <p className="text-emerald-50 opacity-90 max-w-xl">
                                        Your team "{group?.name}" is currently in <span className="font-bold text-white">Phase 1: Planning</span>.
                                        You have <span className="font-bold text-white underline decoration-amber-400 decoration-2 underline-offset-2">{tasks.filter(t => t.status !== 'Completed').length} active tasks</span> waiting for you.
                                    </p>
                                </div>
                                {/* Abstract Shapes */}
                                <div className="absolute right-0 top-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl"></div>
                                <div className="absolute bottom-0 right-20 w-32 h-32 bg-amber-400 opacity-10 rounded-full translate-y-1/3 blur-xl"></div>
                            </div>

                            {/* Task Grid */}
                            <div className="mb-6 flex items-center justify-between">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                    My Tasks
                                </h3>
                                {/* Filter Controls Could Go Here */}
                            </div>

                            {tasks.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                                    {tasks.map(task => (
                                        <div
                                            key={task._id}
                                            onClick={() => handleTaskClick(task)}
                                            className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group flex flex-col"
                                        >
                                            <div className="flex justify-between items-start mb-3">
                                                <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${task.priority === 'High' ? 'bg-red-50 text-red-600' :
                                                    task.priority === 'Medium' ? 'bg-amber-50 text-amber-600' :
                                                        'bg-blue-50 text-blue-600'
                                                    }`}>
                                                    {task.priority}
                                                </span>
                                                {task.submissionType === 'code' && (
                                                    <span className="text-gray-400 group-hover:text-emerald-500 transition-colors" title="Coding Task">
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                                                    </span>
                                                )}
                                            </div>

                                            <h4 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-emerald-700 transition-colors">{task.title}</h4>
                                            <p className="text-sm text-gray-500 mb-4 line-clamp-3 flex-1">{task.description}</p>

                                            <div className="flex items-center justify-between pt-4 border-t border-gray-50 mt-auto">
                                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${task.status === 'Completed' ? 'bg-emerald-100 text-emerald-700' :
                                                    task.status === 'Review' ? 'bg-purple-100 text-purple-700' :
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                    {task.status}
                                                </span>
                                                <span className="text-xs text-gray-400">{formatDateTime(task.updatedAt)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-20 bg-white rounded-xl border border-gray-200 border-dashed">
                                    <p className="text-gray-400 mb-2">No tasks assigned yet.</p>
                                    <p className="text-sm text-gray-400">Wait for your team to plan or check with your teacher.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* VIEW MODE: WORKPLACE (SPLIT VIEW) */}
                {viewMode === 'workplace' && selectedTask && (
                    <div className="h-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-200">
                        {/* LEFT: Task Description & Instructions */}
                        <div className="w-full md:w-1/3 bg-white h-1/2 md:h-full overflow-y-auto">
                            <div className="p-6">
                                {/* Use TaskDetails but assume we modify it to handle embedded mode or just inline render here for now since TaskDetails is heavy modal */}
                                {/* Ideally we refactor TaskDetails to be a pure component. For now let's wrap it nicely or just use a lighter custom view if we don't want the modal buttons */}
                                {/* Actually, the user wants "LeetCode like". I'll render the details directly here for better control than forcing the modal component. */}

                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedTask.title}</h2>
                                    <div className="flex gap-2 mb-4">
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-medium">{selectedTask.priority}</span>
                                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded font-medium">{selectedTask.status}</span>
                                    </div>
                                    <div className="prose prose-sm prose-emerald text-gray-600">
                                        <p>{selectedTask.description}</p>
                                        {/* Placeholder for richer instructions if we had markdown */}
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 pt-6">
                                    <h3 className="font-bold text-gray-900 mb-3">Acceptance Criteria</h3>
                                    <ul className="space-y-2">
                                        <li className="flex gap-2 text-sm text-gray-600">
                                            <span className="text-emerald-500">✓</span>
                                            <span>Code must compile/run without errors.</span>
                                        </li>
                                        <li className="flex gap-2 text-sm text-gray-600">
                                            <span className="text-emerald-500">✓</span>
                                            <span>Functionality must match description.</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Editor & Action Area */}
                        <div className="w-full md:w-2/3 bg-gray-50 h-1/2 md:h-full flex flex-col relative border-l border-gray-200">

                            {/* Submission Type Tabs */}
                            <div className="flex border-b border-gray-200 bg-white px-2">
                                <button
                                    onClick={() => setCodeLanguage('code')}
                                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${selectedTask.submissionType === 'code' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    Code Editor
                                </button>
                                <button
                                    onClick={() => setCodeLanguage('github')} // Using codeLanguage state to track tab for now? Ideally separate state.
                                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${selectedTask.submissionType !== 'code' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                >
                                    GitHub / Link
                                </button>
                            </div>

                            <div className="flex-1 relative overflow-y-auto">
                                {/* Code Editor View */}
                                {selectedTask.submissionType === 'code' ? (
                                    <>
                                        <CodeEditor
                                            initialCode={code}
                                            language={codeLanguage !== 'github' && codeLanguage !== 'code' ? codeLanguage : 'javascript'}
                                            onChange={setCode}
                                            height="100%"
                                        />
                                    </>
                                ) : (
                                    /* Non-Code Submission View (GitHub / Links) */
                                    <div className="p-8 max-w-lg mx-auto">
                                        <div className="mb-8">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">Submit Evidence</h3>
                                            <p className="text-sm text-gray-500 mb-6">Attach a document link or valid URL as proof of completion.</p>

                                            <form onSubmit={async (e) => {
                                                e.preventDefault();
                                                const url = e.target.elements.url.value;
                                                if (!url) return;
                                                // Quick inline handler for Evidence
                                                try {
                                                    setLoading(true);
                                                    await api.post(`/api/tasks/${selectedTask._id}/evidence`, { url, resourceType: 'link' });
                                                    alert('Evidence added!');
                                                    await fetchUserTasks();
                                                } catch (err) { alert('Failed: ' + err.message); }
                                                finally { setLoading(false); }
                                            }} className="flex gap-2">
                                                <input name="url" type="url" placeholder="https://docs.google.com/..." className="input flex-1" required />
                                                <button type="submit" disabled={loading} className="btn btn-secondary">Add Link</button>
                                            </form>

                                            {selectedTask.evidenceLinks?.length > 0 && (
                                                <div className="mt-4 space-y-2">
                                                    {selectedTask.evidenceLinks.map((link, i) => (
                                                        <div key={i} className="flex items-center justify-between p-2 bg-white border rounded text-sm">
                                                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 truncate max-w-xs">{link.url}</a>
                                                            <span className="text-xs text-gray-400">Uploaded</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="border-t border-gray-200 pt-8">
                                            <h3 className="text-lg font-bold text-gray-900 mb-2">Link GitHub Repository</h3>
                                            <p className="text-sm text-gray-500 mb-6">Connect a repository to track commits automatically.</p>

                                            {selectedTask.githubRepo ? (
                                                <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-lg flex items-center justify-between">
                                                    <div>
                                                        <p className="font-medium text-emerald-800">Repository Linked</p>
                                                        <a href={selectedTask.githubRepo.url} target="_blank" className="text-sm text-emerald-600 underline">
                                                            {selectedTask.githubRepo.owner}/{selectedTask.githubRepo.repo}
                                                        </a>
                                                    </div>
                                                    <span className="text-2xl">✅</span>
                                                </div>
                                            ) : (
                                                <form onSubmit={async (e) => {
                                                    e.preventDefault();
                                                    const repoUrl = e.target.elements.repoUrl.value;
                                                    if (!repoUrl) return;
                                                    // Quick inline handler for GitHub
                                                    try {
                                                        setLoading(true);
                                                        await api.post(`/api/tasks/${selectedTask._id}/github-repo`, { repoUrl });
                                                        alert('Repo linked!');
                                                        await fetchUserTasks();
                                                    } catch (err) { alert('Failed: ' + err.message); }
                                                    finally { setLoading(false); }
                                                }} className="flex gap-2">
                                                    <input name="repoUrl" type="url" placeholder="https://github.com/user/repo" className="input flex-1" required />
                                                    <button type="submit" disabled={loading} className="btn btn-secondary">Link Repo</button>
                                                </form>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Action Bar (Only for Code tasks really, but we keep it for consistency or hide it) */}
                            {selectedTask.submissionType === 'code' && (
                                <div className="bg-white border-t border-gray-200 p-4 shrink-0 flex justify-between items-center z-10">
                                    <div className="text-sm text-gray-500">
                                        {/* Language Display */}
                                    </div>
                                    <div className="flex gap-3">
                                        <button className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg text-sm font-medium transition-colors">
                                            Run Code
                                        </button>
                                        <button
                                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold shadow-sm shadow-emerald-200 transition-all disabled:opacity-50"
                                            disabled={loading}
                                            onClick={async () => {
                                                if (!code || !selectedTask) return;
                                                setLoading(true);
                                                try {
                                                    await api.put(`/api/tasks/${selectedTask._id}`, {
                                                        codeSubmission: {
                                                            code: code,
                                                            language: 'javascript', // Hardcoded safely for now
                                                            submittedAt: new Date()
                                                        },
                                                        status: 'Review'
                                                    });
                                                    alert('Code submitted successfully! Task moved to Review.');
                                                    await fetchUserTasks();
                                                    handleBackToDashboard();
                                                } catch (error) {
                                                    console.error('Submission error:', error);
                                                    alert('Failed to submit code');
                                                } finally {
                                                    setLoading(false);
                                                }
                                            }}
                                        >
                                            {loading ? 'Submitting...' : 'Submit Solution'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Submit Button for Non-Code tasks could go here if we want a "Mark for Review" button */}
                            {selectedTask.submissionType !== 'code' && (
                                <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end">
                                    <button
                                        className="btn btn-primary"
                                        onClick={async () => {
                                            try {
                                                await api.put(`/api/tasks/${selectedTask._id}`, { status: 'Review' });
                                                alert('Task submitted for review!');
                                                await fetchUserTasks();
                                                handleBackToDashboard();
                                            } catch (e) { alert('Error: ' + e.message); }
                                        }}
                                    >
                                        Mark as Ready for Review
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default StudentDashboard;
