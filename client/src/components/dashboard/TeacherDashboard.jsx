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
            fetchGroupsAndStudents();
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
            fetchGroupsAndStudents();
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
                // alert('Project details generated! Review and click Create.');
            }

        } catch (err) {
            console.error(err);
            addToast('Failed to generate template through AI', 'error');
        } finally {
            setGeneratingAI(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            {/* Navbar */}
            <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-white/10 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white font-bold shadow-lg shadow-emerald-500/30">P</div>
                            <h1 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight">PBL <span className="text-emerald-600 dark:text-emerald-400">Teacher</span></h1>
                        </div>
                        <div className="flex items-center space-x-6">
                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
                                title="Toggle Theme"
                            >
                                {theme === 'dark' ? '🌞' : '🌙'}
                            </button>

                            {/* Notification Bell */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 relative transition-colors"
                                >
                                    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    {unreadCount > 0 && (
                                        <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-gray-900 animate-pulse" />
                                    )}
                                </button>

                                {/* Dropdown */}
                                {showNotifications && (
                                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-glass py-1 z-50 ring-1 ring-black ring-opacity-5 max-h-96 overflow-y-auto border border-gray-100 dark:border-white/10">
                                        <div className="px-4 py-3 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-gray-50/50 dark:bg-gray-800/50">
                                            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Notifications</h3>
                                            <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">{unreadCount} unread</span>
                                        </div>
                                        {notifications.length > 0 ? (
                                            notifications.map(notification => (
                                                <div
                                                    key={notification._id}
                                                    className={`px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-white/5 last:border-0 cursor-pointer ${!notification.isRead ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}
                                                    onClick={() => !notification.isRead && markAsRead(notification._id)}
                                                >
                                                    <p className="text-sm text-gray-800 dark:text-gray-200">{notification.message}</p>
                                                    <p className="text-xs text-gray-400 mt-1">{formatDate(notification.createdAt)}</p>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400 text-sm">
                                                No notifications yet
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="hidden md:flex items-center gap-3 pl-4 border-l border-gray-200 dark:border-white/10">
                                <div className="text-right">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{user?.name}</div>
                                    <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Teacher Access</div>
                                </div>
                                <div className="w-9 h-9 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-bold border-2 border-white dark:border-white/10 shadow-sm">
                                    {user?.name?.charAt(0) || 'T'}
                                </div>
                            </div>

                            <button
                                onClick={logout}
                                className="text-sm text-gray-500 hover:text-red-500 transition-colors font-medium ml-2"
                            >
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-10">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-8">
                        <div>
                            <h2 className="text-4xl font-display font-bold text-gray-900 dark:text-white tracking-tight mb-2">
                                {activeTab === 'projects' ? 'Project Command Center' :
                                    activeTab === 'students' ? 'Student Performance' :
                                        activeTab === 'groups' ? 'Team Management' : 'Review Queue'}
                            </h2>
                            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl">
                                {activeTab === 'projects' ? 'Oversee and manage active learning campaigns.' :
                                    activeTab === 'students' ? 'Track mastery levels and individual progress.' :
                                        activeTab === 'reviews' ? 'Grade submissions and provide feedback.' :
                                            'Organize students into balanced, effective teams.'}
                            </p>
                        </div>
                        {activeTab === 'projects' && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowAIModal(true)}
                                    className="btn bg-purple-600 hover:bg-purple-700 text-white border-none shadow-md flex items-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                    Generate with AI
                                </button>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="btn btn-primary"
                                >
                                    + Create Project
                                </button>
                            </div>
                        )}
                    </div>

                    {/* AI Modal */}
                    {showAIModal && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
                            <div className="glass-panel p-6 max-w-md w-full animate-scale-in border border-white/20 shadow-2xl">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">
                                        ✨ Generate Project with AI
                                    </h3>
                                    <button onClick={() => setShowAIModal(false)} className="text-gray-400 hover:text-gray-700">✕</button>
                                </div>

                                <form onSubmit={handleGenerateAI} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Topic / Subject</label>
                                        <input
                                            type="text"
                                            required
                                            className="input"
                                            placeholder="e.g. Sustainable Energy, Ancient Rome..."
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

                    <div className="flex space-x-1 bg-white/50 dark:bg-white/5 p-1.5 rounded-xl border border-white/20 backdrop-blur-sm inline-flex shadow-sm">
                        {['projects', 'students', 'groups', 'reviews'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 relative ${activeTab === tab
                                    ? 'bg-white dark:bg-emerald-600 text-emerald-600 dark:text-white shadow-md transform scale-105'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/50 dark:hover:bg-white/5'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                {tab === 'reviews' && pendingReviewsCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm animate-pulse">
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
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
                            </div>
                        ) : projects.length === 0 ? (
                            <div className="text-center py-12 card">
                                <svg
                                    className="mx-auto h-12 w-12 text-gray-400"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                                    />
                                </svg>
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No projects</h3>
                                <p className="mt-1 text-sm text-gray-500">
                                    Get started by creating a new project.
                                </p>
                                <div className="mt-6">
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="btn btn-primary"
                                    >
                                        + Create Your First Project
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {projects.map((project) => (
                                    <div
                                        key={project._id}
                                        className="glass-card p-6 flex flex-col group h-full"
                                    >
                                        <div className="flex items-start justify-between mb-4">
                                            <h3 className="text-xl font-display font-bold text-gray-800 dark:text-white flex-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                                                {project.title}
                                            </h3>
                                            <button
                                                onClick={() => handleDelete(project._id)}
                                                className="text-gray-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                            >
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                            </button>
                                        </div>

                                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 line-clamp-3 leading-relaxed flex-1">
                                            {project.description}
                                        </p>

                                        <div className="flex items-center justify-between text-sm mb-4">
                                            <span className="text-gray-500">
                                                {project.students?.length || 0} students
                                            </span>
                                            {project.deadline && (
                                                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                                    {formatDate(project.deadline)}
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            onClick={() => navigate(`/project/${project._id}`)}
                                            className="btn btn-primary w-full"
                                        >
                                            Open Board →
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {activeTab === 'students' && (
                    <div className="glass-panel overflow-hidden">
                        {loadingData ? (
                            <div className="p-8 text-center text-gray-500">Loading students...</div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
                                <thead className="bg-gray-50/50 dark:bg-gray-800/50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Mastery Score</th>
                                        <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-transparent divide-y divide-gray-200 dark:divide-white/5">
                                    {students.map((student) => (
                                        <tr key={student._id} className="hover:bg-white/50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{student.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{student.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {student.mastery ? JSON.stringify(student.mastery) : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
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
                                                    className="text-emerald-600 hover:text-emerald-900 dark:text-emerald-400 dark:hover:text-emerald-300"
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
                    <div>
                        <div className="mb-4 flex justify-between items-center glass-panel p-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Groups</h3>
                                <p className="text-sm text-gray-500">Manage student teams and assignments</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setShowCreateGroupModal(true)}
                                    className="btn bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 shadow-sm"
                                >
                                    + Create Manual
                                </button>
                                <button
                                    onClick={() => setShowGroupWizard(true)}
                                    className="btn btn-primary shadow-sm"
                                >
                                    Auto-Generate
                                </button>
                            </div>
                        </div>
                        {loadingData ? (
                            <div className="p-8 text-center text-gray-500">Loading groups...</div>
                        ) : groups.length === 0 ? (
                            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                                <p className="text-gray-500">No groups created yet. Click Auto-Generate to start.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {groups.map(group => (
                                    <div key={group._id} className="glass-card p-5 border border-white/40 dark:border-white/5">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-bold text-gray-900 dark:text-white text-lg">{group.name}</h4>
                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Avg Mastery: {group.averageMastery}</span>
                                        </div>
                                        <div className="mb-3">
                                            <p className="text-sm text-gray-500 mb-1">Project:</p>
                                            <div className="text-sm font-medium">
                                                {group.project ? group.project.title : 'Unassigned'}
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-500 mb-2">Members:</p>
                                            <ul className="space-y-1">
                                                {group.members.map(member => (
                                                    <li key={member._id} className="text-sm flex justify-between">
                                                        <span>{member.name}</span>
                                                        <span className="text-gray-400 text-xs">{JSON.stringify(member.mastery || {})}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                                            <button
                                                onClick={() => handleEditMembers(group)}
                                                className="animate-color-pulse flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:text-emerald-700 hover:shadow-md border border-gray-200 hover:border-emerald-200 rounded-lg transition-all duration-200 group-hover:scale-100"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                Edit Members
                                            </button>
                                            <button
                                                onClick={() => handleAssignProject(group)}
                                                className={`animate-color-pulse flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md border ${group.project
                                                    ? 'text-emerald-700 border-emerald-200'
                                                    : 'text-blue-700 hover:text-blue-800 border-blue-200'
                                                    }`}
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                {group.project ? 'Change Project' : 'Assign Project'}
                                            </button>
                                            {group.project && (
                                                <button
                                                    onClick={() => navigate(`/project/${group.project._id}`)}
                                                    className="col-span-2 animate-color-pulse flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 hover:shadow-md text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                                    Open Board
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
