import { useState } from 'react';
import { formatDateTime } from '../../utils/dateHelpers';

const TaskDetails = ({ task, onClose }) => {
    const [activeTab, setActiveTab] = useState('evidence');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
                {/* Header */}
                <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">{task.title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6">
                    {/* Task Info */}
                    <div className="mb-6">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <span className="text-sm text-gray-500">Status:</span>
                                <p className="font-medium text-gray-900">{task.status}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Priority:</span>
                                <p className="font-medium text-gray-900">{task.priority}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Assigned to:</span>
                                <p className="font-medium text-gray-900">{task.assignee?.name || 'Unassigned'}</p>
                            </div>
                            <div>
                                <span className="text-sm text-gray-500">Last Updated:</span>
                                <p className="font-medium text-gray-900">{formatDateTime(task.lastUpdated)}</p>
                            </div>
                        </div>

                        {task.description && (
                            <div>
                                <span className="text-sm text-gray-500">Description:</span>
                                <p className="text-gray-700 mt-1">{task.description}</p>
                            </div>
                        )}
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 mb-4">
                        <div className="flex space-x-8">
                            <button
                                onClick={() => setActiveTab('evidence')}
                                className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'evidence'
                                        ? 'border-emerald-600 text-emerald-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                Evidence ({task.evidenceLinks?.length || 0})
                            </button>
                            <button
                                onClick={() => setActiveTab('commits')}
                                className={`pb-2 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === 'commits'
                                        ? 'border-emerald-600 text-emerald-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700'
                                    }`}
                            >
                                GitHub Commits ({task.githubCommits?.length || 0})
                            </button>
                        </div>
                    </div>

                    {/* Tab Content */}
                    {activeTab === 'evidence' && (
                        <div>
                            {task.evidenceLinks && task.evidenceLinks.length > 0 ? (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {task.evidenceLinks.map((evidence, index) => (
                                        <div key={index} className="relative group">
                                            {evidence.resourceType === 'image' ? (
                                                <img
                                                    src={evidence.url}
                                                    alt="Evidence"
                                                    className="w-full h-40 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                                                    onClick={() => window.open(evidence.url, '_blank')}
                                                />
                                            ) : (
                                                <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                                                    onClick={() => window.open(evidence.url, '_blank')}
                                                >
                                                    <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                </div>
                                            )}
                                            <p className="text-xs text-gray-500 mt-1">
                                                {formatDateTime(evidence.uploadedAt)}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p>No evidence uploaded yet</p>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'commits' && (
                        <div>
                            {task.githubRepo ? (
                                <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600">Repository:</p>
                                    <a
                                        href={task.githubRepo.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-emerald-600 hover:text-emerald-700 font-medium"
                                    >
                                        {task.githubRepo.owner}/{task.githubRepo.repo}
                                    </a>
                                </div>
                            ) : null}

                            {task.githubCommits && task.githubCommits.length > 0 ? (
                                <div className="space-y-4">
                                    {task.githubCommits.map((commit, index) => (
                                        <div key={index} className="border-l-4 border-emerald-500 pl-4 py-2">
                                            <p className="font-medium text-gray-900">{commit.message}</p>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-sm text-gray-600">{commit.author}</p>
                                                <p className="text-xs text-gray-500">{formatDateTime(commit.timestamp)}</p>
                                            </div>
                                            <a
                                                href={commit.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-xs text-emerald-600 hover:text-emerald-700 mt-1 inline-block"
                                            >
                                                {commit.sha.substring(0, 7)} →
                                            </a>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-12 text-gray-400">
                                    <svg className="mx-auto h-12 w-12 mb-4" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                                    </svg>
                                    <p>No GitHub repository linked</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
                    <button onClick={onClose} className="btn btn-secondary w-full">
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TaskDetails;
