import axios, { type AxiosInstance } from 'axios';

// Billing API base URL - separate from main API
const BILLING_API_BASE_URL = import.meta.env.VITE_BILLING_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

class BillingService {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BILLING_API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });

    // Request interceptor for adding auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('api_token') || import.meta.env.VITE_CERTEAN_API_KEY;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          // Handle unauthorized - could redirect to login
          console.error('Unauthorized - check API key');
        }
        return Promise.reject(error);
      }
    );
  }

  async get<T>(url: string) {
    const response = await this.client.get<T>(url);
    return response.data;
  }

  async post<T>(url: string, data?: any) {
    const response = await this.client.post<T>(url, data);
    return response.data;
  }
}

export const billingService = new BillingService();

