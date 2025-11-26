import axios, { type AxiosInstance, type AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://q57c4vz2em.eu-west-1.awsapprunner.com';

class ApiService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 120000, // 2 minutes for long-running operations
    });

    // Request interceptor for adding auth tokens
    this.client.interceptors.request.use(
      (config) => {
        // Use API key for backend authentication
        const apiKey = import.meta.env.VITE_CERTEAN_API_KEY;
        if (apiKey) {
          config.headers.Authorization = `Bearer ${apiKey}`;
        }
        
        // Add Auth0 token for user identification
        const auth0Token = this.getAuth0Token();
        if (auth0Token) {
          config.headers['X-User-Token'] = `Bearer ${auth0Token}`;
        }
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for handling errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          this.clearToken();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    localStorage.setItem('auth_token', token);
  }

  getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  clearToken() {
    localStorage.removeItem('auth_token');
  }

  setAuth0Token(token: string) {
    localStorage.setItem('auth0_token', token);
  }

  getAuth0Token(): string | null {
    return localStorage.getItem('auth0_token');
  }

  clearAuth0Token() {
    localStorage.removeItem('auth0_token');
  }

  getInstance(): AxiosInstance {
    return this.client;
  }

  // Convenience methods
  async get(url: string, config?: any) {
    return this.client.get(url, config);
  }

  async post(url: string, data?: any, config?: any) {
    return this.client.post(url, data, config);
  }

  async put(url: string, data?: any, config?: any) {
    return this.client.put(url, data, config);
  }

  async delete(url: string, config?: any) {
    return this.client.delete(url, config);
  }

  async patch(url: string, data?: any, config?: any) {
    return this.client.patch(url, data, config);
  }
}

export const apiService = new ApiService();
export const api = apiService.getInstance();



