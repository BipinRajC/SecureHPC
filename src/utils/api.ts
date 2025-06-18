import axios from 'axios';

// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:3001/api',
  timeout: 15000, // Increased timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor for authentication if needed
api.interceptors.request.use(
  (config) => {
    // Log all API requests in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`API Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`, config.data || '');
    }
    return config;
  },
  (error) => {
    console.error('API Request Error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Log successful responses in development
    if (process.env.NODE_ENV !== 'production') {
      console.log(`API Response [${response.status}]: ${response.config.method?.toUpperCase()} ${response.config.url}`, 
        response.data ? '✓' : '');
    }
    return response;
  },
  async (error) => {
    // Enhanced error logging
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error(`API Error [${error.response.status}]:`, error.response.data || error.message);
      console.error('Error URL:', error.config.baseURL + error.config.url);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('API No Response Error:', error.request);
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('API Config Error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default api; 