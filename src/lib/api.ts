import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://api.tablenow.io';

const api = axios.create({
    baseURL: `${API_URL}/api`,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle auth errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export const authAPI = {
    register: (data: any) => api.post('/auth/register', data),
    login: (data: any) => api.post('/auth/login', data),
    verifyEmail: (token: string) => api.post('/auth/verify-email', { token }),
    getMe: () => api.get('/auth/me'),
};

export const dashboardAPI = {
    getStats: (params?: any) => api.get('/dashboard/stats', { params }),
    getCalls: (params?: any) => api.get('/dashboard/calls', { params }),
};

export const bookingsAPI = {
    getAll: (params?: any) => api.get('/bookings', { params }),
    getOne: (id: string) => api.get(`/bookings/${id}`),
    create: (data: any) => api.post('/bookings', data),
    update: (id: string, data: any) => api.put(`/bookings/${id}`, data),
    cancel: (id: string) => api.delete(`/bookings/${id}`),
};

export const settingsAPI = {
    get: () => api.get('/settings'),
    update: (data: any) => api.put('/settings', data),
    retryVapi: () => api.post('/settings/retry-vapi'),
};

export const calendarAPI = {
    getAuthUrl: () => api.get('/calendar/auth-url'),
    callback: (code: string) => api.post('/calendar/callback', { code }),
    disconnect: () => api.post('/calendar/disconnect'),
};

export const emailAPI = {
    getBCCEmails: (params?: any) => api.get('/email/bcc', { params }),
};

export const restaurantsAPI = {
    /** Met à jour la langue préférée du restaurant (FR/EN). */
    setLanguage: (language: 'fr' | 'en') =>
        api.patch('/restaurants/me/language', { language }),
};

export default api;
