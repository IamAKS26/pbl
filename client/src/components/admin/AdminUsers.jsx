import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

const AdminUsers = () => {
    const { addToast } = useToast();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const res = await api.get('/api/admin/users');
                setUsers(res.data.users);
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, []);

    const toggleStatus = async (userId) => {
        try {
            await api.patch(`/ api / admin / users / ${userId}/status`);
            // Update local state
            setUsers(users.map(u => {
                if (u._id === userId) return { ...u, isActive: !u.isActive };
                return u;
            }));
        } catch (error) {
            console.error('Error toggling status', error);
            addToast('Failed to update status', 'error');
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 h-full overflow-y-auto relative animate-fade-in">
            <div className="mb-8 relative z-10 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-display font-bold text-slate-900 dark:text-white mb-2">User Management</h1>
                    <p className="text-slate-500 dark:text-gray-400">Manage system access and roles.</p>
                </div>
            </div>

            <div className="glass-panel overflow-hidden border border-white/20 dark:border-white/5 shadow-xl relative z-10">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-white/50 dark:bg-white/5 backdrop-blur-sm border-b border-gray-100 dark:border-white/5">
                        <tr className="text-xs uppercase text-gray-400 dark:text-gray-500 font-bold tracking-widest">
                            <th className="px-8 py-5 pl-10">User</th>
                            <th className="px-6 py-5">Role</th>
                            <th className="px-6 py-5">Status</th>
                            <th className="px-6 py-5">Joined</th>
                            <th className="px-8 py-5 text-right pr-10">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5 bg-white/20 dark:bg-transparent">
                        {users.map((user, idx) => (
                            <tr
                                key={user._id}
                                className="group hover:bg-white/50 dark:hover:bg-white/5 transition-colors duration-200"
                                style={{ animationDelay: `${idx * 50}ms` }}
                            >
                                <td className="px-8 py-4 pl-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-white/10 dark:to-white/5 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 text-sm border-2 border-white dark:border-white/10 shadow-sm">
                                            {user.name[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white text-sm">{user.name}</div>
                                            <div className="text-gray-500 dark:text-gray-400 text-xs font-mono mt-0.5">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${user.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-100 dark:bg-purple-900/20 dark:text-purple-300 dark:border-purple-800' :
                                        user.role === 'Teacher' ? 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 dark:border-indigo-800' :
                                            'bg-blue-50 text-blue-700 border-blue-100 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${user.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800' : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></span>
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400 font-mono">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-8 py-4 text-right pr-10">
                                    <button
                                        onClick={() => toggleStatus(user._id)}
                                        className={`btn btn-xs ${user.isActive ? 'bg-white dark:bg-white/5 border-gray-200 dark:border-white/10 text-gray-600 hover:text-red-600 hover:border-red-200' : 'btn-primary'}`}
                                    >
                                        {user.isActive ? 'Deactivate' : 'Activate Access'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsers;
