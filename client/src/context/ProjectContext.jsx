import { createContext, useContext, useState } from 'react';
import api from '../utils/api';

const ProjectContext = createContext();

export const useProject = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProject must be used within ProjectProvider');
    }
    return context;
};

export const ProjectProvider = ({ children }) => {
    const [projects, setProjects] = useState([]);
    const [currentProject, setCurrentProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(false);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/projects');
            setProjects(response.data.projects);
            return { success: true };
        } catch (error) {
            console.error('Fetch projects error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch projects',
            };
        } finally {
            setLoading(false);
        }
    };

    const fetchProject = async (projectId) => {
        try {
            setLoading(true);
            const response = await api.get(`/api/projects/${projectId}`);
            setCurrentProject(response.data.project);
            setTasks(response.data.tasks);
            return { success: true };
        } catch (error) {
            console.error('Fetch project error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch project',
            };
        } finally {
            setLoading(false);
        }
    };

    const createProject = async (projectData) => {
        try {
            const response = await api.post('/api/projects', projectData);
            setProjects([response.data.project, ...projects]);
            return { success: true, project: response.data.project };
        } catch (error) {
            console.error('Create project error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to create project',
            };
        }
    };

    const updateProject = async (projectId, projectData) => {
        try {
            const response = await api.put(`/api/projects/${projectId}`, projectData);
            setProjects(projects.map(p => p._id === projectId ? response.data.project : p));
            if (currentProject?._id === projectId) {
                setCurrentProject(response.data.project);
            }
            return { success: true };
        } catch (error) {
            console.error('Update project error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to update project',
            };
        }
    };

    const deleteProject = async (projectId) => {
        try {
            await api.delete(`/api/projects/${projectId}`);
            setProjects(projects.filter(p => p._id !== projectId));
            if (currentProject?._id === projectId) {
                setCurrentProject(null);
                setTasks([]);
            }
            return { success: true };
        } catch (error) {
            console.error('Delete project error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to delete project',
            };
        }
    };



    const fetchUserTasks = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/tasks'); // server filters by student
            setTasks(response.data.tasks);
            return { success: true };
        } catch (error) {
            console.error('Fetch user tasks error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to fetch tasks',
            };
        } finally {
            setLoading(false);
        }
    };

    const createTask = async (taskData) => {
        try {
            const response = await api.post('/api/tasks', taskData);
            setTasks([...tasks, response.data.task]);
            return { success: true, task: response.data.task };
        } catch (error) {
            console.error('Create task error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to create task',
            };
        }
    };

    const updateTask = async (taskId, taskData) => {
        try {
            const response = await api.put(`/api/tasks/${taskId}`, taskData);
            setTasks(tasks.map(t => t._id === taskId ? response.data.task : t));
            return {
                success: true,
                task: response.data.task,
                xpAwarded: response.data.xpAwarded,
                points: response.data.points
            };
        } catch (error) {
            console.error('Update task error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to update task',
            };
        }
    };

    const deleteTask = async (taskId) => {
        try {
            await api.delete(`/api/tasks/${taskId}`);
            setTasks(tasks.filter(t => t._id !== taskId));
            return { success: true };
        } catch (error) {
            console.error('Delete task error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to delete task',
            };
        }
    };

    const updateTaskStatus = async (taskId, newStatus) => {
        return updateTask(taskId, { status: newStatus });
    };

    const addEvidence = async (taskId, evidenceData) => {
        try {
            const response = await api.post(`/api/tasks/${taskId}/evidence`, evidenceData);
            setTasks(tasks.map(t => t._id === taskId ? response.data.task : t));
            return { success: true };
        } catch (error) {
            console.error('Add evidence error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to add evidence',
            };
        }
    };

    const linkGitHubRepo = async (taskId, repoUrl) => {
        try {
            const response = await api.post(`/api/tasks/${taskId}/github-repo`, { repoUrl });
            setTasks(tasks.map(t => t._id === taskId ? response.data.task : t));
            return { success: true };
        } catch (error) {
            console.error('Link GitHub repo error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to link GitHub repository',
            };
        }
    };

    const syncGitHubCommits = async (taskId) => {
        try {
            const response = await api.post(`/api/tasks/${taskId}/sync-commits`);
            setTasks(tasks.map(t => t._id === taskId ? { ...t, githubCommits: response.data.commits } : t));
            return { success: true, commits: response.data.commits };
        } catch (error) {
            console.error('Sync commits error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to sync commits',
            };
        }
    };

    const assignTemplate = async (groupId, templateId, deadline) => {
        try {
            setLoading(true);
            const response = await api.post('/api/projects/assign-template', {
                groupId,
                templateId,
                deadline
            });
            // Update local projects
            setProjects([response.data.project, ...projects]);
            return { success: true, project: response.data.project };
        } catch (error) {
            console.error('Assign template error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Failed to assign template',
            };
        } finally {
            setLoading(false);
        }
    };

    const value = {
        projects,
        currentProject,
        tasks,
        loading,
        fetchProjects,
        fetchProject,
        fetchUserTasks,
        createProject,
        updateProject,
        deleteProject,
        createTask,
        updateTask,
        deleteTask,
        updateTaskStatus,
        addEvidence,
        linkGitHubRepo,
        syncGitHubCommits,
        assignTemplate,
    };

    return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};
