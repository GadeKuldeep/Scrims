import axios from 'axios';

// Dynamically determine the API base URL for Local, Render, and Vercel environments
function getBaseUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (!envUrl) return '/api';

  // If full URL provided (e.g., https://scrims-backend.onrender.com or https://scrims-backend.onrender.com/api)
  if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
    const cleanUrl = envUrl.replace(/\/+$/, '');
    return cleanUrl.endsWith('/api') ? cleanUrl : `${cleanUrl}/api`;
  }

  return envUrl;
}

const api = axios.create({
  baseURL: getBaseUrl(),
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('scrims_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for session expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const isAuthRoute = error.config.url.includes('/auth/login') || error.config.url.includes('/auth/register');
      if (!isAuthRoute) {
        localStorage.removeItem('scrims_token');
        localStorage.removeItem('scrims_user');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
