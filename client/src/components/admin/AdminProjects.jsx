import React, { useEffect, useState } from 'react';
import api from '../../utils/api';

const AdminProjects = () => {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            try {
                const res = await api.get('/api/admin/projects');
                setProjects(res.data.projects);
            } catch (error) {
                console.error('Error fetching projects:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProjects();
    }, []);

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 h-full overflow-y-auto relative animate-fade-in">
            <div className="mb-8 relative z-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">Project Oversight</h1>
                    <p className="text-slate-500 dark:text-gray-400">Monitor deadlines, progress, and team performance.</p>
                </div>
            </div>

            <div className="space-y-4 relative z-10">
                {projects.map((project, idx) => (
                    <div
                        key={project._id}
                        style={{ animationDelay: `${idx * 100}ms` }}
                        className="glass-card p-6 border border-white/40 dark:border-white/5 hover:border-emerald-500/30 dark:hover:border-emerald-500/30 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group animate-slide-up flex flex-col md:flex-row gap-6 items-start md:items-center relative overflow-hidden"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                        <div className="flex-1 relative z-10">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-display font-bold text-xl text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">{project.title}</h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${project.status === 'Live' ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-300 dark:border-emerald-800' :
                                    project.status === 'Archived' ? 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-white/10' : 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-800'
                                    }`}>
                                    {project.status || 'Active'}
                                </span>
                            </div>
                            <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">{project.description}</p>

                            <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
                                <div className="flex items-center gap-2 bg-white/50 dark:bg-white/5 px-2 py-1 rounde-md rounded border border-gray-100 dark:border-white/5">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    <span className="font-medium text-gray-700 dark:text-gray-300">{project.teacher?.name || 'Unknown Teacher'}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                    <span className="font-medium">{project.assignedGroups?.length || 0} Groups</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                    <span className="font-medium">{project.stats?.totalTasks || 0} Tasks</span>
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-48 shrink-0 relative z-10 bg-gray-50 dark:bg-black/20 p-4 rounded-xl border border-gray-100 dark:border-white/5">
                            <div className="flex justify-between text-xs font-bold text-gray-500 dark:text-gray-400 mb-2">
                                <span>Progress</span>
                                <span className={parseInt(project.stats?.progress) === 100 ? 'text-emerald-500' : ''}>{project.stats?.progress || 0}%</span>
                            </div>
                            <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-1.5 overflow-hidden mb-3">
                                <div className={`h-1.5 rounded-full ${parseInt(project.stats?.progress) === 100 ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${project.stats?.progress || 0}%` }}></div>
                            </div>
                            <div className="flex items-center justify-between text-[10px] uppercase font-bold tracking-wider">
                                <span className="text-gray-400">Completed</span>
                                <span className="text-gray-700 dark:text-gray-300">{project.stats?.completedTasks || 0}/{project.stats?.totalTasks || 0}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminProjects;
