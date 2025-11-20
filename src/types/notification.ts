export interface Notification {
  id: string;
  clientId: string;
  type: NotificationType;
  title: string;
  message: string;
  complianceElementId?: string;
  complianceUpdateId?: string;
  isRead: boolean;
  createdAt: string;
  priority: 'low' | 'medium' | 'high';
}

export type NotificationType =
  | 'regulation_updated'
  | 'standard_revised'
  | 'deadline_approaching'
  | 'new_certification'
  | 'system_notification';

