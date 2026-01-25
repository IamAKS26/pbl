import React, { useEffect, useState } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../context/AuthContext';

const AdminUsers = () => {
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
            alert('Failed to update status');
        }
    };

    if (loading) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8 h-full overflow-y-auto bg-gray-50">
            <h1 className="text-2xl font-display font-bold text-gray-900 mb-6">User Management</h1>
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase text-gray-500 font-semibold">
                            <th className="px-6 py-4">User</th>
                            <th className="px-6 py-4">Role</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4">Joined</th>
                            <th className="px-6 py-4 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {users.map(user => (
                            <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-600 text-xs">
                                            {user.name[0]}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 text-sm">{user.name}</div>
                                            <div className="text-gray-500 text-xs">{user.email}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded-md text-xs font-bold border ${user.role === 'Admin' ? 'bg-purple-50 text-purple-700 border-purple-100' :
                                        user.role === 'Teacher' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' :
                                            'bg-blue-50 text-blue-700 border-blue-100'
                                        }`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                        }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${user.isActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                                        {user.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">
                                    {new Date(user.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => toggleStatus(user._id)}
                                        className="text-xs font-medium text-indigo-600 hover:text-indigo-800"
                                    >
                                        {user.isActive ? 'Deactivate' : 'Activate'}
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
