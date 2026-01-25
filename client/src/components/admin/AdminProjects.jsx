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
        <div className="p-8 h-full overflow-y-auto bg-gray-50">
            <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">All Projects</h1>
            <div className="space-y-4">
                {projects.map(project => (
                    <div key={project._id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-bold text-xl text-gray-900">{project.title}</h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${project.status === 'Live' ? 'bg-emerald-100 text-emerald-800' :
                                    project.status === 'Archived' ? 'bg-gray-100 text-gray-800' : 'bg-blue-100 text-blue-800'
                                    }`}>
                                    {project.status || 'Active'}
                                </span>
                            </div>
                            <p className="text-gray-500 text-sm mb-4 line-clamp-2">{project.description}</p>

                            <div className="flex items-center gap-6 text-sm text-gray-500">
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                                    {project.teacher?.name || 'Unknown Teacher'}
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                    {project.assignedGroups?.length || 0} Groups
                                </div>
                                <div className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                    {project.stats?.totalTasks || 0} Tasks
                                </div>
                            </div>
                        </div>

                        <div className="w-full md:w-48 shrink-0">
                            <div className="flex justify-between text-xs font-bold text-gray-500 mb-1">
                                <span>Progress</span>
                                <span>{project.stats?.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${project.stats?.progress}%` }}></div>
                            </div>
                            <div className="mt-2 text-xs text-gray-400 text-center">
                                {project.stats?.completedTasks} / {project.stats?.totalTasks} Tasks Completed
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminProjects;
