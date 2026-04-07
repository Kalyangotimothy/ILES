import axios from 'axios';
import type { AuthTokens, LoginCredentials, RegisterCredentials } from '@/types';

const API_BASE_URL = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const tokens = localStorage.getItem('tokens');
  if (tokens) {
    const { access } = JSON.parse(tokens) as AuthTokens;
    config.headers.Authorization = `Bearer ${access}`;
  }
  return config;
});

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const tokens = localStorage.getItem('tokens');
        if (tokens) {
          const { refresh } = JSON.parse(tokens) as AuthTokens;
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh,
          });

          const newTokens: AuthTokens = response.data;
          localStorage.setItem('tokens', JSON.stringify(newTokens));

          originalRequest.headers.Authorization = `Bearer ${newTokens.access}`;
          return api(originalRequest);
        }
      } catch {
        localStorage.removeItem('tokens');
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthTokens> => {
    const response = await api.post('/auth/login/', credentials);
    return response.data;
  },

  register: async (credentials: RegisterCredentials) => {
    const response = await api.post('/auth/register/', credentials);
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    const response = await api.post('/auth/refresh/', { refresh: refreshToken });
    return response.data;
  },
};

// Users endpoints
export const usersApi = {
  getMe: async () => {
    const response = await api.get('/users/me/');
    return response.data;
  },

  getAll: async () => {
    const response = await api.get('/users/');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/users/${id}/`);
    return response.data;
  },
};

// Placements endpoints
export const placementsApi = {
  getAll: async () => {
    const response = await api.get('/placements/');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/placements/${id}/`);
    return response.data;
  },

  getActive: async () => {
    const response = await api.get('/placements/active/');
    return response.data;
  },

  create: async (data: Record<string, unknown>) => {
    const response = await api.post('/placements/', data);
    return response.data;
  },

  update: async (id: number, data: Record<string, unknown>) => {
    const response = await api.patch(`/placements/${id}/`, data);
    return response.data;
  },
};

// Logs endpoints
export const logsApi = {
  getAll: async () => {
    const response = await api.get('/logs/');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/logs/${id}/`);
    return response.data;
  },

  create: async (data: Record<string, unknown>) => {
    const response = await api.post('/logs/', data);
    return response.data;
  },

  update: async (id: number, data: Record<string, unknown>) => {
    const response = await api.patch(`/logs/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/logs/${id}/`);
  },

  submit: async (id: number) => {
    const response = await api.post(`/logs/${id}/submit/`);
    return response.data;
  },
};

// Reviews endpoints
export const reviewsApi = {
  getAll: async () => {
    const response = await api.get('/reviews/');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/reviews/${id}/`);
    return response.data;
  },

  create: async (data: Record<string, unknown>) => {
    const response = await api.post('/reviews/', data);
    return response.data;
  },

  getPendingLogs: async () => {
    const response = await api.get('/reviews/pending_logs/');
    return response.data;
  },

  getMyReviews: async () => {
    const response = await api.get('/reviews/my_reviews/');
    return response.data;
  },

  getStats: async () => {
    const response = await api.get('/reviews/stats/');
    return response.data;
  },
};

// Evaluations endpoints
export const evaluationsApi = {
  getAll: async () => {
    const response = await api.get('/evaluations/');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/evaluations/${id}/`);
    return response.data;
  },

  create: async (data: Record<string, unknown>) => {
    const response = await api.post('/evaluations/', data);
    return response.data;
  },
};

// Dashboard endpoints
export const dashboardApi = {
  getStudentDashboard: async () => {
    const response = await api.get('/dashboard/student/');
    return response.data;
  },

  getSupervisorDashboard: async () => {
    const response = await api.get('/dashboard/supervisor/');
    return response.data;
  },

  getEvaluatorDashboard: async () => {
    const response = await api.get('/dashboard/evaluator/');
    return response.data;
  },

  getAdminDashboard: async () => {
    const response = await api.get('/dashboard/admin/');
    return response.data;
  },
};

export default api;
