import axios from 'axios';
import type {
  Organization,
  OrganizationCreate,
  OrganizationUpdate,
  OrganizationListResponse,
  Location,
  LocationCreate,
  LocationUpdate,
  LocationListResponse,
  CameraListResponse,
  Detection,
  DashboardStats,
  OrganizationStats,
  ProcessingStatus,
  HealthResponse,
} from '../types';

// Dynamically determine API base URL based on hostname
const getApiBaseUrl = () => {
  const hostname = window.location.hostname;

  // If accessing from admin domain, use production backend
  if (hostname.includes('admin-flowershow.kushaldulani.xyz')) {
    return 'https://flowershow.kushaldulani.xyz';
  }

  // Otherwise use localhost or env variable
  return (import.meta as any).env?.VITE_API_URL || 'http://localhost:8010';
};

const API_BASE_URL = getApiBaseUrl();
const API_V1_PREFIX = '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Helper to set API token for authenticated requests
export const setApiToken = (token: string | null) => {
  if (token) {
    api.defaults.headers.common['X-API-Token'] = token;
    console.log('API Token set:', token.substring(0, 10) + '...');
  } else {
    delete api.defaults.headers.common['X-API-Token'];
    console.log('API Token cleared');
  }
};

// Initialize token from localStorage on app start
if (typeof window !== 'undefined') {
  const storedToken = localStorage.getItem('api_token');
  if (storedToken) {
    setApiToken(storedToken);
  }
}

// Add axios interceptor to ensure token is always included
api.interceptors.request.use((config) => {
  // Always try to get token from localStorage for each request
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('api_token');
    console.log('Interceptor - checking token:', token ? token.substring(0, 10) + '...' : 'NO TOKEN FOUND');
    console.log('Interceptor - current headers:', config.headers);
    if (token) {
      config.headers['X-API-Token'] = token;
      console.log('Token added via interceptor:', token.substring(0, 10) + '...');
    } else {
      console.error('NO TOKEN IN LOCALSTORAGE!');
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Organization API
export const organizationApi = {
  getAll: (skip = 0, limit = 100) =>
    api.get<OrganizationListResponse>(`${API_V1_PREFIX}/organizations/`, { params: { skip, limit } }),

  getById: (id: number) =>
    api.get<Organization>(`${API_V1_PREFIX}/organizations/${id}`),

  search: (q: string, skip = 0, limit = 100) =>
    api.get<OrganizationListResponse>(`${API_V1_PREFIX}/organizations/search`, { params: { q, skip, limit } }),

  create: (data: OrganizationCreate) =>
    api.post<Organization>(`${API_V1_PREFIX}/organizations/`, data),

  update: (id: number, data: OrganizationUpdate) =>
    api.put<Organization>(`${API_V1_PREFIX}/organizations/${id}`, data),

  delete: (id: number) =>
    api.delete(`${API_V1_PREFIX}/organizations/${id}`),

  regenerateToken: (id: number) =>
    api.post<Organization>(`${API_V1_PREFIX}/organizations/${id}/regenerate-token`),
};

// Location API
export const locationApi = {
  getAll: (skip = 0, limit = 100, orgId?: number) =>
    api.get<LocationListResponse>(`${API_V1_PREFIX}/locations/`, {
      params: { skip, limit, org_id: orgId }
    }),

  getById: (id: number) =>
    api.get<Location>(`${API_V1_PREFIX}/locations/${id}`),

  getByOrganization: (orgId: number, skip = 0, limit = 100) =>
    api.get<LocationListResponse>(`${API_V1_PREFIX}/locations/organization/${orgId}`, {
      params: { skip, limit }
    }),

  create: (data: LocationCreate) =>
    api.post<Location>(`${API_V1_PREFIX}/locations/`, data),

  update: (id: number, data: LocationUpdate) =>
    api.put<Location>(`${API_V1_PREFIX}/locations/${id}`, data),

  delete: (id: number) =>
    api.delete(`${API_V1_PREFIX}/locations/${id}`),
};

// Camera API
export const cameraApi = {
  getAll: (skip = 0, limit = 100, orgId?: number) =>
    api.get<CameraListResponse>(`${API_V1_PREFIX}/cameras/`, {
      params: { skip, limit, org_id: orgId },
    }),

  getById: (id: number) =>
    api.get(`${API_V1_PREFIX}/cameras/${id}`),

  getByOrganization: (orgId: number, skip = 0, limit = 100) =>
    api.get<CameraListResponse>(`${API_V1_PREFIX}/cameras/organization/${orgId}`, {
      params: { skip, limit },
    }),
};

// ANPR Detection API
export const detectionApi = {
  getAll: (skip = 0, limit = 100, statusFilter?: ProcessingStatus, cameraId?: string, orgId?: number) => {
    const params: any = { skip, limit };
    if (statusFilter) params.status_filter = statusFilter;
    if (cameraId) params.camera_id = cameraId;
    if (orgId) params.organization_id = orgId;

    return api.get<Detection[]>(`${API_V1_PREFIX}/anpr/detections`, { params });
  },

  getById: (id: number) =>
    api.get<Detection>(`${API_V1_PREFIX}/anpr/detection/${id}`),

  getByClientId: (clientId: string) =>
    api.get<Detection>(`${API_V1_PREFIX}/anpr/detection/client/${clientId}`),

  searchByPlate: (plate: string, skip = 0, limit = 100) =>
    api.get<Detection[]>(`${API_V1_PREFIX}/anpr/detections`, {
      params: { skip, limit, plate },
    }),
};

// ANPR Upload API
export const anprApi = {
  upload: (formData: FormData) =>
    api.post(`${API_V1_PREFIX}/anpr/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
};

// Admin API (Super Admin only)
export const adminApi = {
  getAllOrganizations: (skip = 0, limit = 100) =>
    api.get<{ total_organizations: number; organizations: OrganizationStats[] }>(
      `${API_V1_PREFIX}/admin/organizations`,
      { params: { skip, limit } }
    ),

  getOrganizationStats: (orgId: number) =>
    api.get<OrganizationStats>(`${API_V1_PREFIX}/admin/organizations/${orgId}/stats`),

  getSystemStats: (dateFilter = 'today') =>
    api.get<DashboardStats>(`${API_V1_PREFIX}/admin/stats`, {
      params: { date_filter: dateFilter },
    }),
};

// Dashboard API (uses admin stats now)
export const dashboardApi = {
  getStats: () => adminApi.getSystemStats(),
};

// Health API
export const healthApi = {
  check: () =>
    api.get<HealthResponse>('/health'),
};

// Analytics API
export const analyticsApi = {
  hourly: (startDate?: string, endDate?: string, orgId?: number) =>
    api.get(`${API_V1_PREFIX}/analytics/hourly`, {
      params: { start_date: startDate, end_date: endDate, organization_id: orgId },
    }),

  daily: (days = 30, orgId?: number) =>
    api.get(`${API_V1_PREFIX}/analytics/daily`, {
      params: { days, organization_id: orgId },
    }),

  weekly: (weeks = 12, orgId?: number) =>
    api.get(`${API_V1_PREFIX}/analytics/weekly`, {
      params: { weeks, organization_id: orgId },
    }),

  monthly: (months = 12, orgId?: number) =>
    api.get(`${API_V1_PREFIX}/analytics/monthly`, {
      params: { months, organization_id: orgId },
    }),

  vehicleTypes: (startDate?: string, endDate?: string, orgId?: number) =>
    api.get(`${API_V1_PREFIX}/analytics/vehicle-types`, {
      params: { start_date: startDate, end_date: endDate, organization_id: orgId },
    }),

  cameraPerformance: (startDate?: string, endDate?: string, orgId?: number, limit = 10) =>
    api.get(`${API_V1_PREFIX}/analytics/camera-performance`, {
      params: { start_date: startDate, end_date: endDate, organization_id: orgId, limit },
    }),
};

export default api;
