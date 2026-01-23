import React, { useState } from 'react';

const SubmissionModal = ({ task, onClose, onSubmit }) => {
    const [url, setUrl] = useState('');
    const [type, setType] = useState('github');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!url.trim()) return;

        setIsSubmitting(true);
        // Simulate network delay for UX then call prop
        // In real app, we might call API here or parent does it.
        // Parent doing it is better for state management.
        await onSubmit({ url, type });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-xl p-6 max-w-lg w-full shadow-2xl animate-scale-in">
                <div className="flex justify-between items-start mb-6">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Submit Evidence</h3>
                        <p className="text-gray-500 text-sm mt-1">
                            For task: <span className="font-medium text-emerald-700">{task.title}</span>
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Type Selector */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Submission Type</label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setType('github')}
                                className={`flex items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all ${type === 'github'
                                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-500'
                                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                    }`}
                            >
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-1.334-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
                                GitHub Repo
                            </button>
                            <button
                                type="button"
                                onClick={() => setType('link')}
                                className={`flex items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all ${type === 'link'
                                        ? 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                                        : 'border-gray-200 hover:bg-gray-50 text-gray-700'
                                    }`}
                            >
                                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
                                Other Link
                            </button>
                        </div>
                    </div>

                    {/* URL Input */}
                    <div>
                        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-1">
                            Link URL
                        </label>
                        <input
                            type="url"
                            id="url"
                            required
                            placeholder={type === 'github' ? "https://github.com/username/repo" : "https://docs.google.com/..."}
                            className="input w-full"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                            Paste the full URL to your work.
                        </p>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary flex-1"
                            disabled={isSubmitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary flex-1"
                            disabled={isSubmitting || !url.trim()}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Evidence'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default SubmissionModal;
