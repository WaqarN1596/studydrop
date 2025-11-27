import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'https://studydrop-api.onrender.com/api',
});

// Simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Cache GET requests
api.interceptors.request.use((config) => {
    if (config.method === 'get') {
        const cacheKey = `${config.url}${JSON.stringify(config.params || {})}`;
        const cached = cache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            // Return cached data
            config.adapter = () => {
                return Promise.resolve({
                    data: cached.data,
                    status: 200,
                    statusText: 'OK (cached)',
                    headers: {},
                    config,
                });
            };
        }
    }
    return config;
});

// Store successful GET responses in cache
api.interceptors.response.use(
    (response) => {
        if (response.config.method === 'get' && response.status === 200) {
            const cacheKey = `${response.config.url}${JSON.stringify(response.config.params || {})}`;
            cache.set(cacheKey, {
                data: response.data,
                timestamp: Date.now(),
            });
        }
        return response;
    },
    (error) => {
        if (error.response?.status === 401) {
            useAuthStore.getState().clearAuth();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

// Clear cache on mutations
const clearCache = () => cache.clear();

// Auth
export const authApi = {
    register: (data: any) => api.post('/auth/register', data),
    login: (data: any) => api.post('/auth/login', data),
    getMe: () => api.get('/auth/me'),
};

// Users
export const userApi = {
    getUser: (id: number) => api.get(`/users/${id}`),
    updateUser: (id: number, data: any) => {
        clearCache();
        return api.put(`/users/${id}`, data);
    },
    getUserClasses: (id: number) => api.get(`/users/${id}/classes`),
    getUserUploads: (id: number) => api.get(`/users/${id}/uploads`),
};

// Colleges & Classes
export const collegeApi = {
    getColleges: () => api.get('/colleges'),
    getMajors: (collegeId: number) => api.get(`/colleges/${collegeId}/majors`),
};

export const classApi = {
    getClasses: (collegeId?: number) => api.get('/classes', { params: { collegeId } }),
    getClass: (id: number) => api.get(`/classes/${id}`),
    createClass: (data: any) => {
        clearCache();
        return api.post('/classes', data);
    },
    joinClass: (data: any) => {
        clearCache();
        return api.post('/classes/join', data);
    },
    leaveClass: (data: any) => {
        clearCache();
        return api.post('/classes/leave', data);
    },
    getClassUploads: (id: number) => api.get(`/classes/${id}/uploads`),
    getClassDiscussions: (id: number) => api.get(`/classes/${id}/discussions`),
};

// Uploads
export const uploadApi = {
    uploadFile: (formData: FormData) => {
        clearCache();
        return api.post('/uploads', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
    },
    getUpload: (id: number) => api.get(`/uploads/${id}`),
    deleteUpload: (id: number) => {
        clearCache();
        return api.delete(`/uploads/${id}`);
    },
    getUploadComments: (id: number) => api.get(`/uploads/${id}/comments`),
};

// For DocumentViewer component
export const uploadsApi = {
    getUploadById: (id: number) => api.get(`/uploads/${id}`),
};

// Comments
export const commentApi = {
    addComment: (data: any) => {
        clearCache();
        return api.post('/comments', data);
    },
};

// For DocumentViewer component  
export const commentsApi = {
    getUploadComments: (uploadId: number) => api.get(`/comments/upload/${uploadId}`),
    createComment: (uploadId: number, content: string) => {
        clearCache();
        return api.post('/comments', { uploadId, content });
    },
    deleteComment: (commentId: number) => {
        clearCache();
        return api.delete(`/comments/${commentId}`);
    },
};

// Flashcards
export const flashcardsApi = {
    generate: (uploadId: number, count = 15) => {
        clearCache();
        return api.post('/ai/generate-flashcards', { uploadId, count });
    },
    getByUpload: (uploadId: number) => api.get(`/flashcards/upload/${uploadId}`),
    getSet: (setId: number) => api.get(`/flashcards/set/${setId}`),
    getByUser: (userId: number) => api.get(`/flashcards/user/${userId}`),
    deleteSet: (setId: number) => {
        clearCache();
        return api.delete(`/flashcards/set/${setId}`);
    },
};

// Notifications
export const notificationApi = {
    getNotifications: () => api.get('/notifications'),
    markAsRead: (notificationId: number) => api.post('/notifications/read', { notificationId }),
    markAllAsRead: () => api.post('/notifications/read-all'),
};

// AI
export const aiApi = {
    extractTitle: (formData: FormData) => api.post('/ai/extract-title', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    generateTags: (formData: FormData) => api.post('/ai/generate-tags', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    classify: (formData: FormData) => api.post('/ai/classify', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    summarize: (formData: FormData) => api.post('/ai/summarize', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    checkDuplicate: (data: { filename: string; classId: number }) => api.post('/ai/check-duplicate', data),
    recommend: (fileId: number) => api.post(`/ai/recommend/${fileId}`),
    search: (query: string) => api.post('/ai/search', { query }),
    chat: (uploadId: number, message: string, messages: any[]) => api.post('/ai/chat', { uploadId, message, messages }),
    moderate: (data: any) => api.post('/ai/moderate', data),
    getModelInfo: () => api.get('/ai/model-info'),
};

// Downloads
export const downloadApi = {
    trackDownload: (uploadId: number) => api.post('/downloads', { uploadId }),
    getDownloadHistory: () => api.get('/downloads'),
};

// Admin
export const adminApi = {
    getUploads: (params?: any) => api.get('/admin/uploads', { params }),
    deleteUpload: (id: number) => {
        clearCache();
        return api.delete(`/admin/uploads/${id}`);
    },
    getUsers: () => api.get('/admin/users'),
    getLogs: (params?: any) => api.get('/admin/logs', { params }),
};

export default api;
