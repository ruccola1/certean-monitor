import { api } from './api';
import type { Product, Component } from '@/types/product';
import type { ApiResponse } from '@/types/api';

export const productService = {
  // Create products in bulk
  async createBulk(products: Partial<Product>[], clientId?: string | null): Promise<ApiResponse<Product[]>> {
    if (!clientId) {
      return { success: false, error: 'No client assigned. Contact administrator to set up your workspace.' };
    }
    const url = `/api/products/bulk?client_id=${encodeURIComponent(clientId)}`;
    const { data } = await api.post(url, { products });
    return data;
  },

  // Get all products for current client
  async getAll(clientId?: string | null, minimal?: boolean): Promise<ApiResponse<Product[]>> {
    // If no clientId, return empty array (new user without client assigned)
    if (!clientId) {
      return { success: true, data: [] };
    }
    
    let url = `/api/products?client_id=${encodeURIComponent(clientId)}`;
    if (minimal) {
      url += '&minimal=true';
    }
    const { data } = await api.get(url);
    return data;
  },

  // Get single product with components
  async getById(id: string): Promise<ApiResponse<Product>> {
    const { data } = await api.get(`/api/products/${id}`);
    return data;
  },

  // Update product
  async update(id: string, updates: Partial<Product>): Promise<ApiResponse<Product>> {
    const { data } = await api.put(`/api/products/${id}`, updates);
    return data;
  },

  // Delete product
  async delete(id: string): Promise<ApiResponse<void>> {
    const { data } = await api.delete(`/api/products/${id}`);
    return data;
  },

  // Execute Step 0 (Product Decomposition)
  async executeStep0(productId: string, clientId?: string | null): Promise<ApiResponse<any>> {
    const url = `/api/products/${productId}/execute-step0`;
    // Send client_id in request body (more reliable than query params for POST)
    const body = clientId ? { client_id: clientId } : {};
    console.log('🔍 executeStep0 - URL:', url, 'Body:', body);
    const { data } = await api.post(url, body);
    return data;
  },

  // Alias for backward compatibility
  runStep0(productId: string): Promise<ApiResponse<any>> {
    return this.executeStep0(productId);
  },

  // Approve Step 0 results
  async approveStep0(
    productId: string,
    components: Component[]
  ): Promise<ApiResponse<void>> {
    const { data } = await api.put(`/api/products/${productId}/step0/review`, {
      components,
    });
    return data;
  },

  // Execute Step 1 (Compliance Assessment)
  async executeStep1(productId: string, clientId?: string | null): Promise<ApiResponse<any>> {
    let url = `/api/products/${productId}/execute-step1`;
    if (clientId) {
      url = `${url}?client_id=${encodeURIComponent(clientId)}`;
    }
    const { data } = await api.post(url);
    return data;
  },

  // Approve Step 1 results
  async approveStep1(
    productId: string,
    componentResults: Record<string, any>
  ): Promise<ApiResponse<void>> {
    const { data } = await api.put(`/api/products/${productId}/step1/review`, {
      componentResults,
    });
    return data;
  },

  // Execute Step 2 (Identify Compliance Elements)
  async executeStep2(productId: string, clientId?: string | null): Promise<ApiResponse<any>> {
    let url = `/api/products/${productId}/execute-step2`;
    if (clientId) {
      url = `${url}?client_id=${encodeURIComponent(clientId)}`;
    }
    const { data } = await api.post(url);
    return data;
  },

  // Execute Step 3 (Generate Compliance Descriptions)
  async executeStep3(productId: string, clientId?: string | null): Promise<ApiResponse<any>> {
    let url = `/api/products/${productId}/execute-step3`;
    if (clientId) {
      url = `${url}?client_id=${encodeURIComponent(clientId)}`;
    }
    const { data } = await api.post(url);
    return data;
  },

  // Execute Step 4 (Track Compliance Updates)
  async executeStep4(productId: string, clientId?: string | null): Promise<ApiResponse<any>> {
    let url = `/api/products/${productId}/execute-step4`;
    if (clientId) {
      url = `${url}?client_id=${encodeURIComponent(clientId)}`;
    }
    const { data } = await api.post(url);
    return data;
  },

  // Stop a running step
  async stopStep(productId: string, step: 0 | 1 | 2 | 3 | 4): Promise<ApiResponse<any>> {
    const { data } = await api.post(`/api/products/${productId}/stop-step${step}`);
    return data;
  },

  // Approve Step 2 results
  async approveStep2(
    productId: string,
    complianceElements: any[]
  ): Promise<ApiResponse<void>> {
    const { data } = await api.put(`/api/products/${productId}/step2/review`, {
      complianceElements,
    });
    return data;
  },

  // Get component tree
  async getComponents(productId: string): Promise<ApiResponse<Component[]>> {
    const { data } = await api.get(`/api/products/${productId}/components`);
    return data;
  },

  // Update component
  async updateComponent(
    componentId: string,
    updates: Partial<Component>
  ): Promise<ApiResponse<Component>> {
    const { data } = await api.put(`/api/components/${componentId}`, updates);
    return data;
  },

  // Add component
  async addComponent(component: Partial<Component>): Promise<ApiResponse<Component>> {
    const { data } = await api.post('/api/components', component);
    return data;
  },

  // Delete component
  async deleteComponent(componentId: string): Promise<ApiResponse<void>> {
    const { data } = await api.delete(`/api/components/${componentId}`);
    return data;
  },

  // Update Step 0 payload and results
  async updateStep0Payload(
    productId: string,
    step0Payload: any,
    step0Results: any,
    clientId?: string | null
  ): Promise<ApiResponse<any>> {
    let url = `/api/products/${productId}/update-step0-payload`;
    if (clientId) {
      url = `${url}?client_id=${encodeURIComponent(clientId)}`;
    }
    const { data } = await api.patch(url, {
      step0Payload,
      step0Results,
    });
    return data;
  },

  // Update Step 2 payload and results
  async updateStep2Payload(
    productId: string,
    step2Payload: any,
    step2Results: any,
    clientId?: string | null
  ): Promise<ApiResponse<any>> {
    let url = `/api/products/${productId}/update-step2-payload`;
    if (clientId) {
      url = `${url}?client_id=${encodeURIComponent(clientId)}`;
    }
    const { data } = await api.patch(url, {
      step2Payload,
      step2Results,
    });
    return data;
  },

  // Search compliance elements from shared database
  async searchComplianceElements(
    query: string,
    clientId?: string | null
  ): Promise<ApiResponse<any>> {
    let url = `/api/compliance-areas/compliance-elements/search?query=${encodeURIComponent(query)}`;
    if (clientId) {
      url = `${url}&client_id=${encodeURIComponent(clientId)}`;
    }
    const { data } = await api.get(url);
    return data;
  },

  // Get step details on-demand (lazy loading)
  async getStepDetails(productId: string, stepNumber: number, clientId?: string | null): Promise<ApiResponse<any>> {
    let url = `/api/products/${productId}/step/${stepNumber}`;
    if (clientId) {
      url += `?client_id=${encodeURIComponent(clientId)}`;
    }
    const { data } = await api.get(url);
    return data;
  },
};



