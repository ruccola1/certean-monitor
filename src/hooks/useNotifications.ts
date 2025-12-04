import { useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'update_change';
  title: string;
  message: string;
  productId: string;
  productName: string;
  step: number;
  timestamp: string;
  read: boolean;
  metadata?: {
    newUpdatesCount?: number;
    changedUpdatesCount?: number;
    isUpdateChange?: boolean;
  };
}

const EMAIL_API_URL = import.meta.env.VITE_EMAIL_API_URL;

// Email notifications are optional - silently skip if not configured

export function useNotifications() {
  const { user } = useAuth0();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem('certean_notifications');
    if (stored) {
      try {
        setNotifications(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse notifications:', e);
      }
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('certean_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = async (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    // 1. Add to local UI immediately (instant feedback)
    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toISOString(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep only last 50
    
    // 2. Send email via email server (background, don't block UI)
    if (user?.email && EMAIL_API_URL) {
      try {
        // Call email notification API
        fetch(`${EMAIL_API_URL}/api/email/notification`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            to: [user.email], // Send to current user
            type: notification.type,
            title: notification.title,
            message: notification.message,
            productName: notification.productName,
            step: notification.step,
            priority: notification.type === 'error' ? 'high' : 'medium'
          })
        })
          .then(res => res.json())
          .then(result => {
            if (result.success) {
              console.log('✅ Email notification sent successfully');
            }
            // Silently skip email failures - in-app notifications still work
          })
          .catch(() => {
            // Silently skip - email notifications are optional, in-app notifications still work
          });
      } catch (error) {
        // Silently skip - email notifications are optional, in-app notifications still work
      }
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  };

  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
  };
}

