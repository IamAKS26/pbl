import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useProject } from '../../context/ProjectContext';
import { formatDate } from '../../utils/dateHelpers';

const TeacherDashboard = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const { projects, fetchProjects, createProject, deleteProject, loading } = useProject();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        deadline: '',
    });
    const [creating, setCreating] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

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
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-3xl font-bold text-gray-900">My Projects</h2>
                            <p className="mt-1 text-sm text-gray-600">
                                Manage your project-based learning activities
                            </p>
                        </div>
                        <button
                            onClick={() => setShowCreateModal(true)}
                            className="btn btn-primary"
                        >
                            + Create Project
                        </button>
                    </div>
                </div>

                {/* Projects Grid */}
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
        </div>
    );
};

export default TeacherDashboard;
