import React, { useState } from 'react';
import { PROJECT_TEMPLATES } from '../../constants/templates';
import LibraryTaskCard from './LibraryTaskCard';

const TaskLibrary = ({ onAddCustomTask }) => {
    const [selectedTemplateId, setSelectedTemplateId] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    const currentTemplate = PROJECT_TEMPLATES.find(t => t.id === selectedTemplateId);

    // Simple filter
    const displayTasks = currentTemplate
        ? currentTemplate.suggestedTasks.filter(task =>
            task.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : [];

    return (
        <div className="flex flex-col h-full glass-panel border border-white/60 bg-white/20 backdrop-blur-3xl rounded-2xl overflow-hidden shadow-2xl shadow-emerald-900/5">
            <div className="p-5 border-b border-white/30 bg-white/40">
                <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                    </div>
                    <h2 className="font-display font-bold text-gray-800 tracking-tight">Task Library</h2>
                </div>

                <div className="space-y-3">
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 block">Project Template</label>
                        <select
                            value={selectedTemplateId}
                            onChange={(e) => setSelectedTemplateId(e.target.value)}
                            className="w-full bg-white/80 border border-emerald-100 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
                        >
                            <option value="">-- Choose Template --</option>
                            {PROJECT_TEMPLATES.map(t => (
                                <option key={t.id} value={t.id}>{t.title}</option>
                            ))}
                        </select>
                    </div>

                    <div className="relative">
                        <input
                            type="text"
                            placeholder="Search tasks..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white/80 border border-emerald-100 rounded-xl px-3 py-2 text-sm pl-9 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all shadow-sm"
                        />
                        <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {selectedTemplateId ? (
                    <>
                        <div className="px-1 flex items-center justify-between">
                            <span className="text-[10px] font-black text-emerald-700/60 uppercase tracking-widest">Suggested Tiles</span>
                            <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">{displayTasks.length}</span>
                        </div>
                        {displayTasks.map((task, idx) => (
                            <LibraryTaskCard
                                key={idx}
                                task={task}
                                templateId={selectedTemplateId}
                            />
                        ))}
                        {displayTasks.length === 0 && (
                            <div className="text-center py-10">
                                <p className="text-xs text-gray-400 italic">No tasks match your search</p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 opacity-60">
                        <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" /></svg>
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Select a Template</p>
                        <p className="text-[11px] text-gray-400">Choose a template above to see available task tiles.</p>
                    </div>
                )}
            </div>

            <div className="p-5 border-t border-white/30 bg-white/20">
                <button
                    onClick={onAddCustomTask}
                    className="w-full py-3 px-4 bg-white border border-emerald-200 text-emerald-700 text-xs font-bold rounded-xl hover:bg-emerald-50 hover:border-emerald-300 transition-all shadow-sm flex items-center justify-center gap-2 group"
                >
                    <span className="text-lg leading-none group-hover:scale-125 transition-transform">+</span> Create Custom Tile
                </button>
            </div>
        </div>
    );
};

export default TaskLibrary;
