import { apiService } from './api';

export interface CreateNotificationRequest {
  client_id: string;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  product_id?: string;
  product_name?: string;
  step?: number;
  priority?: 'low' | 'medium' | 'high';
  metadata?: Record<string, any>;
  send_email?: boolean;
}

export interface NotificationResponse {
  id: string;
  client_id: string;
  type: string;
  title: string;
  message: string;
  product_id?: string;
  product_name?: string;
  step?: number;
  priority: string;
  is_read: boolean;
  created_at: string;
  metadata?: Record<string, any>;
  email_sent?: boolean;
  emails_count?: number;
  email_error?: string;
}

/**
 * Create a notification and optionally send emails to all client users
 */
export async function createNotification(
  notification: CreateNotificationRequest
): Promise<NotificationResponse> {
  const response = await apiService.post('/api/notifications/', notification);
  return response.data;
}

/**
 * Get notifications for a client
 */
export async function getNotifications(
  clientId: string,
  options?: {
    limit?: number;
    skip?: number;
    unreadOnly?: boolean;
  }
): Promise<NotificationResponse[]> {
  const params = new URLSearchParams({
    client_id: clientId,
    limit: String(options?.limit || 50),
    skip: String(options?.skip || 0),
    ...(options?.unreadOnly && { unread_only: 'true' }),
  });
  
  const response = await apiService.get(`/api/notifications/?${params.toString()}`);
  return response.data;
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(
  notificationId: string,
  clientId: string
): Promise<void> {
  await apiService.patch(`/api/notifications/${notificationId}/read`, null, {
    params: { client_id: clientId }
  });
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsRead(
  clientId: string
): Promise<void> {
  await apiService.patch('/api/notifications/read-all', null, {
    params: { client_id: clientId }
  });
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: string,
  clientId: string
): Promise<void> {
  await apiService.delete(`/api/notifications/${notificationId}`, {
    params: { client_id: clientId }
  });
}

