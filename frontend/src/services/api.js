import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  signup: (data) => api.post('/auth/signup', data),
  login: (data) => api.post('/auth/login', data),
};

// Ride APIs
export const rideAPI = {
  create: (data) => api.post('/rides', data),
  accept: (id) => api.post(`/rides/${id}/accept`),
  arrived: (id) => api.post(`/rides/${id}/arrived`),
  start: (id) => api.post(`/rides/${id}/start`),
  complete: (id, data) => api.post(`/rides/${id}/complete`, data),
  cancel: (id, data) => api.post(`/rides/${id}/cancel`, data),
  getById: (id) => api.get(`/rides/${id}`),
  getHistory: () => api.get('/rides/history/me'),
};

// Driver APIs
export const driverAPI = {
  updateLocation: (data) => api.post('/driver/location', data),
  setStatus: (data) => api.post('/driver/status', data),
  uploadDocuments: (formData) => api.post('/driver/documents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getDocuments: () => api.get('/driver/documents'),
  getWarnings: () => api.get('/driver/warnings'),
};

// Admin APIs
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getRiders: () => api.get('/admin/riders'),
  getDrivers: () => api.get('/admin/drivers'),
  blockUser: (id) => api.post(`/admin/users/${id}/block`),
  unblockUser: (id) => api.post(`/admin/users/${id}/unblock`),
  verifyDriver: (id, data) => api.post(`/admin/drivers/${id}/verify`, data),
  getDriverDocs: (id) => api.get(`/admin/drivers/${id}/documents`),
  getFare: () => api.get('/admin/fare'),
  updateFare: (data) => api.post('/admin/fare', data),
  grantCredit: (data) => api.post('/admin/credits', data),
  addPoints: (id, data) => api.post(`/admin/drivers/${id}/points`, data),
  addWarning: (id, data) => api.post(`/admin/drivers/${id}/warnings`, data),
  createAnnouncement: (data) => api.post('/admin/announcements', data),
  getActiveRides: () => api.get('/admin/rides/active'),
  updateRideLimit: (data) => api.post('/admin/settings/ridelimit', data),
};

// Public APIs
export const publicAPI = {
  getAnnouncements: () => api.get('/announcements'),
};

export default api;
