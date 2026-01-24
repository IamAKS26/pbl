import { useState, useEffect } from 'react';
import api from '../../utils/api';
import CodeEditor from '../common/CodeEditor';

const ReviewsTab = () => {
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

            alert(action === 'approve' ? 'Task Approved!' : 'Revision Requested');
        } catch (err) {
            console.error(err);
            alert('Action failed');
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading submission queue...</div>;

    if (tasks.length === 0) {
        return (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">All caught up!</h3>
                <p className="mt-1 text-sm text-gray-500">No pending reviews.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {tasks.map(task => (
                <div key={task._id} className="bg-white p-4 rounded-lg shadow border border-yellow-200 flex flex-col md:flex-row justify-between items-start md:items-center">
                    <div className="mb-4 md:mb-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Review Required</span>
                            <span className="text-xs text-gray-500">{task.project?.title || 'Unknown Project'}</span>
                        </div>
                        <h4 className="font-semibold text-lg text-gray-900">{task.title}</h4>
                        <p className="text-sm text-gray-600 mb-2">By: {task.assignee?.name || 'Unknown Student'}</p>

                        {task.evidenceLinks && task.evidenceLinks.length > 0 && (
                            <div className="flex gap-2 text-sm mt-2">
                                <span className="text-gray-500">Evidence:</span>
                                {task.evidenceLinks.map((link, i) => (
                                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                        Link {i + 1}
                                    </a>
                                ))}
                            </div>
                        )}
                        {task.githubRepo && (
                            <div className="mt-1 text-sm">
                                <span className="text-gray-500">Repo: </span>
                                <a href={task.githubRepo.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                    {task.githubRepo.owner}/{task.githubRepo.repo}
                                </a>
                            </div>
                        )}
                        {task.codeSubmission && task.codeSubmission.code && (
                            <div className="mt-4">
                                <p className="text-sm font-medium text-gray-700 mb-1">Code Submission:</p>
                                <div className="h-[400px] resize-y overflow-hidden border rounded-lg min-h-[200px]">
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

                    <div className="flex space-x-2 w-full md:w-auto">
                        <button
                            onClick={() => handleAction(task._id, 'reject')}
                            className="btn bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 flex-1 md:flex-none"
                        >
                            Request Revision
                        </button>
                        <button
                            onClick={() => handleAction(task._id, 'approve')}
                            className="btn btn-primary flex-1 md:flex-none"
                        >
                            Approve & Award XP
                        </button>
                        <button
                            onClick={async () => {
                                const feedback = window.prompt('Enter feedback for the student');
                                if (feedback) {
                                    try {
                                        await api.patch(`/api/tasks/${task._id}/feedback`, { feedback });
                                        alert('Feedback sent');
                                        // Refresh list after feedback
                                        fetchReviewTasks();
                                    } catch (err) {
                                        console.error(err);
                                        alert('Failed to send feedback');
                                    }
                                }
                            }}
                            className="btn btn-secondary flex-1 md:flex-none"
                        >
                            Add Feedback
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default ReviewsTab;
