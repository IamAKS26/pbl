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
        <div className="p-8 h-full overflow-y-auto bg-slate-50 relative">
            {/* Header */}
            <div className="mb-8 relative z-10">
                <h1 className="text-3xl font-display font-black text-slate-900 mb-2">
                    System <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 to-emerald-500">Overview</span>
                </h1>
                <p className="text-slate-500 font-medium">Live monitoring reflecting real-time system status.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 relative z-10">
                {[
                    { label: 'Total Students', value: stats?.students, color: 'cyan', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
                    { label: 'Total Teachers', value: stats?.teachers, color: 'violet', icon: 'M12 14l9-5-9-5-9 5 9 5z M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z' },
                    { label: 'Active Projects', value: stats?.projects, color: 'emerald', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
                    { label: 'Total Groups', value: stats?.groups, color: 'amber', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
                ].map((item, idx) => (
                    <div key={idx} className="group relative bg-white rounded-2xl p-6 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 overflow-hidden border border-slate-100">
                        {/* Hover Gradient Border Effect */}
                        <div className={`absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-${item.color}-400 to-${item.color}-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`}></div>

                        <div className="flex items-start justify-between mb-4 relative z-10">
                            <div className={`p-3.5 rounded-xl bg-slate-50 text-slate-400 group-hover:text-${item.color}-500 group-hover:bg-${item.color}-50 transition-colors duration-300`}>
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full bg-slate-100 text-slate-500 group-hover:bg-${item.color}-100 group-hover:text-${item.color}-600 transition-colors duration-300`}>
                                LIVE
                            </span>
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-4xl font-black text-slate-900 mb-1 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-slate-900 group-hover:to-slate-700 transition-all">{item.value || 0}</h3>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{item.label}</p>
                        </div>

                        {/* Background Decoration */}
                        <div className={`absolute -right-4 -bottom-4 w-24 h-24 bg-${item.color}-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-2xl`}></div>
                    </div>
                ))}
            </div>

            {/* Recent Users List - Hybrid Tech Card */}
            <div className="relative z-10 bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-lg shadow-slate-200/50">
                <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-white">
                    <h3 className="text-lg font-black text-slate-900 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                        Recent Activity
                    </h3>
                    <button className="text-xs font-bold text-cyan-600 hover:text-cyan-700 uppercase tracking-wider hover:underline transition-all">View All Entries</button>
                </div>
                <div className="divide-y divide-slate-50">
                    {recentUsers.map(user => (
                        <div key={user._id} className="group px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-colors duration-300">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold shadow-sm transition-transform duration-300 group-hover:scale-105 ${user.role === 'Teacher' ? 'bg-gradient-to-br from-violet-500 to-purple-600 text-white shadow-violet-200' : 'bg-gradient-to-br from-slate-200 to-slate-300 text-slate-600'}`}>
                                    {user.name[0]}
                                </div>
                                <div>
                                    <h4 className="font-bold text-slate-900 text-base">{user.name}</h4>
                                    <p className="text-xs font-medium text-slate-400 font-mono mt-0.5">{user.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest border transition-colors duration-300 ${user.role === 'Teacher'
                                        ? 'bg-violet-50 text-violet-600 border-violet-100 group-hover:bg-violet-100 group-hover:border-violet-200'
                                        : 'bg-emerald-50 text-emerald-600 border-emerald-100 group-hover:bg-emerald-100 group-hover:border-emerald-200'
                                    }`}>
                                    {user.role}
                                </span>
                                <span className="text-xs font-medium text-slate-400 font-mono">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                    ))}
                    {recentUsers.length === 0 && (
                        <div className="p-12 text-center text-slate-400 font-medium italic">No recent activity detected in the system log.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
