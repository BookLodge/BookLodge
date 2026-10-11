import axios from 'axios';

let rawBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

// Normalize: ensure baseURL ends with /api if a full HTTP/HTTPS URL is provided
if (rawBaseUrl.startsWith('http') && !rawBaseUrl.endsWith('/api') && !rawBaseUrl.endsWith('/api/')) {
  rawBaseUrl = `${rawBaseUrl.replace(/\/+$/, '')}/api`;
}

const api = axios.create({
  baseURL: rawBaseUrl,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT token if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = 'Bearer ' + token;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Extract response data and normalize errors per API spec
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }

    const providerInfo = error.response?.data?.data?.provider;
    let customMessage = error.response?.data?.message;

    if (providerInfo?.description) {
      customMessage = customMessage + ': ' + providerInfo.description;
    }

    if (!customMessage) {
      customMessage =
        (error.response?.status === 404 ? 'Resource not found' : null) ||
        (error.response?.status === 401 ? 'Unauthorized. Please log in.' : null) ||
        (error.response?.status === 403 ? 'Forbidden. Insufficient permissions.' : null) ||
        (error.response?.status >= 500 ? 'Server error. Please try again later.' : null) ||
        'Unable to connect to server. Please check your connection.';
    }

    const err = new Error(customMessage);
    err.provider = providerInfo;
    err.status = error.response?.status;
    err.ambiguous = error.response?.data?.data?.ambiguous;
    return Promise.reject(err);
  }
);

export default api;
