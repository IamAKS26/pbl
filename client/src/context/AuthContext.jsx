import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

const AuthContext = createContext();

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAuthenticated, setIsAuthenticated] = useState(false);

    useEffect(() => {
        // Check if user is logged in on mount
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');

        if (token && savedUser) {
            setUser(JSON.parse(savedUser));
            setIsAuthenticated(true);
            // Optionally verify token with backend
            loadUser();
        } else {
            setLoading(false);
        }
    }, []);

    const loadUser = async () => {
        try {
            const response = await api.get('/api/auth/me');
            setUser(response.data.user);
            setIsAuthenticated(true);
            localStorage.setItem('user', JSON.stringify(response.data.user));
        } catch (error) {
            console.error('Load user error:', error);
            logout();
        } finally {
            setLoading(false);
        }
    };

    const updateUserStats = (newStats) => {
        if (!user) return;
        const updatedUser = { ...user, ...newStats };
        setUser(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser)); // Persist locally
    };

    const login = async (email, password) => {
        try {
            const response = await api.post('/api/auth/login', { email, password });
            const { token, user: userData } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            setIsAuthenticated(true);

            return { success: true };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed',
            };
        }
    };

    const register = async (name, email, password, role) => {
        try {
            const response = await api.post('/api/auth/register', {
                name,
                email,
                password,
                role,
            });
            const { token, user: userData } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(userData));

            setUser(userData);
            setIsAuthenticated(true);

            return { success: true };
        } catch (error) {
            console.error('Register error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed',
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
        setIsAuthenticated(false);
    };

    const value = {
        user,
        loading,
        isAuthenticated,
        login,
        register,
        logout,
        loadUser,
        updateUserStats,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
