import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const AdminLayout = () => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    const navItems = [
        { path: '/admin', label: 'Overview', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
        { path: '/admin/users', label: 'Users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { path: '/admin/groups', label: 'Groups', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
        { path: '/admin/projects', label: 'Projects', icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z' },
        { path: '/admin/logs', label: 'System Logs', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    ];

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans">
            {/* Sidebar - Tech Dark Mode */}
            <div className={`fixed inset-y-0 left-0 bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full w-72'} md:relative md:translate-x-0 border-r border-slate-800`}>
                <div className="h-24 flex items-center px-8 border-b border-slate-800/50 bg-slate-900/50 backdrop-blur-xl">
                    <div className="flex items-center gap-3">
                        <div className="relative w-10 h-10 flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500 to-emerald-500 rounded-xl blur opacity-75 animate-pulse"></div>
                            <div className="relative w-full h-full bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center">
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400 font-black text-xl">A</span>
                            </div>
                        </div>
                        <div>
                            <span className="block font-display font-bold text-xl text-white tracking-tight">Admin<span className="text-cyan-400">Panel</span></span>
                            <span className="block text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em]">Console</span>
                        </div>
                    </div>
                </div>

                <div className="px-5 py-8">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 px-2">Main Menu</p>
                    <nav className="space-y-2">
                        {navItems.map((item) => (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-300 group relative overflow-hidden ${location.pathname === item.path
                                    ? 'text-white'
                                    : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
                                    }`}
                            >
                                {location.pathname === item.path && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 to-emerald-600/20 border-l-2 border-cyan-500"></div>
                                )}

                                <svg className={`w-5 h-5 relative z-10 transition-transform duration-300 group-hover:scale-110 ${location.pathname === item.path ? 'text-cyan-400' : 'text-slate-500 group-hover:text-cyan-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} /></svg>
                                <span className="font-semibold relative z-10">{item.label}</span>

                                {location.pathname === item.path && (
                                    <div className="absolute right-4 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)] animate-pulse"></div>
                                )}
                            </button>
                        ))}
                    </nav>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 bg-slate-900 border-t border-slate-800">
                    <div className="flex items-center gap-3 mb-6 bg-slate-800/50 p-3 rounded-xl border border-slate-700/50">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 flex items-center justify-center border border-slate-600">
                            <span className="font-bold text-slate-300">{user?.name?.charAt(0) || 'A'}</span>
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <h4 className="text-sm font-bold text-slate-200 truncate">{user?.name}</h4>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center gap-2 px-4 py-3 border border-slate-700 rounded-xl text-sm font-bold text-slate-400 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 transition-all duration-300 hover:shadow-[0_0_15px_rgba(248,113,113,0.1)]"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        Termiante Session
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50 relative">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none"></div>
                <Outlet />
            </div>
        </div>
    );
};

export default AdminLayout;
