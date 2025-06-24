// helpers/axios.js
import axios from 'axios';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://vueproject-production.up.railway.app',
  withCredentials: true,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Function to get token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('authToken');
};

// Function to set auth token
const setAuthToken = (token) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    localStorage.setItem('authToken', token);
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
    localStorage.removeItem('authToken');
  }
};

// Set token on initialization if exists
const existingToken = getAuthToken();
if (existingToken) {
  setAuthToken(existingToken);
}

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url);
    console.log('With credentials:', config.withCredentials);

    // Always try to include token if available
    const token = getAuthToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log headers for debugging
    console.log('Request headers:', config.headers);

    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log('Response received from:', response.config.url);
    console.log('Response status:', response.status);

    // If response contains token, save it
    if (response.data && response.data.token) {
      setAuthToken(response.data.token);
    }

    return response;
  },
  (error) => {
    console.error('Response error:', error);
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);

    // Handle different error scenarios
    if (error.response?.status === 401) {
      console.log('Authentication failed - clearing auth data');

      // Clear all auth data
      setAuthToken(null);
      localStorage.removeItem('user');

      // Only redirect if not already on login page
      if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
        console.log('Redirecting to login page');
        window.location.href = '/login';
      }
    }

    // Handle network errors
    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
      console.error('Network error or timeout');
      // You might want to show a toast notification here
    }

    return Promise.reject(error);
  }
);

// Export additional utility functions
export { setAuthToken, getAuthToken };
export default apiClient;
