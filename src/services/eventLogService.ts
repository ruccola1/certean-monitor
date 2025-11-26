import { api } from './api';
import type { ApiResponse } from '@/types/api';
import type { EventLogFilters, EventLogsResponse } from '@/types/eventLog';

// User info interface for event logging
interface UserInfo {
  user_id: string;
  email: string;
  name: string;
}

export const eventLogService = {
  // Log an event with user info from Auth0
  async logEvent(
    action: string,
    productId?: string,
    productName?: string,
    details?: Record<string, any>,
    clientId?: string | null,
    userInfo?: UserInfo
  ): Promise<ApiResponse<{ id: string; message: string }>> {
    // If no client assigned, skip event logging silently
    if (!clientId) {
      console.log('📋 No client assigned - skipping event log');
      return { success: true, data: { id: '', message: 'Skipped - no client assigned' } };
    }
    
    try {
      const url = `/api/event-logs?client_id=${encodeURIComponent(clientId)}`;
      
      console.log('📤 Sending event log:', { url, action, productId, productName, details, clientId, userInfo });
      
      const { data } = await api.post(url, {
        action,
        product_id: productId,
        product_name: productName,
        details: details || {},
        // Send user info directly in the request body
        user_id: userInfo?.user_id,
        user_email: userInfo?.email,
        user_name: userInfo?.name
      });
      
      console.log('✅ Event log response:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to log event:', error);
      console.error('Error details:', error);
      // Don't throw - event logging should not break the app
      return { success: false, error: 'Failed to log event' };
    }
  },

  // Get event logs with filters
  async getEventLogs(
    filters?: EventLogFilters,
    limit: number = 100,
    skip: number = 0,
    clientId?: string | null
  ): Promise<ApiResponse<EventLogsResponse>> {
    // If no clientId, return empty (new user without client assigned)
    if (!clientId) {
      return { success: true, data: { logs: [], total: 0, limit, skip } };
    }
    
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('limit', limit.toString());
    params.append('skip', skip.toString());
    
    if (filters?.action) params.append('action', filters.action);
    if (filters?.product_id) params.append('product_id', filters.product_id);
    if (filters?.user_id) params.append('user_id', filters.user_id);
    if (filters?.start_date) params.append('start_date', filters.start_date);
    if (filters?.end_date) params.append('end_date', filters.end_date);
    
    const { data } = await api.get(`/api/event-logs?${params.toString()}`);
    return data;
  },

  // Get available actions for filtering
  async getAvailableActions(): Promise<ApiResponse<string[]>> {
    const { data } = await api.get('/api/event-logs/actions');
    return data;
  },

  // Delete an event log
  async deleteEventLog(logId: string, clientId?: string | null): Promise<ApiResponse<{ message: string }>> {
    if (!clientId) {
      return { success: false, error: 'No client assigned' };
    }
    
    const url = `/api/event-logs/${logId}?client_id=${encodeURIComponent(clientId)}`;
    const { data } = await api.delete(url);
    return data;
  }
};

