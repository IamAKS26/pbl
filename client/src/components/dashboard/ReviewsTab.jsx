import { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useToast } from '../../context/ToastContext';
import CodeEditor from '../common/CodeEditor';

const ReviewsTab = () => {
    const { addToast } = useToast();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchReviewTasks();
    }, []);

    const fetchReviewTasks = async () => {
        try {
            setLoading(true);
            const res = await api.get('/api/tasks');
            // Filter locally for now, ideally backend filters
            const reviewTasks = res.data.tasks.filter(t => t.status === 'Review' || t.status === 'In Review' || t.status === 'Ready for Review');
            setTasks(reviewTasks);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (taskId, action) => {
        try {
            let newStatus = action === 'approve' ? 'Done' : 'Needs Revision'; // or 'To Do'
            await api.put(`/api/tasks/${taskId}`, { status: newStatus });

            // Optimistic update
            setTasks(tasks.filter(t => t._id !== taskId));

            addToast(action === 'approve' ? 'Task Approved!' : 'Revision Requested', action === 'approve' ? 'success' : 'info');
        } catch (err) {
            console.error(err);
            addToast('Action failed', 'error');
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-emerald-500"></div>
        </div>
    );

    if (tasks.length === 0) {
        return (
            <div className="text-center py-20 px-8 glass-panel border border-dashed border-gray-300 dark:border-white/10 rounded-3xl animate-fade-in relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-emerald-500/5 to-blue-500/5 pointer-events-none"></div>
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-500 shadow-lg shadow-emerald-500/20">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-2xl font-display font-bold text-gray-900 dark:text-white mb-2">You're all caught up!</h3>
                <p className="text-gray-500 dark:text-gray-400 font-medium">There are no pending submission reviews at the moment.</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-fade-in">
            {tasks.map((task, idx) => (
                <div
                    key={task._id}
                    style={{ animationDelay: `${idx * 100}ms` }}
                    className="glass-card p-6 flex flex-col md:flex-row justify-between items-start gap-6 group hover:border-amber-400/30 transition-all duration-300 animate-slide-up relative overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-400"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-400/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                    <div className="flex-1 w-full relative z-10">
                        <div className="flex flex-wrap items-center gap-3 mb-3">
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 uppercase tracking-wider border border-amber-200 dark:border-amber-800/50 flex items-center gap-1.5 shadow-sm">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                                Review Required
                            </span>
                            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300 border border-gray-200 dark:border-white/5 flex items-center gap-1.5">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
                                {task.project?.title || 'Unknown Project'}
                            </span>
                        </div>

                        <h4 className="font-display font-bold text-xl text-gray-900 dark:text-white mb-1 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">{task.title}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 flex items-center gap-2">
                            <span className="font-medium">Submitted by:</span>
                            <span className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-2 py-0.5 rounded-md border border-gray-200 dark:border-white/10">
                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-400 to-indigo-400"></div>
                                {task.assignee?.name || 'Unknown Student'}
                            </span>
                        </p>

                        <div className="space-y-4">
                            {task.evidenceLinks && task.evidenceLinks.length > 0 && (
                                <div className="bg-gray-50/50 dark:bg-black/20 rounded-xl p-4 border border-gray-100 dark:border-white/5">
                                    <h5 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Evidence & Links</h5>
                                    <div className="flex flex-wrap gap-2">
                                        {task.evidenceLinks.map((link, i) => (
                                            <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="btn btn-xs bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 hover:border-blue-400 hover:text-blue-600 flex items-center gap-1.5 transition-colors shadow-sm">
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                                Link {i + 1}
                                            </a>
                                        ))}
                                        {task.githubRepo && (
                                            <a href={task.githubRepo.url} target="_blank" rel="noopener noreferrer" className="btn btn-xs bg-gray-900 text-white border-transparent hover:bg-black flex items-center gap-1.5 shadow-sm">
                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                                {task.githubRepo.owner}/{task.githubRepo.repo}
                                            </a>
                                        )}
                                    </div>
                                </div>
                            )}

                            {task.codeSubmission && task.codeSubmission.code && (
                                <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 shadow-inner">
                                    <div className="bg-gray-100 dark:bg-white/5 px-4 py-2 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Code Submission ({task.codeSubmission.language || 'javascript'})</span>
                                        <span className="text-[10px] text-gray-400 italic">Read-only mode</span>
                                    </div>
                                    <div className="h-[300px] resize-y overflow-hidden relative">
                                        <CodeEditor
                                            initialCode={task.codeSubmission.code}
                                            language={task.codeSubmission.language || 'javascript'}
                                            readOnly={true}
                                            allowRun={true}
                                            height="100%"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex md:flex-col gap-3 w-full md:w-auto md:min-w-[180px] sticky top-20 pt-2">
                        <button
                            onClick={() => handleAction(task._id, 'approve')}
                            className="btn btn-primary w-full shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform"
                        >
                            ✓ Approve
                        </button>
                        <button
                            onClick={() => handleAction(task._id, 'reject')}
                            className="btn bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 hover:border-amber-400 hover:text-amber-600 w-full shadow-sm"
                        >
                            ↩ Request Changes
                        </button>
                        <button
                            onClick={async () => {
                                const feedback = window.prompt('Enter feedback for the student');
                                if (feedback) {
                                    try {
                                        await api.patch(`/api/tasks/${task._id}/feedback`, { feedback });
                                        addToast('Feedback sent', 'success');
                                        fetchReviewTasks();
                                    } catch (err) {
                                        console.error(err);
                                        addToast('Failed to send feedback', 'error');
                                    }
                                }
                            }}
                            className="btn bg-transparent border border-dashed border-gray-300 dark:border-white/20 text-gray-500 hover:text-blue-500 hover:border-blue-400 w-full"
                        >
                            💬 Add Feedback
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ReviewsTab;
