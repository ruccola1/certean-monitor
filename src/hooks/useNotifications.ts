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

const LOCAL_SERVER_URL = 'http://localhost:3001';

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
    
    // 2. Send email via local server (background, don't block UI)
    if (user?.email) {
      try {
        // Call local email server
        fetch(`${LOCAL_SERVER_URL}/api/email/notification`, {
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
            } else {
              console.warn('⚠️ Email notification failed:', result.error);
            }
          })
          .catch(error => {
            // Log but don't block - notifications still work locally
            console.warn('⚠️ Email server not available:', error.message);
          });
      } catch (error) {
        // Silently fail - UI notifications still work
        console.warn('⚠️ Failed to send email notification:', error);
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

