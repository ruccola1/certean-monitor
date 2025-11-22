import { api } from './api';
import type { Product, Component } from '@/types/product';
import type { ApiResponse } from '@/types/api';

export const productService = {
  // Create products in bulk
  async createBulk(products: Partial<Product>[]): Promise<ApiResponse<Product[]>> {
    const { data } = await api.post('/api/products/bulk', { products });
    return data;
  },

  // Get all products for current client
  async getAll(): Promise<ApiResponse<Product[]>> {
    const { data } = await api.get('/api/products');
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
  async executeStep0(productId: string): Promise<ApiResponse<any>> {
    const { data } = await api.post(`/api/products/${productId}/execute-step0`);
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
  async executeStep1(productId: string): Promise<ApiResponse<any>> {
    const { data } = await api.post(`/api/products/${productId}/execute-step1`);
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
  async executeStep2(productId: string): Promise<ApiResponse<any>> {
    const { data } = await api.post(`/api/products/${productId}/execute-step2`);
    return data;
  },

  // Execute Step 3 (Generate Compliance Descriptions)
  async executeStep3(productId: string): Promise<ApiResponse<any>> {
    const { data } = await api.post(`/api/products/${productId}/execute-step3`);
    return data;
  },

  // Execute Step 4 (Track Compliance Updates)
  async executeStep4(productId: string): Promise<ApiResponse<any>> {
    const { data} = await api.post(`/api/products/${productId}/execute-step4`);
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
};


