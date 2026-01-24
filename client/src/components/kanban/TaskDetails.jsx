import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import CodeEditor from '../common/CodeEditor';
import api from '../../utils/api';
import { formatDateTime } from '../../utils/dateHelpers';

const TaskDetails = ({ task, onClose, onUpdate }) => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [activeTab, setActiveTab] = useState('code');
    const [link, setLink] = useState('');
    const [code, setCode] = useState(task.codeSubmission?.code || '// Write your code here');
    const [loading, setLoading] = useState(false);

    /* ---------------- Evidence ---------------- */

    const handleSubmitEvidence = async (e) => {
        e.preventDefault();
        if (!link) return;
        setLoading(true);
        try {
            await api.post(`/api/tasks/${task._id}/evidence`, {
                url: link,
                resourceType: 'link'
            });
            setLink('');
            onUpdate();
        } catch (error) {
            console.error(error);
            alert('Failed to submit evidence');
        } finally {
            setLoading(false);
        }
    };

    /* ---------------- GitHub Repo ---------------- */

    const handleLinkRepo = async (e) => {
        e.preventDefault();
        if (!link) return;
        setLoading(true);
        try {
            await api.post(`/api/tasks/${task._id}/github-repo`, {
                repoUrl: link
            });
            setLink('');
            onUpdate();
        } catch (error) {
            console.error(error);
            alert('Failed to link repo');
        } finally {
            setLoading(false);
        }
    };

    /* ---------------- Code Submission ---------------- */

    const handleSubmitCode = async () => {
        if (!code) return;
        setLoading(true);
        try {
            await api.put(`/api/tasks/${task._id}`, {
                codeSubmission: {
                    code,
                    language: 'javascript',
                    submittedAt: new Date()
                },
                status: 'Ready for Review' // Explicitly move to Review column
            });
            alert('Code submitted successfully!');
            onUpdate();
        } catch (error) {
            console.error(error);
            alert('Failed to submit code');
        } finally {
            setLoading(false);
        }
    };

    /* ---------------- Delete Task ---------------- */

    const handleDeleteTask = async () => {
        if (!window.confirm('Are you sure you want to delete this task?')) return;
        setLoading(true);
        try {
            await api.delete(`/api/tasks/${task._id}`);
            alert('Task deleted');
            onClose();
            onUpdate();
        } catch (error) {
            console.error(error);
            alert('Failed to delete task');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 animate-fade-in">
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden shadow-2xl animate-scale-in flex flex-col border border-white/20">

                {/* Header */}
                <div className="shrink-0 bg-white/50 border-b border-gray-100 px-8 py-5 flex items-center justify-between backdrop-blur-md sticky top-0 z-10">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${task.priority === 'High' ? 'bg-red-50 text-red-600 border-red-100' :
                                task.priority === 'Medium' ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                    'bg-blue-50 text-blue-600 border-blue-100'
                                }`}>
                                {task.priority} Priority
                            </span>
                            <span className="text-gray-400 text-xs font-mono">ID: {task._id.slice(-6)}</span>
                        </div>
                        <h2 className="text-2xl font-display font-bold text-gray-900">{task.title}</h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-8 flex-1 overflow-y-auto custom-scrollbar">

                    {/* Task Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="md:col-span-2 space-y-4">
                            <div>
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Description</h3>
                                <div className="prose prose-sm prose-emerald text-gray-600 bg-gray-50/50 p-4 rounded-xl border border-gray-100">
                                    <p>{task.description || 'No description provided.'}</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="glass-panel p-4 bg-gray-50/50">
                                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Details</h3>
                                <div className="space-y-3 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Status</span>
                                        <span className="font-medium text-gray-900">{task.status}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Assigned To</span>
                                        <span className="font-medium text-gray-900 truncate max-w-[120px]">{task.assignee?.name || 'Unassigned'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Last Updated</span>
                                        <span className="font-medium text-gray-900">{formatDateTime(task.lastUpdated)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Teacher Feedback */}
                    {task.feedback && (
                        <div className="mb-8 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl p-6 shadow-sm">
                            <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                                <span className="p-1 bg-emerald-100 rounded text-emerald-600">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                                </span>
                                Teacher Feedback
                            </h3>
                            <div className="text-emerald-900/80 text-sm leading-relaxed mb-3">
                                {task.feedback}
                            </div>
                            <div className="text-xs text-emerald-600 font-medium flex items-center gap-2">
                                <span>— {task.feedbackBy?.name || 'Teacher'}</span>
                                <span className="text-emerald-300">•</span>
                                <span>{formatDateTime(task.feedbackAt)}</span>
                            </div>
                        </div>
                    )}

                    {/* Tabs Navigation */}
                    <div className="mb-6">
                        <div className="flex p-1 bg-gray-100/80 rounded-xl inline-flex">
                            <button
                                onClick={() => setActiveTab('code')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'code'
                                    ? 'bg-white text-emerald-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Code Editor
                            </button>
                            <button
                                onClick={() => setActiveTab('evidence')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'evidence'
                                    ? 'bg-white text-emerald-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Evidence <span className="ml-1 opacity-60 text-xs">({task.evidenceLinks?.length || 0})</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('commits')}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${activeTab === 'commits'
                                    ? 'bg-white text-emerald-700 shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Commits <span className="ml-1 opacity-60 text-xs">({task.githubCommits?.length || 0})</span>
                            </button>
                        </div>
                    </div>

                    {/* ---------------- TAB CONTENT ---------------- */}

                    {/* Code Tab */}
                    {activeTab === 'code' && (
                        <div className="animate-fade-in space-y-4">
                            <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                <CodeEditor
                                    initialCode={code}
                                    onChange={setCode}
                                    height="400px"
                                    readOnly={user.role === 'Teacher'}
                                    allowRun={user.role === 'Teacher'}
                                />
                            </div>
                            {user.role === 'Student' && (
                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={handleSubmitCode}
                                        className="btn btn-primary"
                                        disabled={loading}
                                    >
                                        {loading ? 'Submitting...' : 'Submit Solution'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Evidence Tab */}
                    {activeTab === 'evidence' && (
                        <div className="animate-fade-in max-w-2xl">
                            {/* Submitted Evidence List */}
                            {task.evidenceLinks?.length > 0 && (
                                <div className="mb-8 space-y-3">
                                    <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-3">Attachment History</h4>
                                    {task.evidenceLinks.map((link, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-white p-4 rounded-xl border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all group">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-500 flex items-center justify-center shrink-0">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                                </div>
                                                <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-gray-700 font-medium hover:text-emerald-600 truncate transition-colors">
                                                    {link.url}
                                                </a>
                                            </div>
                                            <span className="text-xs text-gray-400 whitespace-nowrap ml-4">
                                                {formatDateTime(link.submittedAt)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <h4 className="text-sm font-bold text-gray-900 mb-2">Add New Evidence</h4>
                                <p className="text-sm text-gray-500 mb-4">Paste a link to your Google Doc, Drive folder, or design file.</p>
                                <form onSubmit={handleSubmitEvidence} className="flex gap-3">
                                    <input
                                        type="url"
                                        placeholder="https://..."
                                        className="input bg-white"
                                        value={link}
                                        onChange={(e) => setLink(e.target.value)}
                                        required
                                    />
                                    <button type="submit" className="btn btn-secondary whitespace-nowrap" disabled={loading}>
                                        {loading ? 'Adding...' : 'Add Link'}
                                    </button>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Commits Tab */}
                    {activeTab === 'commits' && (
                        <div className="animate-fade-in max-w-2xl">
                            {task.githubRepo ? (
                                <div className="space-y-6">
                                    <div className="bg-gray-900 text-white p-5 rounded-xl shadow-lg flex justify-between items-center group relative overflow-hidden">
                                        <div className="relative z-10 flex items-center gap-3">
                                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                            <div>
                                                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold mb-0.5">Linked Repository</p>
                                                <p className="font-mono text-lg font-bold">{task.githubRepo}</p>
                                            </div>
                                        </div>
                                        <a href={task.githubRepo} target="_blank" rel="noopener noreferrer" className="relative z-10 btn btn-sm bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-md">
                                            View on GitHub ↗
                                        </a>
                                        {/* Bg decoration */}
                                        <div className="absolute right-0 top-0 w-32 h-32 bg-white/5 rounded-full blur-2xl translate-x-1/3 -translate-y-1/3"></div>
                                    </div>

                                    {/* Commits List */}
                                    <div>
                                        <h4 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">Commit History</h4>
                                        {task.githubCommits?.length > 0 ? (
                                            <div className="relative border-l-2 border-gray-200 ml-3 space-y-6 pb-2">
                                                {task.githubCommits.map((commit, idx) => (
                                                    <div key={idx} className="relative pl-6">
                                                        <span className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-white border-4 border-gray-300"></span>
                                                        <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:shadow hover:border-emerald-100 transition-all">
                                                            <p className="text-gray-900 font-medium mb-1">{commit.message}</p>
                                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                                                                <span className="font-mono bg-gray-100 px-1.5 rounded text-gray-600 border border-gray-200">{commit.hash?.substring(0, 7)}</span>
                                                                <span className="flex items-center gap-1">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                                    {commit.author}
                                                                </span>
                                                                <span>{formatDateTime(commit.date)}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                                <p className="text-gray-500 italic">No commits synced yet.</p>
                                                <button className="text-emerald-600 text-sm font-medium hover:underline mt-2">Force Sync</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 rounded-xl p-8 border border-gray-200 text-center">
                                    <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-4 text-gray-800">
                                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">Connect GitHub Repository</h3>
                                    <p className="text-gray-500 mb-6 max-w-md mx-auto">Link a public GitHub repository to track commits and activity directly on this card.</p>
                                    <form onSubmit={handleLinkRepo} className="flex gap-2 max-w-md mx-auto">
                                        <input
                                            type="url"
                                            placeholder="https://github.com/username/repo"
                                            className="input bg-white"
                                            value={link}
                                            onChange={(e) => setLink(e.target.value)}
                                            required
                                        />
                                        <button type="submit" className="btn btn-primary" disabled={loading}>
                                            Link
                                        </button>
                                    </form>
                                </div>
                            )}
                        </div>
                    )}

                </div>

                {/* Footer */}
                <div className="shrink-0 bg-gray-50/80 backdrop-blur-sm px-8 py-4 border-t border-gray-200 flex justify-between items-center sm:rounded-b-2xl">
                    <span className="text-xs text-gray-400">Press ESC to close</span>
                    <div className="flex gap-3">
                        {/* Delete button removed as per request */}
                        <button onClick={onClose} className="btn btn-secondary py-2">
                            Close
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default TaskDetails;
