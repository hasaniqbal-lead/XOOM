import axios from "axios";

// Use relative path in production, full URL in development
const API_URL = import.meta.env.VITE_API_URL || (
  import.meta.env.MODE === 'production' ? '/api' : 'http://localhost:3000'
);

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  signup: (data: { name: string; phone: string; password: string; role: string }) =>
    api.post("/auth/signup", data),
  login: (data: { phone: string; password: string }) =>
    api.post("/auth/login", data),
  getProfile: () => api.get("/auth/profile"),
  switchRole: (role: string) => api.post("/auth/switch-role", { role }),
};

// Rides API
export const ridesAPI = {
  createRide: (data: {
    pickup_lat: number;
    pickup_lng: number;
    drop_lat: number;
    drop_lng: number;
    passengers: number;
    vehicle_type?: string;
    pickup_address?: string;
    drop_address?: string;
    guest_name?: string;
    guest_contact?: string;
  }) => api.post("/rides", data),
  getRides: (params?: { status?: string }) => api.get("/rides", { params }),
  getRideById: (id: string) => api.get(`/rides/${id}`),
  getActiveRide: () => api.get("/rides/active/me"),
  acceptRide: (id: string) => api.post(`/rides/${id}/accept`),
  startRide: (id: string) => api.post(`/rides/${id}/start`),
  completeRide: (id: string) => api.post(`/rides/${id}/complete`),
  cancelRide: (id: number | string) => api.post(`/rides/${id}/cancel`),
};

// Driver API
export const driverAPI = {
  getProfile: () => api.get("/driver/profile"),
  updateLocation: (data: { lat: number; lng: number; is_available: boolean }) =>
    api.put("/driver/location", data),
  getNearbyRides: (radius: number) => api.get(`/driver/nearby-rides?radius=${radius}`),
  getEarnings: (params?: { start_date?: string; end_date?: string }) =>
    api.get("/driver/earnings", { params }),
  uploadDocument: (formData: FormData) => api.post("/driver/documents", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  }),
};

// Reviews API
export const reviewsAPI = {
  createReview: (data: {
    ride_id: number;
    reviewee_id: number;
    rating: number;
    review_text?: string;
  }) => api.post("/reviews", data),
  getReviews: (userId: number) => api.get(`/reviews/${userId}`),
};

// Admin API
export const adminAPI = {
  getDashboard: () => api.get("/admin/dashboard"),
  getAllUsers: () => api.get("/admin/users"),
  verifyDriver: (driverId: number) => api.put(`/admin/drivers/${driverId}/verify`),
  updateFareSettings: (data: {
    base_fare: number;
    per_km: number;
    minimum_fare: number;
    surge_multiplier?: number;
  }) => api.put("/admin/fare-settings", data),
};

// Saved Locations API
export const locationsAPI = {
  getAll: () => api.get("/locations"),
  getDefaults: () => api.get("/locations/defaults"),
  create: (data: {
    label: string;
    address: string;
    lat: number;
    lng: number;
    icon?: string;
  }) => api.post("/locations", data),
  update: (id: number, data: {
    label?: string;
    address?: string;
    lat?: number;
    lng?: number;
    icon?: string;
  }) => api.put(`/locations/${id}`, data),
  delete: (id: number) => api.delete(`/locations/${id}`),
  setDefaultPickup: (id: number) => api.post(`/locations/${id}/default-pickup`),
  setDefaultDrop: (id: number) => api.post(`/locations/${id}/default-drop`),
};

export default api;
