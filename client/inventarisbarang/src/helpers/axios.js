// helpers/axios.js - Complete Fixed Version
import axios from 'axios';

// Determine API URL based on environment
const getApiUrl = () => {
  // Always use Railway URL for production
  if (import.meta.env.PROD) {
    return 'https://vueproject-production.up.railway.app';
  }
  // In development, use local server
  return import.meta.env.VITE_API_URL || 'http://localhost:3000';
};

console.log('🌐 API Base URL:', getApiUrl());
console.log('🏗️ Environment:', import.meta.env.MODE);
console.log('🔧 Production Mode:', import.meta.env.PROD);

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: getApiUrl(),
  withCredentials: true,
  timeout: 45000, // 45 seconds for Railway cold starts
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Function to get token from localStorage with error handling
const getAuthToken = () => {
  try {
    const token = localStorage.getItem('authToken');
    console.log('🔑 Retrieved token:', token ? 'Present' : 'Not found');
    return token;
  } catch (error) {
    console.warn('⚠️ Cannot access localStorage for token:', error);
    return null;
  }
};

// Function to set auth token with error handling
const setAuthToken = (token) => {
  try {
    if (token) {
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('authToken', token);
      console.log('✅ Auth token set and saved');
    } else {
      delete apiClient.defaults.headers.common['Authorization'];
      localStorage.removeItem('authToken');
      console.log('🗑️ Auth token cleared');
    }
  } catch (error) {
    console.warn('⚠️ Cannot access localStorage for token management:', error);
  }
};

// Initialize token if exists
const existingToken = getAuthToken();
if (existingToken) {
  setAuthToken(existingToken);
  console.log('🔄 Existing token loaded and applied');
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

    // Enhanced logging for debugging
    console.log('📋 Request details:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      withCredentials: config.withCredentials,
      hasToken: !!token,
      headers: {
        'Content-Type': config.headers['Content-Type'],
        'Authorization': config.headers.Authorization ? 'Bearer ***' : 'None',
        'Origin': config.headers.Origin,
        'User-Agent': config.headers['User-Agent']
      }
    });

    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor with enhanced error handling
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ ${response.status} ${response.request.responseURL}`);

    // If response contains token, save it
    if (response.data && response.data.token) {
      setAuthToken(response.data.token);
      console.log('🔑 New token received and saved');
    }

    // Log response data for debugging (only first few characters)
    if (response.data) {
      const dataStr = JSON.stringify(response.data);
      console.log('📥 Response data preview:', dataStr.substring(0, 100) + (dataStr.length > 100 ? '...' : ''));
    }

    return response;
  },
  (error) => {
    // Enhanced error logging
    const config = error.config;
    const response = error.response;

    console.log('❌ Request failed:', {
      url: config?.url,
      method: config?.method,
      status: response?.status,
      hasResponse: !!response,
      hasRequest: !!error.request,
      message: error.message,
      code: error.code
    });

    if (response) {
      // Server responded with error status
      console.error(`❌ ${response.status} ${config?.method?.toUpperCase()} ${config?.url}`);
      console.error('📥 Error response data:', response.data);

      // Handle specific status codes
      if (response.status === 401) {
        console.log('🔐 Authentication failed - clearing auth data');
        setAuthToken(null);

        try {
          localStorage.removeItem('user');
          console.log('🗑️ User data cleared from localStorage');
        } catch (e) {
          console.warn('⚠️ Cannot clear user data from localStorage:', e);
        }

        // Only redirect if not already on login page
        if (window.location.pathname !== '/login' && window.location.pathname !== '/') {
          console.log('🔄 Redirecting to login page');
          setTimeout(() => {
            window.location.href = '/login';
          }, 1000);
        }
      } else if (response.status === 404) {
        console.error('🔍 Endpoint not found - check API route');
      } else if (response.status >= 500) {
        console.error('🔥 Server error - backend issue');
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('🌐 Network/Connection Error Details:', {
        url: config?.url,
        method: config?.method,
        error: error.message,
        code: error.code,
        timeout: config?.timeout
      });

      if (error.code === 'NETWORK_ERROR') {
        console.error('🚨 Network error - possible causes:');
        console.error('   - CORS configuration issue');
        console.error('   - Server is down or unreachable');
        console.error('   - Network connectivity problem');
        console.error('   - Wrong API URL');
      } else if (error.code === 'ECONNABORTED') {
        console.error('⏱️ Request timeout - server might be cold starting');
      } else if (error.code === 'ERR_NAME_NOT_RESOLVED') {
        console.error('🌍 DNS resolution failed - check domain name');
      }
    } else {
      // Something happened in setting up the request
      console.error('❌ Request setup error:', error.message);
    }

    return Promise.reject(error);
  }
);

// Test connection function with detailed logging
export const testConnection = async () => {
  try {
    console.log('🔍 Testing server connection...');
    console.log('🎯 Target URL:', getApiUrl() + '/health');

    const response = await apiClient.get('/health');
    console.log('✅ Server connection successful:', response.data);
    console.log('📊 Connection stats:', {
      status: response.status,
      statusText: response.statusText,
      responseTime: response.headers['x-response-time'],
      server: response.headers.server
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('❌ Server connection failed:', error.message);
    console.error('🔍 Error details:', {
      code: error.code,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });

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
  console.log('🏥 Checking API health...');
  const result = await testConnection();
  console.log('🏥 API health check result:', result.success ? 'Healthy' : 'Unhealthy');
  return result.success;
};

// Debug function to test authentication
export const testAuth = async () => {
  try {
    console.log('🔐 Testing authentication...');
    const response = await apiClient.get('/api/users/me');
    console.log('✅ Authentication test successful:', response.data);
    return { success: true, user: response.data };
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    return { success: false, error: error.message };
  }
};

// Export utility functions
export { setAuthToken, getAuthToken, getApiUrl, testAuth };
export default apiClient;
