import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  headers: { 'Content-Type': 'application/json' }
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
    localStorage.setItem('shr-token', token);
  } else {
    delete api.defaults.headers.common.Authorization;
    localStorage.removeItem('shr-token');
  }
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      setAuthToken(null);
      localStorage.removeItem('shr-user');
      if (window.location.pathname !== '/login') {
        window.dispatchEvent(new Event('arogya:unauthorized'));
      }
    }
    return Promise.reject(error);
  }
);

export default api;
