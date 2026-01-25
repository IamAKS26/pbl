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
        <div className="p-8 h-full overflow-y-auto bg-slate-50 relative">
            <div className="mb-8 relative z-10">
                <h1 className="text-3xl font-display font-black text-slate-900 mb-2">
                    System <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-500">Logs</span>
                </h1>
                <p className="text-slate-500 font-medium font-mono text-sm">/var/log/activity_feed</p>
            </div>

            <div className="relative z-10 bg-[#0f172a] rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/20 border border-slate-800 font-mono text-sm">
                <div className="px-6 py-4 bg-slate-900 border-b border-slate-800 flex items-center gap-2">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500"></div>
                        <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500"></div>
                    </div>
                    <span className="ml-4 text-slate-500 text-xs">live_stream.log</span>
                </div>

                <div className="divide-y divide-slate-800/50">
                    {logs.map(log => (
                        <div key={log._id} className="group px-6 py-4 hover:bg-slate-800/30 transition-colors flex items-start gap-4">
                            <div className="min-w-[150px] shrink-0">
                                <span className="text-slate-500 text-xs mt-0.5 block">
                                    {new Date(log.createdAt).toISOString().split('T')[0]}
                                </span>
                                <span className="text-cyan-600/80 text-xs">
                                    {new Date(log.createdAt).toLocaleTimeString()}
                                </span>
                            </div>

                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs uppercase tracking-wider px-1.5 py-0.5 rounded border ${log.type === 'submission' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                                            log.type === 'evidence' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
                                                'text-slate-400 border-slate-500/30 bg-slate-500/10'
                                        }`}>
                                        {log.type}
                                    </span>
                                    <span className="text-slate-300">
                                        {log.message}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <span>From: <span className="text-slate-400">{log.sender?.name || 'System'}</span></span>
                                    <span>→</span>
                                    <span>To: <span className="text-slate-400">{log.recipient?.name || 'User'}</span></span>
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
