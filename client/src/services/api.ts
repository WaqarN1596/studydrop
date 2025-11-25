import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
    baseURL: 'https://studydrop-api.onrender.com/api',
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401 errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().clearAuth();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Auth
export const authApi = {
    register: (data: any) => api.post('/auth/register', data),
    login: (data: any) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
};

// Users
export const userApi = {
    getUser: (id: number) => api.get(`/users/${id}`),
    updateUser: (id: number, data: any) => api.put(`/users/${id}`, data),
    getUserClasses: (id: number) => api.get(`/users/${id}/classes`),
    getUserUploads: (id: number) => api.get(`/users/${id}/uploads`),
};

// Colleges & Classes
export const collegeApi = {
    getColleges: () => api.get('/colleges'),
};

export const classApi = {
    getClasses: (collegeId?: number) => api.get('/classes', { params: { collegeId } }),
    getClass: (id: number) => api.get(`/classes/${id}`),
    createClass: (data: any) => api.post('/classes', data),
    joinClass: (data: any) => api.post('/classes/join', data),
    leaveClass: (data: any) => api.post('/classes/leave', data),
    getClassUploads: (id: number) => api.get(`/classes/${id}/uploads`),
    getClassDiscussions: (id: number) => api.get(`/classes/${id}/discussions`),
};

// Uploads
export const uploadApi = {
    uploadFile: (formData: FormData) => api.post('/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    }),
    getUpload: (id: number) => api.get(`/uploads/${id}`),
    deleteUpload: (id: number) => api.delete(`/uploads/${id}`),
    getUploadComments: (id: number) => api.get(`/uploads/${id}/comments`),
};

// Comments
export const commentApi = {
    addComment: (data: any) => api.post('/comments', data),
};

// Notifications
export const notificationApi = {
    getNotifications: () => api.get('/notifications'),
    markAsRead: (notificationId: number) => api.post('/notifications/read', { notificationId }),
    markAllAsRead: () => api.post('/notifications/read-all'),
};

// AI
export const aiApi = {
    extractTitle: (data: any) => api.post('/ai/extract-title', data),
    generateTags: (data: any) => api.post('/ai/tags', data),
    classify: (data: any) => api.post('/ai/classify', data),
    recommend: (fileId: number) => api.post(`/ai/recommend/${fileId}`),
    checkDuplicate: (data: any) => api.post('/ai/check-duplicate', data),
    search: (data: any) => api.post('/ai/search', data),
    moderate: (data: any) => api.post('/ai/moderate', data),
    summarize: (data: any) => api.post('/ai/summarize', data),
};

// Admin
export const adminApi = {
    getUploads: (params?: any) => api.get('/admin/uploads', { params }),
    deleteUpload: (id: number) => api.delete(`/admin/uploads/${id}`),
    getUsers: () => api.get('/admin/users'),
    getLogs: (params?: any) => api.get('/admin/logs', { params }),
};

export default api;
