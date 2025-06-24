// helpers/axios.js - FIXED VERSION
import axios from 'axios';

// Determine API URL based on environment
const getApiUrl = () => {
  // In production, use environment variable or default to Railway
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://vueproject-production.up.railway.app';
  }
  // In development, use local server
  return import.meta.env.VITE_API_URL || 'http://localhost:8080';
};

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  timeout: 30000, // Increased timeout for Railway cold starts
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Function to get token from localStorage
const getAuthToken = () => {
  try {
    return localStorage.getItem('authToken');
  } catch (error) {
    console.warn('Cannot access localStorage:', error);
    return null;
  }
};

// Function to set auth token
const setAuthToken = (token) => {
  try {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('authToken', token);
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
      localStorage.removeItem('authToken');
    }
  } catch (error) {
    console.warn('Cannot access localStorage:', error);
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
    console.log('Making request to:', config.baseURL + config.url);
    console.log('With credentials:', config.withCredentials);

    // Always try to include token if available
    const token = getAuthToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Ensure proper headers for CORS
    config.headers['Accept'] = 'application/json';
    config.headers['Content-Type'] = 'application/json';

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
    console.log('✅ Response received from:', response.config.url);
    console.log('Response status:', response.status);

    // If response contains token, save it
    if (response.data && response.data.token) {
      setAuthToken(response.data.token);
    }

    return response;
  },
  (error) => {
    console.error('❌ Response error:', error.message);

    if (error.response) {
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
    } else if (error.request) {
      console.error('No response received. Request:', error.request);
      console.error('Possible causes: CORS, network, or server down');
    } else {
      console.error('Request setup error:', error.message);
    }

    // Handle different error scenarios
    if (error.response?.status === 401) {
      console.log('Authentication failed - clearing auth data');
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
      console.error('Network error or timeout - server might be cold starting');
    }

    return Promise.reject(error);
  }
);

// Test connection function
export const testConnection = async () => {
  try {
    const response = await apiClient.get('/health');
    console.log('✅ Server connection test successful:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Server connection test failed:', error.message);
    return false;
  }
};

// Export additional utility functions
export { setAuthToken, getAuthToken, getApiUrl };
export default apiClient;
