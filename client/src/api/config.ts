import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

const adminToken = localStorage.getItem('adminToken') || 'admin-token-12345';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const adminApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'x-admin-token': adminToken,
  },
});

// Forms API
export const formsApi = {
  getAll: () => api.get('/forms'),
  getById: (id: string) => api.get(`/forms/${id}`),
};

// Admin API
export const adminFormsApi = {
  getAll: () => adminApi.get('/admin/forms'),
  getById: (id: string) => adminApi.get(`/admin/forms/${id}`),
  create: (data: any) => adminApi.post('/admin/forms', data),
  update: (id: string, data: any) => adminApi.put(`/admin/forms/${id}`, data),
  delete: (id: string) => adminApi.delete(`/admin/forms/${id}`),
  getSubmissions: (id: string, page = 1, limit = 10) =>
    adminApi.get(`/admin/forms/${id}/submissions?page=${page}&limit=${limit}`),
  exportSubmissions: (id: string) =>
    adminApi.get(`/admin/forms/${id}/submissions/export`, { responseType: 'blob' }),
};

// Submissions API
export const submissionsApi = {
  submit: (formId: string, answers: Record<string, any>) =>
    api.post('/submissions', { formId, answers }),
};

