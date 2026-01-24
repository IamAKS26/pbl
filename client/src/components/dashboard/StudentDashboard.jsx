import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { useProject } from '../../context/ProjectContext';
import api from '../../utils/api';

// Components
import WaitingRoom from './WaitingRoom';
import CodeEditor from '../common/CodeEditor';
import TaskDetails from '../kanban/TaskDetails'; // We'll modify this to handle non-modal props if needed
import ProfileModal from '../common/ProfileModal';
import PerformanceChart from '../common/PerformanceChart';
import { formatDateTime } from '../../utils/dateHelpers';

const StudentDashboard = () => {
    const { user, logout, loadUser, updateUserStats } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { addToast } = useToast();
    const { tasks, fetchUserTasks, loading: tasksLoading } = useProject();

    // State
    const [group, setGroup] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' | 'workplace'
    const [selectedTask, setSelectedTask] = useState(null);
    const [showProfile, setShowProfile] = useState(false);
    const [performanceData, setPerformanceData] = useState([]);
    const [taskFilter, setTaskFilter] = useState('my'); // 'my' | 'all'

    // Code Editor State (lifting state here for the split view)
    const [code, setCode] = useState('// Select a task to start coding');
    const [activeTab, setActiveTab] = useState('code'); // 'code' | 'github'
    const [evidenceMode, setEvidenceMode] = useState('link'); // 'link' | 'file'

    useEffect(() => {
        const initDashboard = async () => {
            setLoading(true);
            try {
                // Fetch Tasks
                await fetchUserTasks();

                // Fetch Group
                const groupRes = await api.get('/api/groups');
                if (groupRes.data.success && groupRes.data.groups.length > 0) {
                    setGroup(groupRes.data.groups[0]);
                } else {
                    setGroup(null);
                }

                // Fetch Performance
                const perfRes = await api.get('/api/analytics/performance');
                setPerformanceData(perfRes.data.history);
            } catch (error) {
                console.error('Error loading dashboard:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            initDashboard();
        }

        // Real-time updates (Polling every 10 seconds)
        const intervalId = setInterval(async () => {
            if (user) {
                await fetchUserTasks(true); // Silent fetch (no loading spinner)
                try {
                    const perfRes = await api.get('/api/analytics/performance');
                    setPerformanceData(perfRes.data.history);

                    // Poll group to check if added/removed
                    const groupRes = await api.get('/api/groups');
                    if (groupRes.data.success && groupRes.data.groups.length > 0) {
                        setGroup(groupRes.data.groups[0]);
                    } else {
                        setGroup(null);
                    }
                } catch (e) { }
            }
        }, 10000);

        return () => clearInterval(intervalId);
    }, [user]);



    const handleTaskClick = (task) => {
        setSelectedTask(task);
        if (task.submissionType === 'code') {
            setCode(task.codeSubmission?.code || '// Write your code here');
            setActiveTab('code');
        } else {
            setActiveTab('github');
        }
        setViewMode('workplace');
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
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-transparent overflow-hidden transition-colors duration-300">
            {/* 1. TOP NAVBAR */}
            <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10 flex items-center justify-between px-6 shrink-0 z-20 relative">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/30">P</div>
                        <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">PBL <span className="text-emerald-600 dark:text-emerald-400">GyanSetu</span></span>
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
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                        title="Toggle Theme"
                    >
                        {theme === 'dark' ? '🌞' : '🌙'}
                    </button>
                    {/* Gamification Stats */}
                    <div className="hidden md:flex items-center gap-4 bg-gray-50 dark:bg-white/5 px-4 py-1.5 rounded-full border border-gray-100 dark:border-white/10">
                        <div className="flex items-center gap-2" title="Experience Points">
                            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{user?.xp || 0} XP</span>
                        </div>
                        <div className="w-px h-4 bg-gray-300 dark:bg-white/20"></div>
                        <div className="flex items-center gap-2" title="Current Level">
                            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Level {user?.level || 1}</span>
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
                            <div className="mb-8 p-8 bg-gradient-to-br from-emerald-600 via-teal-600 to-emerald-800 rounded-3xl text-white shadow-xl shadow-emerald-900/10 relative overflow-hidden animate-fade-in group">
                                <div className="relative z-10">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                                        <div>
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-medium text-emerald-50 mb-3 border border-white/10">
                                                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
                                                Active Session
                                            </div>
                                            <h1 className="text-3xl md:text-4xl font-display font-bold mb-3 tracking-tight">Welcome Back, {user?.name.split(' ')[0]}!</h1>
                                            <p className="text-emerald-50/90 text-lg max-w-xl font-light">
                                                Team "{group?.name}" is in <span className="font-semibold text-white">Action Mode</span>. You're making great progress!
                                            </p>
                                        </div>

                                        {/* Deadline Badge */}
                                        <div className="bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/20 flex items-center gap-4 hover:bg-white/15 transition-colors">
                                            <div className="p-2 bg-amber-400/20 rounded-lg">
                                                <svg className="w-6 h-6 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-emerald-100 uppercase font-bold tracking-wider">Time Remaining</span>
                                                <span className="font-bold text-white text-xl font-display">
                                                    {group?.project?.deadline ? Math.ceil((new Date(group.project.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : '--'} Days
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mt-8 bg-black/20 rounded-2xl p-5 backdrop-blur-sm border border-white/5">
                                        <div className="flex justify-between text-sm font-medium text-emerald-50 mb-3">
                                            <span className="font-display tracking-wide">Overall Progress</span>
                                            <span className="font-mono">{Math.round((tasks.filter(t => t.status === 'Completed' || t.status === 'Done').length / (tasks.length || 1)) * 100)}%</span>
                                        </div>
                                        <div className="w-full bg-emerald-900/30 rounded-full h-3 overflow-hidden backdrop-blur-md">
                                            <div
                                                className="bg-gradient-to-r from-amber-300 to-amber-500 h-3 rounded-full shadow-[0_0_15px_rgba(251,191,36,0.3)] relative"
                                                style={{ width: `${Math.round((tasks.filter(t => t.status === 'Completed' || t.status === 'Done').length / (tasks.length || 1)) * 100)}%` }}
                                            >
                                                <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center mt-3 text-xs text-emerald-100/60 font-medium">
                                            <span>{tasks.filter(t => t.status === 'Completed' || t.status === 'Done').length} / {tasks.length} tasks completed</span>
                                        </div>

                                        {/* Performance Chart - Moved to its own row for full width */}
                                        <div className="mt-6 bg-white/5 rounded-2xl p-4 border border-white/5 backdrop-blur-sm">
                                            <h4 className="text-emerald-50 text-sm font-semibold mb-3">XP Growth</h4>
                                            <PerformanceChart data={performanceData} />
                                        </div>
                                    </div>
                                </div>

                                {/* Background Decorations */}
                                <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-400 opacity-20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 animate-pulse-slow"></div>
                                <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-300 opacity-10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/3"></div>
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] mix-blend-overlay"></div>
                            </div>

                            {/* Task Grid Header */}
                            <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                        Mastery Progression Timeline
                                    </h3>
                                    <p className="text-gray-500 text-sm mt-1">Track your learning journey and upcoming milestones</p>
                                </div>

                                {/* Filter Toggle */}
                                <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                                    <button
                                        onClick={() => setTaskFilter('my')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${taskFilter === 'my' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                                    >
                                        My Tasks
                                    </button>
                                    <button
                                        onClick={() => setTaskFilter('all')}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${taskFilter === 'all' ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'}`}
                                    >
                                        All Project Tasks
                                    </button>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-medium text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                    Completed
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                    In Progress
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-2.5 h-2.5 rounded-full bg-gray-300"></span>
                                    Upcoming
                                </div>
                            </div>


                            {tasks.length > 0 ? (
                                <div className={taskFilter === 'my' ? "space-y-0 relative pl-4 md:pl-0" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>

                                    {/* Vertical Timeline Line - Only for My Tasks */}
                                    {taskFilter === 'my' && (
                                        <div className="hidden md:block absolute left-8 top-6 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
                                    )}

                                    {tasks
                                        .filter(t => taskFilter === 'all' || (t.assignee && (t.assignee._id === user._id || t.assignee._id === user.id || t.assignee === user._id || t.assignee === user.id)))
                                        .map((task, idx) => {
                                            let statusColor = 'gray';
                                            let StatusIcon = (
                                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                            ); // Calendar for Upcoming

                                            if (task.status === 'Completed' || task.status === 'Done') {
                                                statusColor = 'emerald';
                                                StatusIcon = (
                                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                                );
                                            } else if (task.status === 'In Progress' || task.status === 'Review' || task.status === 'Ready for Review') {
                                                statusColor = 'amber';
                                                StatusIcon = (
                                                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                );
                                            }

                                            return (
                                                <div
                                                    key={task._id}
                                                    onClick={() => handleTaskClick(task)}
                                                    style={{ animationDelay: `${idx * 100}ms` }}
                                                    className={`relative animate-slide-up group cursor-pointer ${taskFilter === 'my' ? 'pl-0 md:pl-24 py-4' : ''}`}
                                                >
                                                    {/* Timeline Node - Only for My Tasks */}
                                                    {taskFilter === 'my' && (
                                                        <div className={`hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full items-center justify-center border-4 border-white dark:border-gray-900 z-10 transition-transform group-hover:scale-110 ${statusColor === 'emerald' ? 'bg-emerald-500 shadow-lg shadow-emerald-200' :
                                                            statusColor === 'amber' ? 'bg-amber-500 shadow-lg shadow-amber-200' :
                                                                'bg-white border-gray-200 text-gray-400'
                                                            }`}>
                                                            {StatusIcon}
                                                        </div>
                                                    )}

                                                    {/* Card */}
                                                    <div className={`h-full flex flex-col justify-between bg-white dark:bg-gray-800 rounded-xl p-6 border shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${statusColor === 'emerald' ? 'border-emerald-100 hover:border-emerald-300 hover:shadow-emerald-900/5' :
                                                        statusColor === 'amber' ? 'border-amber-100 hover:border-amber-300 hover:shadow-amber-900/5' :
                                                            'border-gray-100 dark:border-gray-700 hover:border-blue-200'
                                                        }`}>
                                                        <div className="mb-4">
                                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                                <h4 className="font-display font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                                                                    {task.title}
                                                                </h4>
                                                                <span className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${statusColor === 'emerald' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                                                    statusColor === 'amber' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                                                        /^[0-9a-fA-F]{24}$/.test(task.status) ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' :
                                                                            'bg-gray-50 text-gray-600 border border-gray-100'
                                                                    }`}>
                                                                    {/^[0-9a-fA-F]{24}$/.test(task.status) ?
                                                                        (task.project?.teacher?.name ? `Assigned by ${task.project.teacher.name.split(' ')[0]}` : 'Assigned')
                                                                        : task.status}
                                                                </span>
                                                            </div>
                                                            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed line-clamp-3">
                                                                {task.description}
                                                            </p>
                                                        </div>

                                                        {/* Task Assignee (Only for All Tasks view) */}
                                                        {taskFilter === 'all' && task.assignee && (
                                                            <div className="mb-4 flex items-center gap-2">
                                                                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                                                                    {task.assignee.name ? task.assignee.name.charAt(0) : '?'}
                                                                </div>
                                                                <span className="text-xs text-gray-500">{task.assignee.name || 'Unassigned'}</span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-gray-700/50 mt-auto">
                                                            <div className="flex items-center gap-3">
                                                                {task.submissionType === 'code' && (
                                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded" title="Code Task">
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                                                                        Code
                                                                    </div>
                                                                )}
                                                                {task.evidenceLinks?.length > 0 && (
                                                                    <div className="flex items-center gap-1.5 text-xs text-gray-500 bg-blue-50 text-blue-600 px-2 py-1 rounded" title="Artifacts">
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                                        {task.evidenceLinks.length}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="text-xs font-medium">
                                                                {task.status === 'Completed' || task.status === 'Done' ? (
                                                                    <span className="text-emerald-600 flex items-center gap-1">
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                                        Done
                                                                        {/* Name tag already handled in TaskCard logic but adding here explicitly if needed */}
                                                                        {task.assignee?.name && (
                                                                            <span className="ml-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] hidden md:inline-flex">
                                                                                by {task.assignee.name.split(' ')[0]}
                                                                            </span>
                                                                        )}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-400">
                                                                        {group?.project?.deadline ? new Date(group.project.deadline).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No Due Date'}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                </div>
                            ) : (
                                <div className="text-center py-24 glass rounded-3xl border border-dashed border-gray-300">
                                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                    </div>
                                    <p className="text-gray-500 font-medium mb-1">No tasks assigned yet</p>
                                    <p className="text-sm text-gray-400">Wait for your team to plan or check with your teacher.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )
                }

                {/* VIEW MODE: WORKPLACE (SPLIT VIEW) */}
                {
                    viewMode === 'workplace' && selectedTask && (
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

                                    {selectedTask.feedback && (
                                        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 animate-fade-in">
                                            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2">
                                                <span>💬 Teacher Feedback</span>
                                            </h3>
                                            <p className="text-blue-800 text-sm mb-2 whitespace-pre-wrap">{selectedTask.feedback}</p>
                                            <div className="flex justify-between items-center text-xs text-blue-600 border-t border-blue-200 pt-2 mt-2">
                                                <span>By: {selectedTask.feedbackBy?.name || 'Teacher'}</span>
                                                <span>{selectedTask.feedbackAt && new Date(selectedTask.feedbackAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    )}

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
                                {/* Submission Type Tabs */}
                                <div className="flex border-b border-gray-200 bg-white px-2">
                                    <button
                                        onClick={() => setActiveTab('code')}
                                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'code' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                    >
                                        Code Editor
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('github')}
                                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'github' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                                    >
                                        GitHub / Link
                                    </button>
                                </div>

                                <div className="flex-1 relative overflow-y-auto">
                                    {/* Code Editor View */}
                                    {activeTab === 'code' ? (
                                        <>
                                            <CodeEditor
                                                initialCode={code}
                                                language={'javascript'}
                                                onChange={setCode}
                                                height="100%"
                                            />
                                        </>
                                    ) : (
                                        /* Non-Code Submission View (GitHub / Links) */
                                        <div className="p-8 max-w-lg mx-auto">
                                            <div className="mb-8">
                                                <h3 className="text-lg font-bold text-gray-900 mb-2">Submit Evidence</h3>
                                                <p className="text-sm text-gray-500 mb-4">Attach a proof of completion.</p>

                                                {/* Evidence Mode Toggle */}
                                                <div className="flex bg-gray-100 p-1 rounded-lg mb-4 w-fit">
                                                    <button
                                                        onClick={() => setEvidenceMode('link')}
                                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${evidenceMode === 'link' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                    >
                                                        Link / URL
                                                    </button>
                                                    <button
                                                        onClick={() => setEvidenceMode('file')}
                                                        className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${evidenceMode === 'file' ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                    >
                                                        File Upload
                                                    </button>
                                                </div>

                                                {evidenceMode === 'link' ? (
                                                    <form onSubmit={async (e) => {
                                                        e.preventDefault();
                                                        const url = e.target.elements.url.value;
                                                        if (!url) return;
                                                        try {
                                                            setLoading(true);
                                                            await api.post(`/api/tasks/${selectedTask._id}/evidence`, { url, resourceType: 'link' });
                                                            await api.put(`/api/tasks/${selectedTask._id}`, { status: 'Ready for Review' });
                                                            addToast('Evidence added & submitted for review!', 'success');
                                                            await fetchUserTasks();
                                                            // Refresh Performance Chart
                                                            try {
                                                                const perfRes = await api.get('/api/analytics/performance');
                                                                setPerformanceData(perfRes.data.history);
                                                            } catch (e) { }
                                                        } catch (err) { addToast('Failed: ' + err.message, 'error'); }
                                                        finally { setLoading(false); }
                                                    }} className="flex gap-2">
                                                        <input name="url" type="url" placeholder="https://docs.google.com/..." className="input flex-1" required />
                                                        <button type="submit" disabled={loading} className="btn btn-secondary">Add Link</button>
                                                    </form>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <input
                                                            type="file"
                                                            onChange={async (e) => {
                                                                const file = e.target.files[0];
                                                                if (!file) return;

                                                                const formData = new FormData();
                                                                formData.append('file', file);

                                                                try {
                                                                    setLoading(true);
                                                                    // 1. Upload to Cloudinary
                                                                    const uploadRes = await api.post('/api/upload', formData, {
                                                                        headers: { 'Content-Type': 'multipart/form-data' }
                                                                    });

                                                                    const { url, publicId, resourceType } = uploadRes.data.file;

                                                                    // 2. Save Evidence
                                                                    await api.post(`/api/tasks/${selectedTask._id}/evidence`, {
                                                                        url,
                                                                        publicId,
                                                                        resourceType
                                                                    });

                                                                    // 3. Auto-Submit
                                                                    await api.put(`/api/tasks/${selectedTask._id}`, { status: 'Ready for Review' });

                                                                    addToast('File uploaded & submitted for review!', 'success');
                                                                    await fetchUserTasks();
                                                                    // Refresh Performance Chart
                                                                    try {
                                                                        const perfRes = await api.get('/api/analytics/performance');
                                                                        setPerformanceData(perfRes.data.history);
                                                                    } catch (e) { }
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    addToast('Upload failed: ' + (err.response?.data?.message || err.message), 'error');
                                                                } finally {
                                                                    setLoading(false);
                                                                }
                                                            }}
                                                            className="file-input file-input-bordered file-input-emerald w-full max-w-xs"
                                                            accept="image/*,application/pdf"
                                                        />
                                                    </div>
                                                )}

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
                                                            await api.put(`/api/tasks/${selectedTask._id}`, { status: 'Ready for Review' });
                                                            addToast('Repo linked & submitted for review!', 'success');
                                                            await fetchUserTasks();
                                                        } catch (err) { addToast('Failed: ' + err.message, 'error'); }
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

                                {/* Action Bar (Only for Code) */}
                                {activeTab === 'code' && (
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
                                                            status: 'Ready for Review'
                                                        });
                                                        addToast('Code submitted successfully! Task moved to Review.', 'success');

                                                        // Refresh Data
                                                        await fetchUserTasks();
                                                        try {
                                                            const perfRes = await api.get('/api/analytics/performance');
                                                            setPerformanceData(perfRes.data.history);
                                                        } catch (e) { }

                                                        handleBackToDashboard();
                                                    } catch (error) {
                                                        console.error('Submission error:', error);
                                                        addToast('Failed to submit code', 'error');
                                                    } finally {
                                                        setLoading(false);
                                                    }
                                                }}
                                            >
                                                {loading ? 'Submitting...' : (selectedTask.feedback ? 'Resubmit Solution' : 'Submit Solution')}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Submit Button for Non-Code tasks */}
                                {activeTab === 'github' && (
                                    <div className="bg-gray-50 border-t border-gray-200 p-4 flex justify-end">
                                        <button
                                            className="btn btn-primary"
                                            onClick={async () => {
                                                try {
                                                    await api.put(`/api/tasks/${selectedTask._id}`, { status: 'Ready for Review' });
                                                    addToast('Task submitted for review!', 'success');
                                                    await fetchUserTasks();
                                                    handleBackToDashboard();
                                                } catch (e) { addToast('Error: ' + e.message, 'error'); }
                                            }}
                                        >
                                            Mark as Ready for Review
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                }
            </main >
        </div >
    );
};

export default StudentDashboard;
