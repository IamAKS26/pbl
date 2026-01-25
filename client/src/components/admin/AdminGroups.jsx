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
        <div className="p-8 h-full overflow-y-auto bg-gray-50">
            <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">Group Management</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {groups.map(group => (
                    <div key={group._id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-900 text-lg">{group.name}</h3>
                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">
                                {group.members.length} Members
                            </span>
                        </div>

                        <div className="space-y-3 mb-6">
                            <div className="flex -space-x-2 overflow-hidden">
                                {group.members.map(member => (
                                    <div key={member._id} className="inline-block h-8 w-8 rounded-full ring-2 ring-white bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600" title={member.name}>
                                        {member.name[0]}
                                    </div>
                                ))}
                            </div>
                            {group.project ? (
                                <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3">
                                    <p className="text-xs text-emerald-600 font-bold uppercase mb-1">Assigned Project</p>
                                    <p className="text-sm font-bold text-emerald-900 truncate">{group.project.title}</p>
                                    <p className="text-xs text-emerald-700 mt-1">Teacher: {group.project.teacher?.name}</p>
                                </div>
                            ) : (
                                <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-center text-sm text-gray-500 italic">
                                    No project assigned
                                </div>
                            )}
                        </div>

                        <div className="text-xs text-gray-400 pt-4 border-t">
                            Created {new Date(group.createdAt).toLocaleDateString()}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AdminGroups;
