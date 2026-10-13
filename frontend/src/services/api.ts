import axios from 'axios';
import { Issue, WorkOrder, Staff, Department, CitizenFeedback, NotificationItem, AnalyticsData, AuditLogItem, ResignationItem } from '../types';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('civiceye_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't auto-redirect on login check
      if (!window.location.pathname.includes('/login')) {
        localStorage.removeItem('civiceye_token');
        localStorage.removeItem('civiceye_user');
      }
    }
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (data: any) => api.post('/auth/login', data),
  register: (data: any) => api.post('/auth/register', data),
  createUser: (data: any) => api.post('/auth/create-user', data),
  me: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
};

export const issuesApi = {
  list: (params?: any) => api.get<Issue[]>('/issues', { params }),
  get: (id: number) => api.get<Issue>(`/issues/${id}`),
  create: (formData: FormData) => api.post<Issue>('/issues', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  verify: (id: number, data: any) => api.post<Issue>(`/issues/${id}/verify`, data),
  reopen: (id: number, data: { reason: string }) => api.post<Issue>(`/issues/${id}/reopen`, data),
};

export const aiApi = {
  analyze: (formData: FormData) => api.post('/ai/analyze', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
};

export const workOrdersApi = {
  list: (params?: any) => api.get<WorkOrder[]>('/work-orders', { params }),
  get: (id: number) => api.get<WorkOrder>(`/work-orders/${id}`),
  create: (data: any) => api.post<WorkOrder>('/work-orders', data),
  updateStatus: (id: number, data: { status: string; manager_notes?: string }) =>
    api.put<WorkOrder>(`/work-orders/${id}/status`, data),
  uploadEvidence: (id: number, formData: FormData) =>
    api.post(`/work-orders/${id}/evidence`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  verify: (id: number) => api.post(`/work-orders/${id}/verify`),
};

export const staffApi = {
  list: (params?: any) => api.get<Staff[]>('/staff', { params }),
  get: (id: number) => api.get<Staff>(`/staff/${id}`),
  create: (data: any) => api.post<Staff>('/staff', data),
  update: (id: number, data: any) => api.put<Staff>(`/staff/${id}`, data),
  adminAction: (id: number, data: any) => api.post(`/staff/${id}/admin-action`, data),
  getManagersDirectory: () => api.get<any[]>('/staff/managers/directory'),
};

export const resignationsApi = {
  list: (params?: any) => api.get<ResignationItem[]>('/resignations', { params }),
  submit: (staffId: number, data: any) => api.post(`/resignations/staff/${staffId}`, data),
  review: (id: number, data: { status: string; review_comments?: string }) =>
    api.put(`/resignations/${id}/review`, data),
};

export const feedbackApi = {
  submit: (data: any) => api.post<CitizenFeedback>('/feedback', data),
  list: (params?: any) => api.get<CitizenFeedback[]>('/feedback', { params }),
};

export const departmentsApi = {
  list: () => api.get<Department[]>('/departments'),
  create: (data: any) => api.post<Department>('/departments', data),
};

export const notificationsApi = {
  list: () => api.get<NotificationItem[]>('/notifications'),
  markRead: (id: number) => api.put(`/notifications/${id}/read`),
  readAll: () => api.put('/notifications/read-all'),
};

export const analyticsApi = {
  getDashboard: () => api.get<AnalyticsData>('/analytics/dashboard'),
};

export const auditApi = {
  list: (params?: any) => api.get<AuditLogItem[]>('/audit-logs', { params }),
};

export default api;
