import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import { formatDate } from '../../utils/dateHelpers';
import api from '../../utils/api';
import ReviewsTab from './ReviewsTab';
import GroupFormationWizard from './GroupFormationWizard';
import PerformanceChart from '../common/PerformanceChart';
import { PROJECT_TEMPLATES } from '../../constants/templates';
import { calculateLevelInfo } from '../../utils/gamification';

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { theme, toggleTheme } = useTheme();
    const { addToast } = useToast();
    const { projects: contextProjects, fetchProjects: contextFetchProjects, createProject, deleteProject, loading, assignTemplate } = useProject();

    // UI State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('projects');
    const [loadingData, setLoadingData] = useState(false);
    const [pendingReviewsCount, setPendingReviewsCount] = useState(0);

    useEffect(() => {
        // Fetch pending reviews count
        const fetchReviewCount = async () => {
            // Optimization: create specific endpoint for count or lightweight fetch
            // For MVP, just reusing logic but ideally this should be a light endpoint
            try {
                const res = await api.get('/api/tasks');
                const count = res.data.tasks.filter(t => t.status === 'Review' || t.status === 'In Review').length;
                setPendingReviewsCount(count);
            } catch (err) {
                console.error('Failed to fetch review count', err);
            }
        };
        fetchReviewCount();
    }, []);

    // Data State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        deadline: '',
        tasks: [] // Added tasks array to state
    });
    const [students, setStudents] = useState([]);
    const [groups, setGroups] = useState([]);
    const [projects, setProjects] = useState([]);

    // Notifications State
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        // Poll for notifications every minute or on mount
        const fetchNotifications = async () => {
            try {
                const res = await api.get('/api/notifications');
                setNotifications(res.data.notifications);
            } catch (err) {
                console.error('Failed to fetch notifications', err);
            }
        };

        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000);
        return () => clearInterval(interval);
    }, []);

    const markAsRead = async (id) => {
        try {
            await api.put(`/api/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
        } catch (err) {
            console.error('Failed to mark read', err);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/api/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
            addToast('All notifications marked as read', 'success');
        } catch (err) {
            console.error('Failed to mark all read', err);
        }
    };

    // Group Management State
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [editingGroupName, setEditingGroupName] = useState('');
    const [showEditMembersModal, setShowEditMembersModal] = useState(false);
    const [showAssignProjectModal, setShowAssignProjectModal] = useState(false);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [showGroupWizard, setShowGroupWizard] = useState(false);
    const [newGroupData, setNewGroupData] = useState({ name: '', members: [] });

    // Performance View State
    const [showPerformanceModal, setShowPerformanceModal] = useState(false);
    const [selectedStudentRes, setSelectedStudentRes] = useState(null);
    const [studentPerformanceData, setStudentPerformanceData] = useState([]);

    // Hover Tooltip State
    const [activeTooltip, setActiveTooltip] = useState(null); // { x, y, data }

    const fetchProjects = async (silent = false) => {
        try {
            if (!silent) setLoadingData(true);
            const res = await api.get('/api/projects');
            // Assuming teacher sees only their projects or all
            // Filter if necessary on backend

            setProjects(res.data.projects);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            if (!silent) setLoadingData(false);
        }
    };

    const fetchStudents = async (silent = false) => {
        try {
            if (!silent) setLoadingData(true);
            // Fetch all students (or students in teacher's projects)
            const res = await api.get('/api/students');
            setStudents(res.data.students);
        } catch (error) {
            console.error('Error fetching students:', error);
        } finally {
            if (!silent) setLoadingData(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'projects') {
            fetchProjects();
            // Poll projects every 15s
            const interval = setInterval(() => fetchProjects(true), 15000);
            return () => clearInterval(interval);
        } else if (activeTab === 'students') {
            fetchStudents();
            const interval = setInterval(() => fetchStudents(true), 15000);
            return () => clearInterval(interval);
        } else if (activeTab === 'groups') {
            fetchGroupsAndStudents();
        } else if (activeTab === 'reviews') {
            // logic for reviews if needed
        }
    }, [activeTab]);

    const calculateAverage = (mastery) => {
        if (!mastery || Object.keys(mastery).length === 0) return 0;
        const scores = Object.values(mastery);
        const sum = scores.reduce((a, b) => a + b, 0);
        return (sum / scores.length).toFixed(1);
    };

    const fetchGroupsAndStudents = async () => {
        try {
            setLoadingData(true);
            const [groupRes, studentRes] = await Promise.all([
                api.get('/api/groups'),
                api.get('/api/students')
            ]);
            setGroups(groupRes.data.groups);
            setStudents(studentRes.data.students);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingData(false);
        }
    };



    const handleSaveGroups = async (newGroups) => {
        try {
            setLoadingData(true);
            // 3. Save groups
            // Note: The wizard generates the structure, we need to save it. 
            // Ideally we might want to clear old groups first? Or append? 
            // For this demo, let's assume we are appending or user deleted old ones manually if needed.
            // Actually, usually "Auto-Generate" implies a fresh start or filling in gaps. 
            // Let's just create them.

            for (const group of newGroups) {
                // Map full members objects back to IDs if API expects IDs
                const formattedGroup = {
                    ...group,
                    members: group.members.map(m => m._id)
                };
                await api.post('/api/groups', formattedGroup);
            }

            // 4. Refresh
            await fetchGroupsAndStudents();
            setShowGroupWizard(false);
            addToast(`Created ${newGroups.length} balanced groups!`, 'success');

        } catch (err) {
            console.error('Error saving groups:', err);
            addToast('Failed to save groups', 'error');
        } finally {
            setLoadingData(false);
        }
    };

    const updateGroupMembers = async (groupId, newMembers) => {
        try {
            await api.put(`/api/groups/${groupId}`, { members: newMembers });
            fetchGroupsAndStudents();
        } catch (err) {
            console.error(err);
            addToast('Failed to update group members', 'error');
        }
    };

    const handleCreateManualGroup = async () => {
        if (!newGroupData.name.trim()) {
            addToast('Please enter a group name', 'error');
            return;
        }
        if (newGroupData.members.length === 0) {
            addToast('Please select at least one member', 'error');
            return;
        }

        try {
            setLoadingData(true);
            await api.post('/api/groups', newGroupData);
            await fetchGroupsAndStudents();
            setShowCreateGroupModal(false);
            setNewGroupData({ name: '', members: [] });
            addToast('Group created successfully!', 'success');
        } catch (err) {
            console.error(err);
            addToast('Failed to create group', 'error');
        } finally {
            setLoadingData(false);
        }
    };

    const toggleNewGroupMember = (studentId) => {
        if (newGroupData.members.includes(studentId)) {
            setNewGroupData({
                ...newGroupData,
                members: newGroupData.members.filter(id => id !== studentId)
            });
        } else {
            setNewGroupData({
                ...newGroupData,
                members: [...newGroupData.members, studentId]
            });
        }
    };

    const handleEditMembers = (group) => {
        setSelectedGroup(group);
        setEditingGroupName(group.name);
        setShowEditMembersModal(true);
    };

    const handleUpdateGroupName = async () => {
        if (!selectedGroup || !editingGroupName.trim()) return;
        try {
            await api.put(`/api/groups/${selectedGroup._id}`, { name: editingGroupName });

            // Update local state locally to reflect immediately if needed, though fetch will do it
            setSelectedGroup(prev => ({ ...prev, name: editingGroupName }));

            // Refresh list
            fetchGroupsAndStudents();
            addToast('Group name updated!', 'success');
        } catch (err) {
            console.error(err);
            addToast('Failed to update group name', 'error');
        }
    };

    const handleAssignProject = (group) => {
        setSelectedGroup(group);
        setShowAssignProjectModal(true);
    };

    const handleRemoveMember = async (studentId) => {
        if (!selectedGroup) return;
        const newMembers = selectedGroup.members.filter(m => m._id !== studentId).map(m => m._id);
        await updateGroupMembers(selectedGroup._id, newMembers);
        setSelectedGroup({
            ...selectedGroup,
            members: selectedGroup.members.filter(m => m._id !== studentId)
        });
    };

    const handleAddMember = async (studentId) => {
        if (!selectedGroup) return;
        const newMembers = [...selectedGroup.members.map(m => m._id), studentId];
        await updateGroupMembers(selectedGroup._id, newMembers);
        // We rely on fetchGroupsAndStudents to update the selectedGroup properly if needed, 
        // but for local UI feedback effectively we might want to re-fetch or optimistically update.
        // For now, let's just close/refresh or rely on the parent refresh.
        // Actually, updateGroupMembers refreshes data. We should probably re-select the group from result?
        // Simpler: Just refresh page state. The modal is using 'selectedGroup' state. 
        // We should update 'selectedGroup' to reflect the change for immediate UI.
        const student = students.find(s => s._id === studentId);
        if (student) {
            setSelectedGroup({
                ...selectedGroup,
                members: [...selectedGroup.members, student]
            });
        }
    };

    const handleProjectAssignment = async (projectId) => {
        if (!selectedGroup) return;
        try {
            await api.put(`/api/groups/${selectedGroup._id}`, { project: projectId });
            await fetchGroupsAndStudents();
            await fetchProjects(); // Refresh projects to update student count
            setShowAssignProjectModal(false);
            addToast('Project assigned successfully!', 'success');
        } catch (err) {
            console.error(err);
            addToast('Failed to assign project', 'error');
        }
    };

    const handleTemplateAssignment = async (templateId) => {
        if (!selectedGroup) return;
        if (!window.confirm(`Assign "${PROJECT_TEMPLATES.find(t => t.id === templateId)?.title}" to ${selectedGroup.name}? This will create a new project instance.`)) return;

        const result = await assignTemplate(selectedGroup._id, templateId);
        if (result.success) {
            await fetchGroupsAndStudents();
            await fetchProjects(); // Refresh projects list
            setShowAssignProjectModal(false);
            addToast('Template assigned successfully!', 'success');
        } else {
            addToast(result.message, 'error');
        }
    };

    const getUnassignedStudents = () => {
        // A student is unassigned if they are not in any group's member list
        // Note: This logic assumes a student can belong to only ONE group globally or in this context.
        // If groups are per-project, it's more complex. Here we assume one active group per student for simplicity as per requirements.
        const assignedStudentIds = groups.flatMap(g => g.members.map(m => m._id));
        return students.filter(s => !assignedStudentIds.includes(s._id));
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setCreating(true);

        const result = await createProject(formData);

        if (result.success) {
            setShowCreateModal(false);
            setFormData({ title: '', description: '', deadline: '' });
        } else {
            setError(result.message);
        }

        setCreating(false);
    };

    const handleDelete = async (projectId) => {
        if (window.confirm('Are you sure you want to delete this project? This will also delete all tasks.')) {
            await deleteProject(projectId);
        }
    };

    // AI Generation State
    const [showAIModal, setShowAIModal] = useState(false);
    const [aiParams, setAiParams] = useState({ topic: '', difficulty: 'Medium', gradeLevel: '9th' });
    const [generatingAI, setGeneratingAI] = useState(false);

    const handleGenerateAI = async (e) => {
        e.preventDefault();
        setGeneratingAI(true);
        try {
            const res = await api.post('/api/ai/generate-template', aiParams);
            const template = res.data.template;
            // Auto-fill the create form with generated data
            setFormData({
                title: template.title,
                description: template.description,
                deadline: formData.deadline, // keep existing if set
                tasks: template.suggestedTasks || [] // Store AI tasks
            });

            // Store extra data to be used when "Create Project" is clicked?
            // For now, let's just populate the form and notify the user. 
            // The template might have tasks/phases that need to be created after the project.
            // Simplified: Just pre-fill title/desc. 
            // Better: Create the project immediately with this structure.
            // Let's create it immediately like "Use Template".

            // Immediately ask to create
            if (window.confirm(`Generated "${template.title}" with ${template.suggestedTasks?.length || 0} tasks. Create this project now?`)) {
                const projectData = {
                    title: template.title,
                    description: template.description,
                    // Map AI phases/tasks to our structure if possible. 
                    // Our createProject currently only takes title/desc/deadline.
                    // We might need a more robust "createFromTemplate" method.
                    // For this MVP, let's just prefill the form and close AI modal.
                    tasks: template.suggestedTasks || []
                };
                setFormData(projectData);
                setShowAIModal(false);
                setShowCreateModal(true);
                addToast('Project details generated! Review and click Create.', 'success');
            }

        } catch (err) {
            console.error(err);
            addToast('Failed to generate template through AI', 'error');
        } finally {
            setGeneratingAI(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent overflow-hidden flex flex-col font-sans text-gray-900 dark:text-gray-100 transition-colors duration-500">
            {/* Navbar */}
            <nav className="glass sticky top-0 z-50 h-18 px-6 flex items-center justify-between shrink-0 transition-all duration-300">
                <div className="flex items-center gap-8">
                    <div className="flex items-center gap-3 cursor-default">
                        <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-teal-500 rounded-xl flex items-center justify-center text-white font-display font-bold text-xl shadow-lg shadow-emerald-500/20">
                            P
                        </div>
                        <span className="font-display font-bold text-xl tracking-tight text-gray-900 dark:text-white">
                            PBL <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-500">Teacher</span>
                        </span>
                    </div>

                    {/* Navigation Links (Desktop) - Optional placeholder if we want top-level nav later */}
                </div>

                <div className="flex items-center gap-5">
                    {/* Theme Toggle */}
                    <button
                        onClick={toggleTheme}
                        className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-500 transition-colors"
                        title="Toggle Theme"
                    >
                        {theme === 'dark' ? '🌞' : '🌙'}
                    </button>

                    {/* Notification Bell */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="w-10 h-10 rounded-xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center text-gray-500 relative transition-colors"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                            </svg>
                            {unreadCount > 0 && (
                                <span className="absolute top-2 right-2 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900 animate-pulse" />
                            )}
                        </button>

                        {/* Dropdown */}
                        {showNotifications && (
                            <div className="absolute right-0 mt-3 w-80 glass-panel p-0 z-50 max-h-96 overflow-y-auto border border-gray-200/50 dark:border-white/10 shadow-2xl animate-fade-in origin-top-right">
                                <div className="px-4 py-3 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5 backdrop-blur-sm">
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Notifications</h3>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300">{unreadCount} new</span>
                                    </div>
                                    {unreadCount > 0 && (
                                        <button
                                            onClick={markAllAsRead}
                                            className="text-[10px] uppercase font-bold text-gray-400 hover:text-emerald-500 transition-colors tracking-wide"
                                        >
                                            Mark all read
                                        </button>
                                    )}
                                </div>
                                {notifications.length > 0 ? (
                                    notifications.map(notification => (
                                        <div
                                            key={notification._id}
                                            className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0 cursor-pointer flex gap-3 ${!notification.isRead ? 'bg-blue-50/30 dark:bg-blue-500/10' : ''}`}
                                            onClick={() => !notification.isRead && markAsRead(notification._id)}
                                        >
                                            <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!notification.isRead ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}></div>
                                            <div>
                                                <p className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{notification.message}</p>
                                                <p className="text-[10px] text-gray-400 mt-1 font-medium">{formatDate(notification.createdAt)}</p>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-8 text-center text-gray-400 dark:text-gray-500 text-sm italic">
                                        No notifications yet
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="hidden md:flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-white/10 h-8">
                        <div className="text-right">
                            <div className="text-sm font-bold text-gray-900 dark:text-white leading-none">{user?.name}</div>
                            <div className="text-[10px] uppercase tracking-wider text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">Teacher</div>
                        </div>
                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold border-2 border-white dark:border-white/10 shadow-sm">
                            {user?.name?.charAt(0) || 'T'}
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                {/* Background Decorations */}
                <div className="fixed top-20 right-0 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>
                <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

                <div className="max-w-7xl mx-auto mb-10">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-8 relative z-10">
                        <div>
                            <h2 className="text-4xl lg:text-5xl font-display font-bold text-gray-900 dark:text-white tracking-tight mb-2 drop-shadow-sm">
                                {activeTab === 'projects' ? 'Project Command' :
                                    activeTab === 'students' ? 'Student Growth' :
                                        activeTab === 'groups' ? 'Team Management' : 'Review Queue'}
                            </h2>
                            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl font-medium">
                                {activeTab === 'projects' ? 'Orchestrate and monitor your active learning campaigns.' :
                                    activeTab === 'students' ? 'Analyze mastery levels and individual student progress.' :
                                        activeTab === 'reviews' ? 'Provide feedback and grade assignments.' :
                                            'Organize students into balanced, effective teams.'}
                            </p>
                        </div>
                        {activeTab === 'projects' && (
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowAIModal(true)}
                                    className="btn bg-white dark:bg-gray-800 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50 hover:bg-purple-50 dark:hover:bg-purple-900/20 shadow-sm flex items-center gap-2 group"
                                >
                                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    <span className="font-bold">Generate with AI</span>
                                </button>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="btn btn-primary shadow-lg shadow-emerald-500/20 hover:translate-y-[-2px] transition-all"
                                >
                                    + Create Project
                                </button>
                            </div>
                        )}
                    </div>

                    {/* AI Modal */}
                    {showAIModal && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-fade-in">
                            <div className="glass-panel p-8 max-w-lg w-full animate-scale-in border border-white/20 shadow-2xl relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-amber-500"></div>
                                <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-2xl font-bold font-display text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                                        ✨ Generate Project plan
                                    </h3>
                                    <button onClick={() => setShowAIModal(false)} className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">✕</button>
                                </div>

                                <form onSubmit={handleGenerateAI} className="space-y-5">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Topic / Subject</label>
                                        <input
                                            type="text"
                                            required
                                            className="input bg-white/50 dark:bg-black/20 text-lg"
                                            placeholder="e.g. Sustainable Mars Colony..."
                                            value={aiParams.topic}
                                            onChange={e => setAiParams({ ...aiParams, topic: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                                            <select
                                                className="input"
                                                value={aiParams.gradeLevel}
                                                onChange={e => setAiParams({ ...aiParams, gradeLevel: e.target.value })}
                                            >
                                                <option>6th</option><option>7th</option><option>8th</option>
                                                <option>9th</option><option>10th</option><option>11th</option><option>12th</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
                                            <select
                                                className="input"
                                                value={aiParams.difficulty}
                                                onChange={e => setAiParams({ ...aiParams, difficulty: e.target.value })}
                                            >
                                                <option>Beginner</option>
                                                <option>Medium</option>
                                                <option>Advanced</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="pt-2">
                                        <button
                                            type="submit"
                                            disabled={generatingAI}
                                            className="btn w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none relative overflow-hidden group"
                                        >
                                            {generatingAI ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                                    Dreaming...
                                                </span>
                                            ) : 'Generate Template ✨'}
                                        </button>
                                    </div>
                                    <p className="text-xs text-center text-gray-500 mt-2">Powered by Gemini AI</p>
                                </form>
                            </div>
                        </div>
                    )}

                    <div className="flex p-1.5 rounded-2xl bg-white/40 dark:bg-black/20 backdrop-blur-md border border-white/20 dark:border-white/5 inline-flex shadow-sm mb-8 w-full md:w-auto overflow-x-auto scrollbar-hide">
                        {['projects', 'students', 'groups', 'reviews'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 relative whitespace-nowrap flex-1 md:flex-none text-center ${activeTab === tab
                                    ? 'bg-white dark:bg-emerald-600 text-emerald-600 dark:text-white shadow-lg shadow-emerald-900/5 transform scale-[1.02]'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-emerald-300 hover:bg-white/30 dark:hover:bg-white/5'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                {tab === 'reviews' && pendingReviewsCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-pulse box-content border-2 border-transparent">
                                        {pendingReviewsCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {activeTab === 'projects' && (
                    <>
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-emerald-500"></div>
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="text-center py-20 glass-panel border border-dashed border-gray-300/50 dark:border-white/10 rounded-3xl animate-fade-in">
                                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                </div>
                                <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white mb-2">No active projects</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                                    Launch a new learning campaign to get started. You can use AI to generate a plan instantly.
                                </p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="btn btn-primary px-8 py-3 shadow-xl"
                                >
                                    + Create Your First Project
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {projects.map((project, idx) => (
                                    <div
                                        key={project._id}
                                        style={{ animationDelay: `${idx * 100}ms` }}
                                        className="glass-card p-0 flex flex-col group h-full relative overflow-hidden animate-slide-up hover:scale-[1.02] transition-all duration-300 border-t border-white/50 dark:border-white/10"
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-white/0 dark:from-white/5 dark:to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>

                                        <div className="p-7 flex flex-col h-full relative z-10">
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 shadow-sm group-hover:scale-110 transition-transform duration-300">
                                                    <span className="font-display font-bold text-xl">{project.title.charAt(0)}</span>
                                                </div>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleDelete(project._id); }}
                                                    className="w-8 h-8 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-300 hover:text-red-500 transition-colors flex items-center justify-center"
                                                    title="Delete Project"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                </button>
                                            </div>

                                            <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-3 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors leading-tight">
                                                {project.title}
                                            </h3>

                                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-3 leading-relaxed flex-1">
                                                {project.description}
                                            </p>

                                            <div className="flex items-center justify-between text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-6 pt-6 border-t border-gray-100 dark:border-white/5">
                                                <span className="flex items-center gap-1.5">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                                    {project.students?.length || 0} Students
                                                </span>
                                                {project.deadline && (
                                                    <span className={`flex items-center gap-1.5 ${new Date(project.deadline) < new Date() ? 'text-red-400' : ''}`}>
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                        {formatDate(project.deadline)}
                                                    </span>
                                                )}
                                            </div>

                                            <button
                                                onClick={() => navigate(`/project/${project._id}`)}
                                                className="btn w-full bg-gray-50 dark:bg-white/5 hover:bg-emerald-500 hover:text-white text-gray-900 dark:text-white border-none transition-all duration-300 font-bold py-3 flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-emerald-500/20"
                                            >
                                                Enter War Room
                                                <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'students' && (
                    <div className="glass-panel overflow-hidden border border-white/20 dark:border-white/5 shadow-xl">
                        {loadingData ? (
                            <div className="p-12 text-center text-gray-500 flex flex-col items-center gap-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-2 border-emerald-500 border-t-transparent"></div>
                                Loading student records...
                            </div>
                        ) : (
                            <table className="min-w-full">
                                <thead className="bg-gray-50/50 dark:bg-white/5 border-b border-gray-100 dark:border-white/5 backdrop-blur-sm">
                                    <tr>
                                        <th className="px-8 py-5 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pl-10">Name</th>
                                        <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Email</th>
                                        <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Mastery Level</th>
                                        <th className="px-8 py-5 text-right text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest pr-10">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                                    {students.map((student, idx) => (
                                        <tr
                                            key={student._id}
                                            className="hover:bg-emerald-50/30 dark:hover:bg-emerald-900/10 transition-colors group"
                                            style={{ animationDelay: `${idx * 50}ms` }}
                                        >
                                            <td className="px-8 py-5 whitespace-nowrap pl-10">
                                                <div className="flex items-center">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900/30 dark:to-teal-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold border-2 border-white dark:border-white/10 shadow-sm mr-4">
                                                        {student.name.charAt(0)}
                                                    </div>
                                                    <div className="text-sm font-bold text-gray-900 dark:text-gray-100">{student.name}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-medium">{student.email}</td>
                                            <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {(() => {
                                                    const info = calculateLevelInfo(student.xp || 0);
                                                    return (
                                                        <div
                                                            className="group/tooltip relative cursor-help w-fit"
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
                                                            <div className="flex items-center gap-2 bg-white dark:bg-white/5 border border-emerald-100 dark:border-white/10 px-3 py-1.5 rounded-full shadow-sm hover:shadow-md hover:border-emerald-200 transition-all">
                                                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                                                                <span className="font-bold text-emerald-700 dark:text-emerald-400 text-xs uppercase tracking-wider">Lvl {info.currentLevel}</span>
                                                                <span className="text-xs text-gray-400 border-l border-gray-200 dark:border-white/10 pl-2 ml-1">{student.xp || 0} XP</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })()}
                                            </td>
                                            <td className="px-8 py-5 whitespace-nowrap text-right text-sm font-medium pr-10">
                                                <button
                                                    onClick={async () => {
                                                        setSelectedStudentRes(student);
                                                        setStudentPerformanceData([]); // Reset
                                                        setShowPerformanceModal(true);
                                                        try {
                                                            const res = await api.get(`/api/analytics/performance?studentId=${student._id}`);
                                                            setStudentPerformanceData(res.data.history);
                                                        } catch (e) { console.error(e); }
                                                    }}
                                                    className="btn btn-sm bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-emerald-300 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 shadow-sm"
                                                >
                                                    View Growth
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {/* Student Performance Modal */}
                {showPerformanceModal && selectedStudentRes && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                        <div className="glass-panel p-6 max-w-2xl w-full animate-scale-in border border-white/20 shadow-2xl">
                            <div className="flex justify-between items-center mb-6">
                                <div>
                                    <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white">{selectedStudentRes.name}'s Growth</h3>
                                    <p className="text-sm text-gray-500">XP Accumulation over time</p>
                                </div>
                                <button onClick={() => setShowPerformanceModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400">✕</button>
                            </div>
                            <div className="bg-white/50 dark:bg-black/20 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                                <PerformanceChart data={studentPerformanceData} />
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <ReviewsTab />
                )}

                {activeTab === 'groups' && (
                    <div className="animate-fade-in">
                        <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center glass-panel p-6 border border-white/20 dark:border-white/5 shadow-lg relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-blue-500/5 pointer-events-none"></div>
                            <div className="relative z-10 mb-4 sm:mb-0">
                                <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white">Groups</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Manage student teams and project assignments</p>
                            </div>
                            <div className="flex gap-3 relative z-10 w-full sm:w-auto">
                                <button
                                    onClick={() => setShowCreateGroupModal(true)}
                                    className="btn flex-1 sm:flex-none justify-center bg-white dark:bg-white/5 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-white/10 hover:border-emerald-500 hover:text-emerald-600 dark:hover:text-emerald-400 shadow-sm transition-all"
                                >
                                    + Create Manual
                                </button>
                                <button
                                    onClick={() => setShowGroupWizard(true)}
                                    className="btn btn-primary flex-1 sm:flex-none justify-center shadow-lg shadow-emerald-500/20"
                                >
                                    ✨ Auto-Generate
                                </button>
                            </div>
                        </div>

                        {loadingData ? (
                            <div className="flex justify-center items-center h-64">
                                <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-emerald-500"></div>
                            </div>
                        ) : groups.length === 0 ? (
                            <div className="text-center py-20 bg-white/30 dark:bg-white/5 rounded-3xl border border-dashed border-gray-300 dark:border-white/10 backdrop-blur-sm">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-lg font-medium">No groups created yet.</p>
                                <p className="text-gray-400 text-sm mt-1">Click Auto-Generate to intelligently balance teams.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {groups.map((group, idx) => (
                                    <div
                                        key={group._id}
                                        style={{ animationDelay: `${idx * 100}ms` }}
                                        className="glass-card flex flex-col animate-slide-up group hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                                    >
                                        <div className="p-6 pb-4 border-b border-gray-100 dark:border-white/5">
                                            <div className="flex justify-between items-start mb-2">
                                                <h4 className="font-display font-bold text-gray-900 dark:text-white text-xl group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{group.name}</h4>
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Avg Mastery</span>
                                                    <span className={`text-xs font-bold px-2 py-1 rounded-full border ${parseFloat(group.averageMastery) >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' :
                                                        parseFloat(group.averageMastery) >= 60 ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800' :
                                                            'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                                                        }`}>
                                                        {group.averageMastery}%
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="mt-2">
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="text-gray-400 font-medium">Project:</span>
                                                    <span className={`font-semibold ${group.project ? 'text-gray-800 dark:text-gray-200' : 'text-gray-400 italic'}`}>
                                                        {group.project ? group.project.title : 'Unassigned'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="p-6 flex-1 bg-gray-50/30 dark:bg-black/10">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                                                Members ({group.members.length})
                                            </p>
                                            <ul className="space-y-2">
                                                {group.members.map(member => (
                                                    <li key={member._id} className="text-sm flex justify-between items-center bg-white dark:bg-white/5 p-2 rounded-lg border border-gray-100 dark:border-white/5 shadow-sm">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                                                                {member.name.charAt(0)}
                                                            </div>
                                                            <span className="font-medium text-gray-700 dark:text-gray-300">{member.name}</span>
                                                        </div>
                                                        <span className="text-[10px] font-mono text-gray-400">{calculateAverage(member.mastery)}%</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>

                                        <div className="p-4 border-t border-gray-100 dark:border-white/5 grid grid-cols-2 gap-3 bg-white/40 dark:bg-white/5 backdrop-blur-sm">
                                            <button
                                                onClick={() => handleEditMembers(group)}
                                                className="btn btn-sm bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:border-emerald-300 text-gray-600 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 justify-center shadow-sm"
                                            >
                                                Edit Team
                                            </button>
                                            {group.project ? (
                                                <button
                                                    onClick={() => navigate(`/project/${group.project._id}`)}
                                                    className="btn btn-sm btn-primary justify-center shadow-emerald-500/20"
                                                >
                                                    View Board
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleAssignProject(group)}
                                                    className="btn btn-sm bg-white dark:bg-white/5 border border-dashed border-gray-300 dark:border-white/20 text-gray-500 hover:text-emerald-600 hover:border-emerald-300 justify-center"
                                                >
                                                    + Assign Project
                                                </button>
                                            )}
                                            {group.project && (
                                                <button
                                                    onClick={() => handleAssignProject(group)}
                                                    className="col-span-2 text-xs text-center text-gray-400 hover:text-emerald-500 mt-1 transition-colors"
                                                >
                                                    Change Project
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* Create Project Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="glass-panel p-8 max-w-lg w-full animate-scale-in shadow-2xl border border-white/20">
                        <h3 className="text-xl font-display font-bold mb-6 text-gray-900 dark:text-white">Create New Project</h3>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                                    Project Title *
                                </label>
                                <input
                                    id="title"
                                    name="title"
                                    type="text"
                                    required
                                    className="input"
                                    placeholder="Web Development Project"
                                    value={formData.title}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                                    Description *
                                </label>
                                <textarea
                                    id="description"
                                    name="description"
                                    rows="3"
                                    required
                                    className="input"
                                    placeholder="Build a full-stack web application..."
                                    value={formData.description}
                                    onChange={handleChange}
                                />
                            </div>

                            <div>
                                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-1">
                                    Deadline (Optional)
                                </label>
                                <input
                                    id="deadline"
                                    name="deadline"
                                    type="date"
                                    className="input"
                                    value={formData.deadline}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="flex space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowCreateModal(false);
                                        setFormData({ title: '', description: '', deadline: '' });
                                        setError('');
                                    }}
                                    className="btn btn-secondary flex-1"
                                    disabled={creating}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary flex-1"
                                    disabled={creating}
                                >
                                    {creating ? 'Creating...' : 'Create Project'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Members Modal */}
            {showEditMembersModal && selectedGroup && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="glass-panel p-6 max-w-2xl w-full animate-scale-in max-h-[90vh] overflow-y-auto border border-white/20 shadow-2xl">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white">Edit Group</h3>
                            <button onClick={() => setShowEditMembersModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
                        </div>

                        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Group Name</label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={editingGroupName}
                                    onChange={(e) => setEditingGroupName(e.target.value)}
                                    className="input flex-1"
                                    placeholder="Enter group name"
                                />
                                <button
                                    onClick={handleUpdateGroupName}
                                    className="btn btn-primary whitespace-nowrap"
                                >
                                    Save Name
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Current Members</h4>
                                <ul className="bg-gray-50 rounded-lg p-3 space-y-2">
                                    {selectedGroup.members.map(member => (
                                        <li key={member._id} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 shadow-sm">
                                            <div>
                                                <div className="text-sm font-medium">{member.name}</div>
                                                <div className="text-xs text-gray-500">{JSON.stringify(member.mastery || {})}</div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveMember(member._id)}
                                                className="text-red-600 hover:text-red-800 text-sm"
                                            >
                                                Remove
                                            </button>
                                        </li>
                                    ))}
                                    {selectedGroup.members.length === 0 && <p className="text-sm text-gray-500 italic">No members</p>}
                                </ul>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-700 mb-2">Available Students</h4>
                                <ul className="bg-gray-50 rounded-lg p-3 space-y-2 max-h-64 overflow-y-auto">
                                    {getUnassignedStudents().map(student => (
                                        <li key={student._id} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 shadow-sm">
                                            <div>
                                                <div className="text-sm font-medium">{student.name}</div>
                                                <div className="text-xs text-gray-500">{JSON.stringify(student.mastery || {})}</div>
                                            </div>
                                            <button
                                                onClick={() => handleAddMember(student._id)}
                                                className="text-green-600 hover:text-green-800 text-sm font-medium"
                                            >
                                                Add
                                            </button>
                                        </li>
                                    ))}
                                    {getUnassignedStudents().length === 0 && <p className="text-sm text-gray-500 italic">No unassigned students</p>}
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Assign Project Modal */}
            {showAssignProjectModal && selectedGroup && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="glass-panel p-6 max-w-md w-full animate-scale-in border border-white/20 shadow-2xl">
                        <h3 className="text-xl font-display font-bold mb-4 text-gray-900 dark:text-white">Assign Project to {selectedGroup.name}</h3>
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
                            {/* Option 1: Existing Projects */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide">Existing Projects</h4>
                                <div className="space-y-2">
                                    <button
                                        onClick={() => handleProjectAssignment(null)}
                                        className={`w-full text-left p-3 rounded-lg border transition-colors ${!selectedGroup.project ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-200 hover:bg-gray-50'}`}
                                    >
                                        <span className="font-medium">No Project (Unassign)</span>
                                    </button>
                                    {projects.map(project => (
                                        <button
                                            key={project._id}
                                            onClick={() => handleProjectAssignment(project._id)}
                                            className={`w-full text-left p-3 rounded-lg border transition-colors ${selectedGroup.project && selectedGroup.project._id === project._id ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            <div className="font-medium">{project.title}</div>
                                            <div className="text-xs text-gray-500 truncate">{project.description}</div>
                                        </button>
                                    ))}
                                    {projects.length === 0 && <p className="text-sm text-gray-400 italic px-2">No projects created yet.</p>}
                                </div>
                            </div>

                            {/* Option 2: Templates */}
                            <div>
                                <h4 className="text-sm font-semibold text-gray-500 mb-2 uppercase tracking-wide flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                                    Use Template
                                </h4>
                                <div className="space-y-2">
                                    {PROJECT_TEMPLATES.map(template => (
                                        <button
                                            key={template.id}
                                            onClick={() => handleTemplateAssignment(template.id)}
                                            className="w-full text-left p-3 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 transition-colors group"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div className="font-medium text-purple-900 group-hover:text-purple-700">{template.title}</div>
                                                <span className="text-xs font-semibold bg-purple-200 text-purple-800 px-2 py-0.5 rounded-full">{template.difficulty}</span>
                                            </div>
                                            <div className="text-xs text-purple-700 mt-1">{template.description}</div>
                                            <div className="mt-2 flex gap-1 flex-wrap">
                                                {template.stack.map(tech => (
                                                    <span key={tech} className="text-[10px] bg-white border border-purple-100 text-purple-600 px-1.5 py-0.5 rounded">{tech}</span>
                                                ))}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button onClick={() => setShowAssignProjectModal(false)} className="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

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

            {showGroupWizard && (
                <GroupFormationWizard
                    students={students}
                    onClose={() => setShowGroupWizard(false)}
                    onSave={handleSaveGroups}
                />
            )}

            {/* Manual Create Group Modal */}
            {showCreateGroupModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="glass-panel p-6 max-w-lg w-full animate-scale-in border border-white/20 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-display font-bold text-gray-900 dark:text-white">Create New Group</h3>
                            <button onClick={() => setShowCreateGroupModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">✕</button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                                <input
                                    type="text"
                                    className="input"
                                    placeholder="e.g. The Avengers"
                                    value={newGroupData.name}
                                    onChange={(e) => setNewGroupData({ ...newGroupData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Select Members</label>
                                <div className="border rounded-lg max-h-60 overflow-y-auto divide-y">
                                    {getUnassignedStudents().length === 0 ? (
                                        <div className="p-4 text-center text-gray-500">No unassigned students available.</div>
                                    ) : (
                                        getUnassignedStudents().map(student => (
                                            <label key={student._id} className="flex items-center p-3 hover:bg-gray-50 cursor-pointer user-select-none transition-colors">
                                                <input
                                                    type="checkbox"
                                                    className="rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 mr-3 h-5 w-5"
                                                    checked={newGroupData.members.includes(student._id)}
                                                    onChange={() => toggleNewGroupMember(student._id)}
                                                />
                                                <div className="flex-1">
                                                    <div className="font-medium text-gray-900">{student.name}</div>
                                                    <div className="text-xs text-gray-500">{student.email}</div>
                                                </div>
                                                <div className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                    Score: {calculateAverage(student.mastery)}
                                                </div>
                                            </label>
                                        ))
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-2 text-right">
                                    Selected: {newGroupData.members.length}
                                </p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <button
                                    onClick={() => setShowCreateGroupModal(false)}
                                    className="btn btn-secondary flex-1"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateManualGroup}
                                    className="btn btn-primary flex-1"
                                    disabled={loadingData}
                                >
                                    {loadingData ? 'Creating...' : 'Create Group'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default TeacherDashboard;
