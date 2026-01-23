import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { formatDate } from '../../utils/dateHelpers';
import api from '../../utils/api';
import ReviewsTab from './ReviewsTab';
import GroupFormationWizard from './GroupFormationWizard';
import { PROJECT_TEMPLATES } from '../../constants/templates';

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { projects, fetchProjects, createProject, deleteProject, loading, assignTemplate } = useProject();

    // UI State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');
    const [activeTab, setActiveTab] = useState('projects');
    const [loadingData, setLoadingData] = useState(false);

    // Data State
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        deadline: '',
    });
    const [students, setStudents] = useState([]);
    const [groups, setGroups] = useState([]);

    // Group Management State
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [editingGroupName, setEditingGroupName] = useState('');
    const [showEditMembersModal, setShowEditMembersModal] = useState(false);
    const [showAssignProjectModal, setShowAssignProjectModal] = useState(false);
    const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
    const [showGroupWizard, setShowGroupWizard] = useState(false);
    const [newGroupData, setNewGroupData] = useState({ name: '', members: [] });

    useEffect(() => {
        if (activeTab === 'projects') {
            fetchProjects();
        } else if (activeTab === 'students') {
            fetchStudents();
        } else if (activeTab === 'groups') {
            fetchGroupsAndStudents();
        }
    }, [activeTab]);

    const fetchStudents = async () => {
        try {
            setLoadingData(true);
            const res = await api.get('/api/students');
            setStudents(res.data.students);
        } catch (err) {
            console.error(err);
        } finally {
            setLoadingData(false);
        }
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

    const calculateAverage = (mastery) => {
        if (!mastery || Object.keys(mastery).length === 0) return 0;
        const scores = Object.values(mastery);
        const sum = scores.reduce((a, b) => a + b, 0);
        return (sum / scores.length).toFixed(1);
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
            alert(`Created ${newGroups.length} balanced groups!`);

        } catch (err) {
            console.error('Error saving groups:', err);
            alert('Failed to save groups');
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
            alert('Failed to update group members');
        }
    };

    const handleCreateManualGroup = async () => {
        if (!newGroupData.name.trim()) {
            alert('Please enter a group name');
            return;
        }
        if (newGroupData.members.length === 0) {
            alert('Please select at least one member');
            return;
        }

        try {
            setLoadingData(true);
            await api.post('/api/groups', newGroupData);
            await fetchGroupsAndStudents();
            setShowCreateGroupModal(false);
            setNewGroupData({ name: '', members: [] });
            alert('Group created successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to create group');
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
            alert('Group name updated!');
        } catch (err) {
            console.error(err);
            alert('Failed to update group name');
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
            alert('Project assigned successfully!');
        } catch (err) {
            console.error(err);
            alert('Failed to assign project');
        }
    };

    const handleTemplateAssignment = async (templateId) => {
        if (!selectedGroup) return;
        if (!window.confirm(`Assign "${PROJECT_TEMPLATES.find(t => t.id === templateId)?.title}" to ${selectedGroup.name}? This will create a new project instance.`)) return;

        const result = await assignTemplate(selectedGroup._id, templateId);
        if (result.success) {
            fetchGroupsAndStudents();
            setShowAssignProjectModal(false);
            alert('Template assigned successfully!');
        } else {
            alert(result.message);
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
                            <span className="badge bg-emerald-100 text-emerald-700">Teacher</span>
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
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">
                                {activeTab === 'projects' ? 'My Projects' :
                                    activeTab === 'students' ? 'Student Performance' : 'Group Management'}
                            </h2>
                            <p className="mt-1 text-sm text-gray-600">
                                {activeTab === 'projects' ? 'Manage your project-based learning activities' :
                                    activeTab === 'students' ? 'View student mastery scores and progress' :
                                        activeTab === 'reviews' ? 'Review and grade student submissions' :
                                            'Create and manage student groups'}
                            </p>
                        </div>
                        {activeTab === 'projects' && (
                            <button
                                onClick={() => setShowCreateModal(true)}
                                className="btn btn-primary"
                            >
                                + Create Project
                            </button>
                        )}
                    </div>

                    <div className="flex space-x-1 bg-gray-200 p-1 rounded-lg inline-flex">
                        {['projects', 'students', 'groups', 'reviews'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab
                                    ? 'bg-white text-emerald-700 shadow'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                                    }`}
                            >
                                {tab.charAt(0).toUpperCase() + tab.slice(1)}
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
                                        className="card hover:shadow-lg transition-all duration-300 animate-fade-in group"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <h3 className="text-lg font-semibold text-gray-900 flex-1">
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

                                        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                                            {project.description}
                                        </p>

                                        <div className="flex items-center justify-between text-sm mb-4">
                                            <span className="text-gray-500">
                                                {project.students?.length || 0} students
                                            </span>
                                            {project.deadline && (
                                                <span className="text-gray-500">
                                                    Due: {formatDate(project.deadline)}
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
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        {loadingData ? (
                            <div className="p-8 text-center text-gray-500">Loading students...</div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mastery Score</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {students.map((student) => (
                                        <tr key={student._id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.email}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {student.mastery ? JSON.stringify(student.mastery) : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <ReviewsTab />
                )}

                {activeTab === 'groups' && (
                    <div>
                        <div className="mb-4 flex justify-between items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
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
                                    <div key={group._id} className="bg-white p-4 rounded-lg shadow border border-gray-200">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-semibold text-gray-900">{group.name}</h4>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full animate-scale-in">
                        <h3 className="text-lg font-semibold mb-4">Create New Project</h3>

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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl p-6 max-w-2xl w-full animate-scale-in max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Edit Group</h3>
                            <button onClick={() => setShowEditMembersModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl p-6 max-w-md w-full animate-scale-in">
                        <h3 className="text-lg font-semibold mb-4">Assign Project to {selectedGroup.name}</h3>
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
                    <div className="bg-white rounded-xl p-6 max-w-lg w-full animate-scale-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">Create New Group</h3>
                            <button onClick={() => setShowCreateGroupModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
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
