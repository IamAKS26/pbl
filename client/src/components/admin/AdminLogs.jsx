import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const AdminLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await api.get('/api/admin/logs');
                setLogs(res.data.logs);
            } catch (error) {
                console.error('Error fetching logs:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchLogs();
    }, []);

    if (loading) return (
        <div className="flex h-full items-center justify-center">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-8 h-full overflow-y-auto relative animate-fade-in">
            <div className="mb-8 relative z-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">System Logs</h1>
                    <p className="text-slate-500 dark:text-gray-400 font-mono text-sm">/var/log/activity_feed</p>
                </div>
            </div>

            <div className="relative z-10 glass-panel bg-slate-900/90 dark:bg-black/80 backdrop-blur-xl border border-slate-700/50 dark:border-white/10 overflow-hidden shadow-2xl font-mono text-xs md:text-sm">
                <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-2 mr-4">
                            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50 shadow-[0_0_8px_rgba(239,68,68,0.4)]"></div>
                            <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.4)]"></div>
                            <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
                        </div>
                        <span className="text-slate-400">root@pbl-system:~/logs</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span className="text-emerald-500 text-xs font-bold uppercase tracking-wider">Live Stream</span>
                    </div>
                </div>

                <div className="divide-y divide-white/5 max-h-[600px] overflow-y-auto custom-scrollbar">
                    {logs.map((log, idx) => (
                        <div
                            key={log._id}
                            style={{ animationDelay: `${idx * 50}ms` }}
                            className="group px-6 py-3 hover:bg-white/5 transition-colors flex flex-col md:flex-row md:items-start gap-4 animate-slide-up"
                        >
                            <div className="min-w-[140px] shrink-0 border-r border-white/5 md:pr-4 md:mr-1">
                                <span className="text-slate-500 block mb-0.5">
                                    {new Date(log.createdAt).toISOString().split('T')[0]}
                                </span>
                                <span className="text-cyan-400/90 font-bold">
                                    {new Date(log.createdAt).toLocaleTimeString()}
                                </span>
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center flex-wrap gap-2 mb-1.5">
                                    <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border ${log.type === 'submission' ? 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10' :
                                        log.type === 'evidence' ? 'text-amber-300 border-amber-500/30 bg-amber-500/10' :
                                            'text-blue-300 border-blue-500/30 bg-blue-500/10'
                                        }`}>
                                        {log.type}
                                    </span>
                                    <span className="text-slate-300 font-medium">
                                        {log.message}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-slate-500">
                                    <span className="flex items-center gap-1.5">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        <span className="text-slate-400 hover:text-white transition-colors">{log.sender?.name || 'System'}</span>
                                    </span>
                                    <span className="text-slate-600">➜</span>
                                    <span className="flex items-center gap-1.5">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                        <span className="text-slate-400 hover:text-white transition-colors">{log.recipient?.name || 'User'}</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}

                    {logs.length === 0 && (
                        <div className="p-12 text-center text-slate-600 italic">
                            No logs found in the buffer.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminLogs;
