import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // 🔥 REQUIRED for cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Handle FormData correctly
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

export default api;
