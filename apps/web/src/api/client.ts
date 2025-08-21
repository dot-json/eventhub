import axios from "axios";
import type { LoginCredentials, RegisterData } from "../types/user";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:3001/api";

// Create axios instance
export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Auth API calls
export const authApi = {
  login: (credentials: LoginCredentials) =>
    api.post("/auth/login", credentials),

  register: (data: RegisterData) => api.post("/auth/register", data),

  refresh: (refreshToken: string) =>
    api.post("/auth/refresh", { refresh_token: refreshToken }),
};

// Users API calls
export const usersApi = {
  updateProfile: (id: number, updates: any) =>
    api.patch(`/users/${id}`, updates),

  updatePassword: (
    id: number,
    passwordData: { current_password: string; new_password: string },
  ) => api.put(`/users/${id}/password`, passwordData),
};

// Event API calls
export const eventsApi = {
  createEvent: (eventData: any) => api.post("/events", eventData),

  getEvent: (id: number) => api.get(`/events/${id}`),

  updateEvent: (id: number, updates: any) =>
    api.patch(`/events/${id}`, updates),

  deleteEvent: (id: number) => api.delete(`/events/${id}`),
};
