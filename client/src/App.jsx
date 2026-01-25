import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProjectProvider } from './context/ProjectContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import PrivateRoute from './components/auth/PrivateRoute';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import ProjectBoard from './components/kanban/ProjectBoard';
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './components/admin/AdminDashboard';
import AdminUsers from './components/admin/AdminUsers';
import AdminGroups from './components/admin/AdminGroups';
import AdminProjects from './components/admin/AdminProjects';
import AdminLogs from './components/admin/AdminLogs';
import './index.css';



function App() {
    return (
        <AuthProvider>
            <ThemeProvider>
                <ToastProvider>
                    <ProjectProvider>
                        <Router>
                            <Routes>
                                <Route path="/" element={<Navigate to="/login" replace />} />
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />
                                <Route
                                    path="/dashboard"
                                    element={
                                        <PrivateRoute>
                                            <Dashboard />
                                        </PrivateRoute>
                                    }
                                />
                                <Route
                                    path="/project/:projectId"
                                    element={
                                        <PrivateRoute>
                                            <ProjectBoard />
                                        </PrivateRoute>
                                    }
                                />
                                <Route path="*" element={<Navigate to="/" replace />} />

                                {/* Admin Routes */}
                                <Route
                                    path="/admin"
                                    element={
                                        <PrivateRoute requiredRole="Admin">
                                            <AdminLayout />
                                        </PrivateRoute>
                                    }
                                >
                                    <Route index element={<AdminDashboard />} />
                                    <Route path="users" element={<AdminUsers />} />
                                    <Route path="groups" element={<AdminGroups />} />
                                    <Route path="projects" element={<AdminProjects />} />
                                    <Route path="logs" element={<AdminLogs />} />
                                </Route>
                            </Routes>
                        </Router>
                    </ProjectProvider>
                </ToastProvider>
            </ThemeProvider>
        </AuthProvider>
    );
}

export default App;
