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

  getByRole: async (role: string) => {
    const response = await api.get(`/users/?role=${role}`);
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
    return extractData(response.data);
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

  delete: async (id: number) => {
    await api.delete(`/placements/${id}/`);
  },
};

// Logs endpoints
export const logsApi = {
  getAll: async () => {
    const response = await api.get('/logs/');
    return extractData(response.data);
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
    return extractData(response.data);
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
    return extractData(response.data);
  },

  getMyReviews: async () => {
    const response = await api.get('/reviews/my_reviews/');
    return extractData(response.data);
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
    return extractData(response.data);
  },

  getById: async (id: number) => {
    const response = await api.get(`/evaluations/${id}/`);
    return response.data;
  },

  create: async (data: Record<string, unknown>) => {
    const response = await api.post('/evaluations/', data);
    return response.data;
  },

  getPendingPlacements: async () => {
    const response = await api.get('/evaluations/pending_placements/');
    return extractData(response.data);
  },

  getMyEvaluations: async () => {
    const response = await api.get('/evaluations/my_evaluations/');
    return extractData(response.data);
  },

  getStats: async () => {
    const response = await api.get('/evaluations/stats/');
    return response.data;
  },

  lock: async (id: number) => {
    const response = await api.post(`/evaluations/${id}/lock/`);
    return response.data;
  },

  getPlacementDetails: async (id: number) => {
    const response = await api.get(`/evaluations/${id}/placement_details/`);
    return response.data;
  },
};

// Evaluation Criteria endpoints
export const criteriaApi = {
  getAll: async () => {
    const response = await api.get('/evaluations/criteria/');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/evaluations/criteria/${id}/`);
    return response.data;
  },

  create: async (data: Record<string, unknown>) => {
    const response = await api.post('/evaluations/criteria/', data);
    return response.data;
  },

  update: async (id: number, data: Record<string, unknown>) => {
    const response = await api.patch(`/evaluations/criteria/${id}/`, data);
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/evaluations/criteria/${id}/`);
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

// Placement Documents endpoints
export const placementDocumentsApi = {
  getByPlacement: async (placementId: number) => {
    const response = await api.get(`/placements/documents/?placement=${placementId}`);
    return extractData(response.data);
  },

  upload: async (
    placementId: number,
    file: File,
    documentType: string,
    description?: string,
    onProgress?: (progress: number) => void
  ) => {
    const formData = new FormData();
    formData.append('placement', placementId.toString());
    formData.append('file', file);
    formData.append('document_type', documentType);
    if (description) {
      formData.append('description', description);
    }

    const response = await api.post('/placements/documents/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  delete: async (documentId: number) => {
    await api.delete(`/placements/documents/${documentId}/`);
  },
};

// Log Attachments endpoints
export const logAttachmentsApi = {
  getByLog: async (logId: number) => {
    const response = await api.get(`/logs/attachments/?log=${logId}`);
    return extractData(response.data);
  },

  upload: async (
    logId: number,
    file: File,
    caption?: string,
    onProgress?: (progress: number) => void
  ) => {
    const formData = new FormData();
    formData.append('log', logId.toString());
    formData.append('file', file);
    if (caption) {
      formData.append('caption', caption);
    }

    const response = await api.post('/logs/attachments/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });
    return response.data;
  },

  delete: async (attachmentId: number) => {
    await api.delete(`/logs/attachments/${attachmentId}/`);
  },
};

// Log Templates endpoints
export const logTemplatesApi = {
  getAll: async () => {
    const response = await api.get('/logs/templates/');
    return extractData(response.data);
  },

  getDefault: async () => {
    const response = await api.get('/logs/templates/default/');
    return response.data;
  },

  getById: async (id: number) => {
    const response = await api.get(`/logs/templates/${id}/`);
    return response.data;
  },
};

// Notifications endpoints
export const notificationsApi = {
  getAll: async () => {
    const response = await api.get('/notifications/');
    return extractData(response.data);
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread_count/');
    return response.data;
  },

  markRead: async (id: number) => {
    const response = await api.post(`/notifications/${id}/mark_read/`);
    return response.data;
  },

  markAllRead: async () => {
    const response = await api.post('/notifications/mark_all_read/');
    return response.data;
  },

  delete: async (id: number) => {
    await api.delete(`/notifications/${id}/`);
  },

  getPreferences: async () => {
    const response = await api.get('/notifications/preferences/');
    return response.data;
  },

  updatePreferences: async (data: Record<string, boolean>) => {
    const response = await api.patch('/notifications/preferences/', data);
    return response.data;
  },
};

// Helper to extract data from paginated or non-paginated responses
function extractData<T>(data: T | { results: T }): T {
  if (data && typeof data === 'object' && 'results' in data) {
    return data.results;
  }
  return data;
}

export default api;
