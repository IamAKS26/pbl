import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const AdminGroups = () => {
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const res = await api.get('/api/admin/groups');
                setGroups(res.data.groups);
            } catch (error) {
                console.error('Error fetching groups:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchGroups();
    }, []);

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 h-full overflow-y-auto relative animate-fade-in">
            <div className="mb-8 relative z-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">Group Management</h1>
                    <p className="text-slate-500 dark:text-gray-400">Oversee student teams and project assignments.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative z-10">
                {groups.map((group, idx) => (
                    <div
                        key={group._id}
                        style={{ animationDelay: `${idx * 100}ms` }}
                        className="glass-card p-6 border border-white/40 dark:border-white/5 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group animate-slide-up"
                    >
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100 dark:border-white/10">
                            <h3 className="font-display font-bold text-slate-900 dark:text-white text-xl">{group.name}</h3>
                            <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 px-2.5 py-1 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                                {group.members.length} Members
                            </span>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Team Members</p>
                                <div className="flex -space-x-2 overflow-hidden py-1">
                                    {group.members.map(member => (
                                        <div
                                            key={member._id}
                                            className="inline-flex h-8 w-8 rounded-full ring-2 ring-white dark:ring-gray-800 bg-gray-200 dark:bg-gray-700 items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300 relative z-0 hover:z-10 hover:scale-110 transition-transform cursor-help"
                                            title={member.name}
                                        >
                                            {member.name[0]}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {group.project ? (
                                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-3 relative overflow-hidden group/project hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                                    <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-400/10 rounded-full blur-xl -mr-8 -mt-8"></div>
                                    <div className="flex items-start gap-3 relative z-10">
                                        <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-600 dark:text-emerald-400">
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                        </div>
                                        <div>
                                            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase mb-0.5">Assigned Project</p>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{group.project.title}</p>
                                            <p className="text-xs text-emerald-700/70 dark:text-emerald-400/70 mt-0.5">Teacher: {group.project.teacher?.name}</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-gray-50 dark:bg-white/5 border border-dashed border-gray-200 dark:border-white/10 rounded-xl p-3 text-center text-sm text-gray-500 dark:text-gray-400 italic">
                                    No project assigned
                                </div>
                            )}
                        </div>

                        <div className="text-xs text-gray-400 dark:text-gray-500 pt-4 border-t border-gray-100 dark:border-white/5 flex items-center gap-2">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            Created {new Date(group.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminGroups;
