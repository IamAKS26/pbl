import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { formatDate } from '../../utils/dateHelpers';
import api from '../../utils/api';

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { projects, fetchProjects, createProject, deleteProject, loading } = useProject();

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
    const [showEditMembersModal, setShowEditMembersModal] = useState(false);
    const [showAssignProjectModal, setShowAssignProjectModal] = useState(false);

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

    const handleAutoGenerateGroups = async () => {
        if (students.length === 0) {
            alert('No students to group!');
            return;
        }

        if (!window.confirm('This will create new groups based on current students. Proceed?')) return;

        try {
            setLoadingData(true);

            // 1. Calculate scores and sort students
            const studentsWithScores = students.map(s => ({
                ...s,
                avgScore: parseFloat(calculateAverage(s.mastery))
            })).sort((a, b) => b.avgScore - a.avgScore);

            // 2. Form balanced groups (Snake draft or High-Low matching)
            const newGroups = [];
            const tempStudents = [...studentsWithScores];
            let groupIndex = 1;

            while (tempStudents.length > 0) {
                const groupMembers = [];
                // Take 1 High
                if (tempStudents.length > 0) groupMembers.push(tempStudents.shift());
                // Take 1 Low
                if (tempStudents.length > 0) groupMembers.push(tempStudents.pop());
                // Take 1 High
                if (tempStudents.length > 0) groupMembers.push(tempStudents.shift());
                // Take 1 Low
                if (tempStudents.length > 0) groupMembers.push(tempStudents.pop());

                // Calculate group stats
                const groupAvg = (groupMembers.reduce((acc, curr) => acc + curr.avgScore, 0) / groupMembers.length).toFixed(1);

                newGroups.push({
                    name: `Group ${groupIndex++}`,
                    members: groupMembers.map(m => m._id),
                    averageMastery: groupAvg
                });
            }

            // 3. Save groups
            for (const group of newGroups) {
                await api.post('/api/groups', group);
            }

            // 4. Refresh
            await fetchGroupsAndStudents();
            alert(`Created ${newGroups.length} balanced groups!`);

        } catch (err) {
            console.error('Error generating groups:', err);
            alert('Failed to generate groups');
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

    const handleEditMembers = (group) => {
        setSelectedGroup(group);
        setShowEditMembersModal(true);
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
        } catch (err) {
            console.error(err);
            alert('Failed to assign project');
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
                        {['projects', 'students', 'groups'].map((tab) => (
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

                {activeTab === 'groups' && (
                    <div>
                        <div className="mb-4 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">Groups</h3>
                            <button
                                onClick={handleAutoGenerateGroups}
                                className="btn btn-primary"
                            >
                                Auto-Generate Groups
                            </button>
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
                                        <div className="mt-4 flex space-x-2">
                                            <button
                                                onClick={() => handleEditMembers(group)}
                                                className="text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                Edit Members
                                            </button>
                                            <button
                                                onClick={() => handleAssignProject(group)}
                                                className="text-xs text-blue-600 hover:text-blue-800"
                                            >
                                                Assign Project
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
                            <h3 className="text-lg font-semibold">Edit Members: {selectedGroup.name}</h3>
                            <button onClick={() => setShowEditMembersModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
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
                        <div className="space-y-2 max-h-80 overflow-y-auto">
                            <button
                                onClick={() => handleProjectAssignment(null)}
                                className={`w-full text-left p-3 rounded-lg border transition-colors ${!selectedGroup.project ? 'bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500' : 'border-gray-200 hover:bg-gray-50'}`}
                            >
                                <span className="font-medium">No Project</span>
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
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button onClick={() => setShowAssignProjectModal(false)} className="btn btn-secondary">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default TeacherDashboard;
