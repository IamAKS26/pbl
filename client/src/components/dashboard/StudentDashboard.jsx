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
import { calculateLevelInfo } from '../../utils/gamification';

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
    const [activeTooltip, setActiveTooltip] = useState(null);

    // Code Editor State (lifting state here for the split view)
    const [code, setCode] = useState('// Select a task to start coding');
    const [activeTab, setActiveTab] = useState('code'); // 'code' | 'github'
    const [evidenceMode, setEvidenceMode] = useState('link'); // 'link' | 'file'

    // Initial Load Effect
    useEffect(() => {
        const initDashboard = async () => {
            if (!user) return;
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

        initDashboard();
    }, [user?._id]); // Only re-run if user ID changes (login/logout), not on every prop change

    // Polling Effect
    useEffect(() => {
        if (!user) return;

        const intervalId = setInterval(async () => {
            await fetchUserTasks(true); // Silent fetch
            try {
                // Update User Stats (XP/Level)
                await loadUser();

                const perfRes = await api.get('/api/analytics/performance');
                setPerformanceData(perfRes.data.history);

                // Poll group
                const groupRes = await api.get('/api/groups');
                if (groupRes.data.success && groupRes.data.groups.length > 0) {
                    setGroup(groupRes.data.groups[0]);
                } else {
                    setGroup(null);
                }
            } catch (e) { }
        }, 10000);

        return () => clearInterval(intervalId);
    }, [user?._id]); // Only re-setup polling if user changes



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
        <div className="h-screen flex flex-col bg-transparent overflow-hidden text-gray-900 dark:text-gray-100 font-sans transition-colors duration-500">
            {/* 1. TOP NAVBAR */}
            <header className="h-18 glass sticky top-0 z-50 px-6 flex items-center justify-between shrink-0 transition-all duration-300">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3 group cursor-pointer">
                        <div className="w-10 h-10 bg-gradient-to-tr from-emerald-500 to-teal-400 rounded-xl flex items-center justify-center text-white font-display font-bold text-xl shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
                            P
                        </div>
                        <span className="font-display font-bold text-xl tracking-tight text-gray-900 dark:text-white">
                            PBL <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">GyanSetu</span>
                        </span>
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
                    {(() => {
                        const info = calculateLevelInfo(user?.xp || 0);
                        return (
                            <div
                                className="hidden md:flex items-center gap-4 bg-gray-50 dark:bg-white/5 px-4 py-1.5 rounded-full border border-gray-100 dark:border-white/10 cursor-help"
                                onMouseEnter={(e) => {
                                    const rect = e.currentTarget.getBoundingClientRect();
                                    setActiveTooltip({
                                        x: rect.left + rect.width / 2,
                                        y: rect.top,
                                        data: info
                                    });
                                }}
                                onMouseLeave={() => setActiveTooltip(null)}
                            >
                                <div className="flex items-center gap-2" title="Experience Points">
                                    <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{user?.xp || 0} XP</span>
                                </div>
                                <div className="w-px h-4 bg-gray-300 dark:bg-white/20"></div>
                                <div className="flex items-center gap-2" title="Current Level">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300">Level {info.currentLevel}</span>
                                </div>
                            </div>
                        );
                    })()}

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
                            {/* Welcome Banner */}
                            <div className="mb-8 p-8 md:p-10 bg-gradient-to-br from-emerald-800 via-teal-700 to-emerald-950 rounded-3xl text-white shadow-2xl relative overflow-hidden animate-fade-in group border border-white/10">
                                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>

                                <div className="relative z-10">
                                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                                        <div>
                                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-50 mb-4 border border-white/20 shadow-lg">
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                                                Active Session
                                            </div>
                                            <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 tracking-tight leading-tight">
                                                Ready to Code, <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 to-teal-100">{user?.name.split(' ')[0]}</span>?
                                            </h1>
                                            <p className="text-emerald-100/80 text-lg max-w-xl font-light leading-relaxed">
                                                Team <strong className="text-white font-medium">"{group?.name}"</strong> is pushing boundaries. Let's keep the momentum going!
                                            </p>
                                        </div>

                                        {/* Deadline Badge */}
                                        <div className="bg-white/5 backdrop-blur-xl px-6 py-4 rounded-2xl border border-white/10 flex items-center gap-5 hover:bg-white/10 transition-colors shadow-lg group-hover:translate-y-[-2px] duration-300">
                                            <div className="p-3 bg-amber-500/20 rounded-xl border border-amber-500/30">
                                                <svg className="w-6 h-6 text-amber-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-xs text-emerald-200 uppercase font-bold tracking-widest opacity-80">Deadline</span>
                                                <div className="flex items-baseline gap-1">
                                                    <span className="font-bold text-white text-2xl font-display">
                                                        {group?.project?.deadline ? Math.ceil((new Date(group.project.deadline) - new Date()) / (1000 * 60 * 60 * 24)) : '--'}
                                                    </span>
                                                    <span className="text-sm text-emerald-100 font-medium">days left</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Progress Bar & Stats */}
                                    <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <div className="lg:col-span-2 bg-black/20 rounded-2xl p-6 backdrop-blur-md border border-white/5 hover:bg-black/30 transition-colors">
                                            <div className="flex justify-between items-end mb-4">
                                                <div>
                                                    <h4 className="text-emerald-50 font-semibold mb-1">Project Completion</h4>
                                                    <div className="text-xs text-emerald-200/60">Based on task status</div>
                                                </div>
                                                <span className="text-3xl font-display font-bold text-white">
                                                    {Math.round((tasks.filter(t => t.status === 'Completed' || t.status === 'Done').length / (tasks.length || 1)) * 100)}%
                                                </span>
                                            </div>

                                            <div className="w-full bg-white/5 rounded-full h-4 overflow-hidden backdrop-blur-sm border border-white/5">
                                                <div
                                                    className="bg-gradient-to-r from-emerald-400 to-teal-400 h-full rounded-full shadow-[0_0_20px_rgba(52,211,153,0.4)] relative transition-all duration-1000 ease-out"
                                                    style={{ width: `${Math.round((tasks.filter(t => t.status === 'Completed' || t.status === 'Done').length / (tasks.length || 1)) * 100)}%` }}
                                                >
                                                    <div className="absolute inset-0 bg-white/30 animate-shimmer"></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Mini Performance Chart Area */}
                                        <div className="bg-white/5 rounded-2xl p-6 border border-white/5 backdrop-blur-md flex flex-col justify-center items-center hover:bg-white/10 transition-colors">
                                            <div className="text-emerald-200 text-sm font-medium mb-1">Your XP</div>
                                            <div className="text-3xl font-display font-bold text-amber-300 drop-shadow-sm">{user?.xp || 0}</div>
                                            <div className="text-xs text-white/40 mt-1">Level {calculateLevelInfo(user?.xp || 0).currentLevel} • {calculateLevelInfo(user?.xp || 0).title}</div>
                                        </div>
                                    </div>
                                </div>

                                /* Background Decorations */
                                <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-emerald-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 animate-pulse-slow"></div>
                                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/20 rounded-full blur-[80px] translate-y-1/2 -translate-x-1/4"></div>
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
                                                    style={{ animationDelay: `${idx * 75}ms` }}
                                                    className={`relative animate-slide-up group cursor-pointer ${taskFilter === 'my' ? 'pl-0 md:pl-24 py-4' : ''}`}
                                                >
                                                    {/* Timeline Node - Only for My Tasks */}
                                                    {taskFilter === 'my' && (
                                                        <div className={`hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full items-center justify-center border-4 border-white dark:border-gray-900 z-10 transition-transform duration-300 group-hover:scale-110 ${statusColor === 'emerald' ? 'bg-gradient-to-br from-emerald-400 to-teal-500 shadow-lg shadow-emerald-500/30' :
                                                            statusColor === 'amber' ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-500/30' :
                                                                'bg-white border-gray-200 text-gray-400'
                                                            }`}>
                                                            {StatusIcon}
                                                        </div>
                                                    )}

                                                    {/* Glass Card */}
                                                    <div className={`h-full flex flex-col justify-between glass-card p-6 relative overflow-hidden group-hover:border-emerald-500/30 dark:group-hover:border-emerald-400/30`}>
                                                        {/* Glow Effect on Hover */}
                                                        <div className="absolute inset-0 bg-gradient-to-tr from-emerald-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none dark:from-emerald-900/10"></div>

                                                        <div className="mb-4 relative z-10">
                                                            <div className="flex items-start justify-between gap-3 mb-3">
                                                                <h4 className="font-display font-bold text-lg text-gray-900 dark:text-gray-100 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-tight">
                                                                    {task.title}
                                                                </h4>
                                                                <span className={`shrink-0 badge ${statusColor === 'emerald' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 shadow-emerald-100' :
                                                                    statusColor === 'amber' ? 'bg-amber-100 text-amber-800 border-amber-200 shadow-amber-100' :
                                                                        /^[0-9a-fA-F]{24}$/.test(task.status) ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                                                            'bg-gray-100 text-gray-600 border-gray-200'
                                                                    }`}>
                                                                    {/^[0-9a-fA-F]{24}$/.test(task.status) ?
                                                                        (task.project?.teacher?.name ? `Assigned` : 'Assigned')
                                                                        : task.status}
                                                                </span>
                                                            </div>
                                                            <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed line-clamp-2 font-medium">
                                                                {task.description}
                                                            </p>
                                                        </div>

                                                        {/* Task Assignee (Only for All Tasks view) */}
                                                        {taskFilter === 'all' && task.assignee && (
                                                            <div className="mb-4 flex items-center gap-2 relative z-10">
                                                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 text-emerald-700 flex items-center justify-center text-xs font-bold border border-emerald-200 shadow-sm">
                                                                    {task.assignee.name ? task.assignee.name.charAt(0) : '?'}
                                                                </div>
                                                                <span className="text-xs text-gray-500 font-medium">{task.assignee.name || 'Unassigned'}</span>
                                                            </div>
                                                        )}

                                                        <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-white/5 mt-auto relative z-10">
                                                            <div className="flex items-center gap-2">
                                                                {task.submissionType === 'code' && (
                                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-100/50 px-2 py-1 rounded border border-gray-200/50" title="Code Task">
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                                                                        Code
                                                                    </div>
                                                                )}
                                                                {task.evidenceLinks?.length > 0 && (
                                                                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50/50 px-2 py-1 rounded border border-blue-100/50" title="Artifacts">
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                                        {task.evidenceLinks.length}
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="text-xs font-bold">
                                                                {task.status === 'Completed' || task.status === 'Done' ? (
                                                                    <span className="text-emerald-600 flex items-center gap-1">
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                                                        Done
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-400 flex items-center gap-1">
                                                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
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
                                <div className="text-center py-24 glass-panel border border-dashed border-gray-300/50 dark:border-white/10">
                                    <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300 dark:text-gray-600">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                    </div>
                                    <p className="text-gray-500 dark:text-gray-400 font-medium mb-1">No tasks assigned yet</p>
                                    <p className="text-sm text-gray-400 dark:text-gray-500">Wait for your team to plan or check with your teacher.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )
                }

                {/* VIEW MODE: WORKPLACE (SPLIT VIEW) */}
                {
                    viewMode === 'workplace' && selectedTask && (
                        <div className="h-full flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-200/50 dark:divide-white/5 bg-white/40 dark:bg-gray-900/40 backdrop-blur-xl">
                            {/* LEFT: Task Description & Instructions */}
                            <div className="w-full md:w-1/3 h-1/2 md:h-full overflow-y-auto scrollbar-hide border-r border-white/20">
                                <div className="p-6">
                                    <div className="mb-6">
                                        <div className="flex items-center justify-between mb-3">
                                            <h2 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-50">{selectedTask.title}</h2>
                                            <button onClick={handleBackToDashboard} className="md:hidden text-gray-500">✕</button>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs rounded-lg font-bold uppercase tracking-wider shadow-sm">
                                                {selectedTask.priority}
                                            </span>
                                            <span className="px-2.5 py-1 bg-white text-gray-600 border border-gray-200 text-xs rounded-lg font-medium shadow-sm">
                                                {selectedTask.status}
                                            </span>
                                        </div>

                                        <div className="prose prose-sm prose-emerald dark:prose-invert max-w-none text-gray-600 dark:text-gray-300 leading-relaxed">
                                            <p>{selectedTask.description}</p>
                                        </div>
                                    </div>

                                    {selectedTask.feedback && (
                                        <div className="mb-6 bg-blue-50/80 border border-blue-100 rounded-xl p-5 shadow-sm animate-fade-in relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-4 opacity-10">
                                                <svg className="w-16 h-16 text-blue-500" fill="currentColor" viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z" /></svg>
                                            </div>
                                            <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2 relative z-10">
                                                <span>💬 Teacher Feedback</span>
                                            </h3>
                                            <p className="text-blue-800 text-sm mb-3 whitespace-pre-wrap relative z-10">{selectedTask.feedback}</p>
                                            <div className="flex justify-between items-center text-xs text-blue-600 border-t border-blue-200/50 pt-2 relative z-10">
                                                <span className="font-medium">By: {selectedTask.feedbackBy?.name || 'Teacher'}</span>
                                                <span>{selectedTask.feedbackAt && new Date(selectedTask.feedbackAt).toLocaleDateString()}</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="border-t border-gray-100 dark:border-white/5 pt-6 mt-6">
                                        <h3 className="font-bold text-gray-900 dark:text-gray-100 mb-4 text-sm uppercase tracking-wider flex items-center gap-2">
                                            <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            Acceptance Criteria
                                        </h3>
                                        <ul className="space-y-3">
                                            <li className="flex gap-3 text-sm text-gray-600 dark:text-gray-400 p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                                <span className="text-emerald-500 font-bold shrink-0">01</span>
                                                <span>Code must compile/run without errors and meet functional requirements.</span>
                                            </li>
                                            <li className="flex gap-3 text-sm text-gray-600 dark:text-gray-400 p-3 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
                                                <span className="text-emerald-500 font-bold shrink-0">02</span>
                                                <span>Functionality must match the provided description accurately.</span>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {/* RIGHT: Editor & Action Area */}
                            <div className="w-full md:w-2/3 bg-gray-50/50 dark:bg-gray-900/50 h-1/2 md:h-full flex flex-col relative backdrop-blur-sm">

                                {/* Submission Type Tabs */}
                                <div className="flex border-b border-gray-200 dark:border-white/5 bg-white/50 dark:bg-white/5 px-4 backdrop-blur-md">
                                    <button
                                        onClick={() => setActiveTab('code')}
                                        className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all ${activeTab === 'code' ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                                            Code Editor
                                        </span>
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('github')}
                                        className={`px-6 py-4 text-sm font-semibold border-b-2 transition-all ${activeTab === 'github' ? 'border-emerald-500 text-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
                                    >
                                        <span className="flex items-center gap-2">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                            GitHub / Link
                                        </span>
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
                                        <div className="p-10 max-w-2xl mx-auto">
                                            <div className="mb-10 text-center">
                                                <div className="w-16 h-16 bg-gradient-to-tr from-emerald-100 to-teal-100 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                                                    <svg className="w-8 h-8 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                                </div>
                                                <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-gray-100 mb-2">Submit Your Work</h3>
                                                <p className="text-gray-500">Provide a link to your work or upload a file directly.</p>
                                            </div>

                                            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-white/5 p-1">
                                                <div className="flex p-1 bg-gray-50 dark:bg-gray-900/50 rounded-xl mb-6 mx-6 mt-6">
                                                    <button
                                                        onClick={() => setEvidenceMode('link')}
                                                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${evidenceMode === 'link' ? 'bg-white shadow-sm text-gray-900 border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}
                                                    >
                                                        Link / URL
                                                    </button>
                                                    <button
                                                        onClick={() => setEvidenceMode('file')}
                                                        className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${evidenceMode === 'file' ? 'bg-white shadow-sm text-gray-900 border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'}`}
                                                    >
                                                        File Upload
                                                    </button>
                                                </div>

                                                <div className="px-6 pb-6">
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
                                                        }} className="flex gap-3">
                                                            <input name="url" type="url" placeholder="Paste your link here (e.g. Google Docs, Figma)..." className="input flex-1 bg-gray-50 border-transparent focus:bg-white transition-colors" required />
                                                            <button type="submit" disabled={loading} className="btn btn-primary px-8">Add Link</button>
                                                        </form>
                                                    ) : (
                                                        <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group cursor-pointer relative">
                                                            <input
                                                                type="file"
                                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
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
                                                                accept="image/*,application/pdf"
                                                            />
                                                            <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                                                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                                            </div>
                                                            <p className="text-gray-900 font-medium">Click to upload or drag and drop</p>
                                                            <p className="text-sm text-gray-500 mt-1">PDF, PNG, JPG up to 10MB</p>
                                                        </div>
                                                    )}
                                                </div>

                                                {selectedTask.evidenceLinks?.length > 0 && (
                                                    <div className="px-6 pb-6 pt-0">
                                                        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Attached Evidence</h4>
                                                        <div className="space-y-2">
                                                            {selectedTask.evidenceLinks.map((link, i) => (
                                                                <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 hover:bg-white transition-colors">
                                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                                                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                                        </div>
                                                                        <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-gray-700 font-medium text-sm truncate hover:text-blue-600 transition-colors">{link.url}</a>
                                                                    </div>
                                                                    <span className="text-xs text-gray-400">Uploaded</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mt-8 border-t border-gray-100 pt-8 opacity-80 hover:opacity-100 transition-opacity">
                                                <div className="flex items-center justify-between pointer-events-none mb-4">
                                                    <h3 className="text-lg font-bold text-gray-900 pointer-events-auto">Link GitHub Repository</h3>
                                                    <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-500">Optional</span>
                                                </div>

                                                {selectedTask.githubRepo ? (
                                                    <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-2xl shadow-sm">📦</div>
                                                            <div>
                                                                <p className="font-bold text-emerald-900">Repository Linked</p>
                                                                <a href={selectedTask.githubRepo.url} target="_blank" className="text-sm text-emerald-700 hover:underline">
                                                                    {selectedTask.githubRepo.owner}/{selectedTask.githubRepo.repo}
                                                                </a>
                                                            </div>
                                                        </div>
                                                        <div className="w-8 h-8 bg-emerald-200 text-emerald-700 rounded-full flex items-center justify-center">✓</div>
                                                    </div>
                                                ) : (
                                                    <form onSubmit={async (e) => {
                                                        e.preventDefault();
                                                        const repoUrl = e.target.elements.repoUrl.value;
                                                        if (!repoUrl) return;
                                                        try {
                                                            setLoading(true);
                                                            await api.post(`/api/tasks/${selectedTask._id}/github-repo`, { repoUrl });
                                                            await api.put(`/api/tasks/${selectedTask._id}`, { status: 'Ready for Review' });
                                                            addToast('Repo linked & submitted for review!', 'success');
                                                            await fetchUserTasks();
                                                        } catch (err) { addToast('Failed: ' + err.message, 'error'); }
                                                        finally { setLoading(false); }
                                                    }} className="flex gap-3">
                                                        <input name="repoUrl" type="url" placeholder="https://github.com/user/repo" className="input flex-1 bg-white" required />
                                                        <button type="submit" disabled={loading} className="btn bg-gray-900 text-white hover:bg-gray-800">Link Repo</button>
                                                    </form>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Bar (Only for Code) */}
                                {activeTab === 'code' && (
                                    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-white/5 p-4 shrink-0 flex justify-between items-center z-10 shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                                        <div className="text-sm text-gray-500 font-medium">
                                            Javascript Environment
                                        </div>
                                        <div className="flex gap-3">
                                            <button className="px-5 py-2.5 text-gray-600 hover:bg-gray-100 rounded-xl text-sm font-semibold transition-colors">
                                                Run Tests
                                            </button>
                                            <button
                                                className="btn btn-primary"
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
                            </div>
                        </div>
                    )
                }
            </main>

            {/* Fixed Tooltip Portal */}
            {activeTooltip && (
                <div
                    className="fixed z-[100] bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-white/10 p-4 transition-all pointer-events-none animate-fade-in"
                    style={{
                        left: activeTooltip.x,
                        top: activeTooltip.y - 10,
                        transform: 'translate(-50%, -100%)'
                    }}
                >
                    <div className="text-center w-64">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Current Progress</div>
                        <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-2 overflow-hidden">
                            <div
                                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                                style={{ width: `${activeTooltip.data.progress}%` }}
                            ></div>
                        </div>
                        <p className="text-sm font-bold text-gray-800 dark:text-white mb-1">
                            {activeTooltip.data.xpneeded} XP to Level {activeTooltip.data.nextLevel}
                        </p>
                        {activeTooltip.data.nextLevelReward && (
                            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-2 py-1 rounded-lg text-xs font-bold mt-2 border border-amber-100 dark:border-amber-800">
                                🎁 Reward: {activeTooltip.data.nextLevelReward}
                            </div>
                        )}
                        {/* Arrow */}
                        <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-white dark:bg-gray-800 border-b border-r border-gray-100 dark:border-white/10 transform rotate-45"></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentDashboard;
