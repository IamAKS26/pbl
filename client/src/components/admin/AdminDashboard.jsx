import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
    // We don't need token here as api interceptor handles it
    const [stats, setStats] = useState(null);
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/api/admin/stats');
                setStats(res.data.stats);
                setRecentUsers(res.data.recentUsers);
            } catch (error) {
                console.error('Error fetching admin stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) return (
        <div className="flex h-full items-center justify-center">
            <div className="w-16 h-16 border-4 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="p-8 h-full overflow-y-auto relative animate-fade-in">
            {/* Header */}
            <div className="mb-8 relative z-10 flex flex-col md:flex-row justify-between items-end gap-4">
                <div>
                    <h1 className="text-4xl font-display font-black text-slate-900 dark:text-white mb-2 tracking-tight">
                        System <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Overview</span>
                    </h1>
                    <p className="text-slate-500 dark:text-gray-400 font-medium text-lg">Live monitoring reflecting real-time system status.</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/10 text-cyan-400 text-xs font-bold uppercase tracking-widest shadow-lg">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                    </span>
                    System Online
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-10">
                {[
                    { label: 'Total Students', value: stats?.students, color: 'cyan', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                    { label: 'Total Teachers', value: stats?.teachers, color: 'violet', icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
                    { label: 'Active Projects', value: stats?.projects, color: 'emerald', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
                    { label: 'Total Groups', value: stats?.groups, color: 'amber', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
                ].map((item, idx) => (
                    <div
                        key={idx}
                        style={{ animationDelay: `${idx * 100}ms` }}
                        className="glass-card p-6 relative group animate-slide-up border border-white/40 dark:border-white/5 hover:border-white/60 dark:hover:border-white/20"
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br from-${item.color}-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl pointer-events-none`}></div>

                        <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className={`p-3.5 rounded-xl bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500 group-hover:text-${item.color}-500 group-hover:bg-${item.color}-50 dark:group-hover:bg-${item.color}-900/20 transition-colors duration-300 shadow-sm`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 group-hover:bg-${item.color}-100 group-hover:text-${item.color}-600 dark:group-hover:bg-${item.color}-900/30 dark:group-hover:text-${item.color}-400 transition-colors duration-300`}>
                                LIVE
                            </span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-4xl font-display font-black text-slate-900 dark:text-white mb-1">{item.value || 0}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Users List */}
            <div className="relative z-10 glass-panel border border-white/40 dark:border-white/5 overflow-hidden shadow-xl animate-fade-in" style={{ animationDelay: '400ms' }}>
                <div className="px-8 py-6 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-white/40 dark:bg-white/5 backdrop-blur-sm">
                    <h3 className="text-lg font-display font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                        </span>
                        Recent Activity Log
                    </h3>
                    <button className="text-xs font-bold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 uppercase tracking-wider hover:underline transition-all">View Full Log</button>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-white/5 bg-white/20 dark:bg-transparent">
                    {recentUsers.map((user, idx) => (
                        <div key={user._id} className="group px-8 py-5 flex items-center justify-between hover:bg-white/40 dark:hover:bg-white/5 transition-colors duration-300">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm transition-transform duration-300 group-hover:scale-110 border border-white/50 dark:border-white/10 ${user.role === 'Teacher' ? 'bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/40 dark:to-purple-900/40 text-violet-600 dark:text-violet-300' : 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/10 dark:to-white/5 text-slate-600 dark:text-slate-300'}`}>
                                    {user.name[0]}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 dark:text-white text-base">{user.name}</h4>
                                    <p className="text-xs font-medium text-slate-500 dark:text-gray-400 font-mono mt-0.5">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border transition-colors duration-300 ${user.role === 'Teacher'
                                    ? 'bg-violet-50 text-violet-600 border-violet-100 dark:bg-violet-900/20 dark:text-violet-300 dark:border-violet-800'
                                    : 'bg-emerald-50 text-emerald-600 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-300 dark:border-emerald-800'
                                    }`}>
                                    {user.role}
                                </span>
                                <span className="text-xs font-medium text-slate-400 dark:text-gray-500 font-mono">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                    {recentUsers.length === 0 && (
                        <div className="p-12 text-center text-slate-400 dark:text-gray-500 font-medium italic">No recent activity detected.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
