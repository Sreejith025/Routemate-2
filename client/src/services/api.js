import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor to attach Clerk Bearer token to every API request
api.interceptors.request.use(
  async (config) => {
    try {
      if (window.Clerk && window.Clerk.session) {
        const token = await window.Clerk.session.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (error) {
      console.error("Error retrieving Clerk token for API request:", error);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// User APIs
export const syncUserApi = (userData) => api.post("/users/sync", userData);
export const getCurrentUserApi = () => api.get("/users/me");
export const updateProfileApi = (profileData) => api.put("/users/profile", profileData);
export const updatePreferencesApi = (prefData) => api.put("/user/preferences", prefData);
export const getAllUsersApi = () => api.get("/users");

// Ride APIs
export const getAvailableRidesApi = (params) => api.get("/rides", { params });
export const getRideByIdApi = (id) => api.get(`/rides/${id}`);
export const createRideApi = (rideData) => api.post("/rides", rideData);
export const bookRideApi = (id, bookingData) => api.post(`/rides/${id}/book`, bookingData);
export const confirmBookingApi = (id, actionData) => api.post(`/rides/${id}/confirm-booking`, actionData);
export const triggerSwitchApi = (id, switchData) => api.post(`/rides/${id}/trigger-switch`, switchData);
export const respondSwitchApi = (id, actionData) => api.post(`/rides/${id}/respond-switch`, actionData);
export const leaveSharedRideApi = (id, data) => api.post(`/rides/${id}/leave-shared-ride`, data);
export const getUserRideHistoryApi = () => api.get("/rides/history/all");

// Dashboard APIs
export const getDashboardStatsApi = () => api.get("/dashboard/stats");

// Location APIs
export const updateLocationApi = (locationData) => api.post("/location/update", locationData);
export const getRideLocationsApi = (rideId) => api.get(`/location/${rideId}`);
export const getDriverLocationApi = (driverId) => api.get(`/location/driver/${driverId}`);

// SafeRide AI APIs & Smart Exit
export const reportDiscomfortApi = (rideId, data) => api.post(`/rides/${rideId}/report-discomfort`, data);
export const safeLeaveSharedRideApi = (rideId, data) => api.post(`/rides/${rideId}/leave-shared-ride`, data);
export const triggerSOSApi = (rideId, data) => api.post(`/rides/${rideId}/sos`, data);
export const getComplaintsApi = () => api.get("/safe-ride/complaints");
export const getSOSAlertsApi = () => api.get("/safe-ride/sos-alerts");

// Smart Ride Exit & Live Taxi Alternatives APIs
export const getLiveTaxiAlternativesApi = (rideId, params) => api.get(`/rides/${rideId}/live-alternatives`, { params });
export const switchToCandidateTaxiApi = (rideId, data) => api.post(`/rides/${rideId}/switch-to-taxi`, data);
export const cancelSharedRideApi = (rideId, data) => api.post(`/rides/${rideId}/cancel-ride`, data);

// AI Optimization Engine APIs
export const runOptimizationApi = () => api.post("/optimization/run");
export const getOptimizationLogsApi = () => api.get("/optimization/logs");
export const getOptimizationStatsApi = () => api.get("/optimization/stats");

export default api;
