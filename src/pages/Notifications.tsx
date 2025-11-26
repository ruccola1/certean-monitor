import { useState, useEffect, useCallback } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import { getClientId } from '@/utils/clientId';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  getNotifications, 
  markNotificationRead, 
  markAllNotificationsRead,
  deleteNotification
} from '@/services/notificationService';
import type { NotificationResponse } from '@/services/notificationService';
import { 
  Loader2, 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Trash2, 
  CheckCheck,
  Package,
  Filter
} from 'lucide-react';
import { ProductFilterbar } from '@/components/products/ProductFilterbar';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'unread' | 'success' | 'error' | 'info';

export default function Notifications() {
  const { user } = useAuth0();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');

  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    
    const clientId = getClientId(user);
    if (!clientId) return;

    setLoading(true);
    try {
      const data = await getNotifications(clientId, {
        limit: 100,
        unreadOnly: filter === 'unread'
      });
      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [user, filter]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (notificationId: string) => {
    if (!user) return;
    const clientId = getClientId(user);
    if (!clientId) return;

    try {
      await markNotificationRead(notificationId, clientId);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllRead = async () => {
    if (!user) return;
    const clientId = getClientId(user);
    if (!clientId) return;

    try {
      await markAllNotificationsRead(clientId);
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleDelete = async (notificationId: string) => {
    if (!user) return;
    const clientId = getClientId(user);
    if (!clientId) return;

    try {
      await deleteNotification(notificationId, clientId);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'info':
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      case 'info':
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700';
      case 'medium':
        return 'bg-amber-100 text-amber-700';
      case 'low':
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  // Filter notifications
  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.is_read;
    return n.type === filter;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="flex flex-col min-h-screen bg-dashboard-view-background">
      {/* Filterbar */}
      <ProductFilterbar 
        activeFilters={new Set()} 
        onToggleFilter={() => {}} 
        onClearFilters={() => {}}
        dynamicProducts={[]}
      />

      <div className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-[hsl(var(--dashboard-link-color))]">Notifications</h1>
              <p className="text-sm text-gray-500 mt-1">
                {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                onClick={handleMarkAllRead}
                variant="outline"
                size="sm"
                className="bg-white border-0 hover:bg-gray-100 text-sm"
              >
                <CheckCheck className="w-4 h-4 mr-2" />
                Mark all read
              </Button>
            )}
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 flex-wrap">
            {(['all', 'unread', 'success', 'error', 'info'] as FilterType[]).map((f) => (
              <Button
                key={f}
                onClick={() => setFilter(f)}
                variant="outline"
                size="sm"
                className={cn(
                  "border-0 text-sm capitalize",
                  filter === f 
                    ? "bg-[hsl(var(--dashboard-link-color))] text-white hover:bg-[hsl(var(--dashboard-link-color))]/90" 
                    : "bg-white hover:bg-gray-100"
                )}
              >
                {f === 'all' && <Filter className="w-3.5 h-3.5 mr-1.5" />}
                {f === 'unread' && <Bell className="w-3.5 h-3.5 mr-1.5" />}
                {f === 'success' && <CheckCircle className="w-3.5 h-3.5 mr-1.5" />}
                {f === 'error' && <AlertCircle className="w-3.5 h-3.5 mr-1.5" />}
                {f === 'info' && <Info className="w-3.5 h-3.5 mr-1.5" />}
                {f}
                {f === 'unread' && unreadCount > 0 && (
                  <Badge className="ml-1.5 bg-red-500 text-white border-0 text-[10px] px-1.5">
                    {unreadCount}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Notifications List */}
          <Card className="bg-white border-0 shadow-subtle">
            <CardContent className="p-0">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <Loader2 className="w-8 h-8 animate-spin text-[hsl(var(--dashboard-link-color))]" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-16">
                  <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-[hsl(var(--dashboard-link-color))] mb-2">
                    {filter === 'all' ? 'No Notifications' : `No ${filter} notifications`}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {filter === 'all' 
                      ? 'You have no notifications yet.' 
                      : `You have no ${filter} notifications.`}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={cn(
                        "p-4 hover:bg-gray-50 transition-colors",
                        !notification.is_read && "bg-blue-50/50"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div className="flex-shrink-0 mt-0.5">
                          {getTypeIcon(notification.type)}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <h4 className={cn(
                                  "text-sm",
                                  !notification.is_read ? "font-bold" : "font-medium",
                                  "text-[hsl(var(--dashboard-link-color))]"
                                )}>
                                  {notification.title}
                                </h4>
                                <Badge className={cn("border-0 text-[10px] px-1.5", getTypeBadgeColor(notification.type))}>
                                  {notification.type}
                                </Badge>
                                <Badge className={cn("border-0 text-[10px] px-1.5", getPriorityBadgeColor(notification.priority))}>
                                  {notification.priority}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {notification.message}
                              </p>
                              <div className="flex items-center gap-3 text-xs text-gray-500">
                                <span className="font-mono">{formatDate(notification.created_at)}</span>
                                {notification.product_name && (
                                  <span className="flex items-center gap-1">
                                    <Package className="w-3 h-3" />
                                    {notification.product_name}
                                  </span>
                                )}
                                {notification.step !== undefined && (
                                  <span>Step {notification.step}</span>
                                )}
                                {notification.email_sent && (
                                  <Badge className="bg-green-50 text-green-600 border-0 text-[10px]">
                                    Email sent
                                  </Badge>
                                )}
                              </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!notification.is_read && (
                                <Button
                                  onClick={() => handleMarkRead(notification.id)}
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-gray-400 hover:text-green-600"
                                  title="Mark as read"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                              )}
                              <Button
                                onClick={() => handleDelete(notification.id)}
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-red-600"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          {notifications.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-white border-0 shadow-subtle">
                <CardContent className="p-4">
                  <div className="text-xs text-gray-500 mb-1">Total</div>
                  <div className="text-2xl font-bold font-mono text-[hsl(var(--dashboard-link-color))]">
                    {notifications.length}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-0 shadow-subtle">
                <CardContent className="p-4">
                  <div className="text-xs text-gray-500 mb-1">Unread</div>
                  <div className="text-2xl font-bold font-mono text-blue-600">
                    {unreadCount}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-0 shadow-subtle">
                <CardContent className="p-4">
                  <div className="text-xs text-gray-500 mb-1">Success</div>
                  <div className="text-2xl font-bold font-mono text-green-600">
                    {notifications.filter(n => n.type === 'success').length}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white border-0 shadow-subtle">
                <CardContent className="p-4">
                  <div className="text-xs text-gray-500 mb-1">Errors</div>
                  <div className="text-2xl font-bold font-mono text-red-600">
                    {notifications.filter(n => n.type === 'error').length}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

