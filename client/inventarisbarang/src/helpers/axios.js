// helpers/axios.js - Complete Fixed Version
import axios from 'axios';

// Determine API URL based on environment
const getApiUrl = () => {
  // Check if we're in production (Vercel)
  if (import.meta.env.PROD) {
    return import.meta.env.VITE_API_URL || 'https://vueproject-production.up.railway.app';
  }
  // In development, use local server or environment variable
  return import.meta.env.VITE_API_URL || 'http://localhost:8080';
};

console.log('API Base URL:', getApiUrl());
console.log('Environment:', import.meta.env.MODE);

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  timeout: 30000, // 30 seconds for Railway cold starts
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Function to get token from localStorage with error handling
const getAuthToken = () => {
  try {
    return localStorage.getItem('authToken');
  } catch (error) {
    console.warn('Cannot access localStorage for token:', error);
    return null;
  }
};

// Function to set auth token with error handling
const setAuthToken = (token) => {
  try {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('authToken', token);
      console.log('✅ Auth token set');
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
      localStorage.removeItem('authToken');
      console.log('🗑️ Auth token cleared');
    }
  } catch (error) {
    console.warn('Cannot access localStorage for token management:', error);
  }
};

// Initialize token if exists
const existingToken = getAuthToken();
if (existingToken) {
  setAuthToken(existingToken);
  console.log('🔄 Existing token loaded');
}

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    const fullUrl = config.baseURL + config.url;
    console.log(`📤 ${config.method?.toUpperCase()} ${fullUrl}`);

    // Always try to include token if available
    const token = getAuthToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Log important details for debugging
    console.log('Request details:', {
      url: fullUrl,
      method: config.method,
      withCredentials: config.withCredentials,
      hasToken: !!token,
      headers: {
        'Content-Type': config.headers['Content-Type'],
        'Authorization': config.headers.Authorization ? 'Bearer ***' : 'None'
      }
    });

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`);

    // If response contains token, save it
    if (response.data && response.data.token) {
      setAuthToken(response.data.token);
      console.log('🔑 New token received and saved');
    }

    return response;
  },
  (error) => {
    // Enhanced error logging
    const config = error.config;
    const response = error.response;

    if (response) {
      // Server responded with error status
      console.error(`❌ ${response.status} ${config?.method?.toUpperCase()} ${config?.url}`);
      console.error('Response data:', response.data);

      // Handle specific status codes
      if (response.status === 401) {
        console.log('🔐 Authentication failed - clearing auth data');
        setAuthToken(null);

        try {
          localStorage.removeItem('user');
        } catch (e) {
          console.warn('Cannot clear user data from localStorage:', e);
        }

        // Redirect to login if not already there
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          console.log('🔄 Redirecting to login page');
          window.location.href = '/login';
        }
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('❌ No response received:', {
        url: config?.url,
        method: config?.method,
        error: error.message,
        code: error.code
      });

      if (error.code === 'NETWORK_ERROR') {
        console.error('🌐 Network error - possible causes:');
        console.error('- CORS configuration issue');
        console.error('- Server is down');
        console.error('- Network connectivity problem');
      } else if (error.code === 'ECONNABORTED') {
        console.error('⏱️ Request timeout - server might be cold starting');
      }
    } else {
      // Something happened in setting up the request
      console.error('❌ Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Test connection function
export const testConnection = async () => {
  try {
    console.log('🔍 Testing server connection...');
    const response = await apiClient.get('/health');
    console.log('✅ Server connection successful:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Server connection failed:', error.message);
    return {
      success: false,
      error: error.message,
      details: {
        status: error.response?.status,
        data: error.response?.data,
        code: error.code
      }
    };
  }
};

// Utility function to check if API is reachable
export const checkApiHealth = async () => {
  const result = await testConnection();
  return result.success;
};

// Export utility functions
export { setAuthToken, getAuthToken, getApiUrl };
export default apiClient;
