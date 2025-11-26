import { useAuth0 } from '@auth0/auth0-react';
import { Bell, User, Settings, LogOut, CheckCircle, XCircle, Trash2, Menu, RefreshCw } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotificationContext } from '@/contexts/NotificationContext';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { getClientId } from '@/utils/clientId';
import { fetchClientInfo } from '@/services/clientService';

interface TopbarProps {
  onMobileMenuToggle?: () => void;
}

export default function Topbar({ onMobileMenuToggle }: TopbarProps) {
  const { user, logout } = useAuth0();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, clearAll } = useNotificationContext();
  const navigate = useNavigate();
  const [subscriptionTier, setSubscriptionTier] = useState<string>('');
  const [clientName, setClientName] = useState<string>('Your Company');

  const userName = user?.name || "Nicolas Zander";
  const userEmail = user?.email || "nicolas@supercase.se";
  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : "NZ";
  const userPicture = user?.picture;

  // Fetch client name from database
  useEffect(() => {
    const loadClientInfo = async () => {
      const clientInfo = await fetchClientInfo(user);
      if (clientInfo && clientInfo.client_name) {
        setClientName(clientInfo.client_name);
      }
    };

    loadClientInfo();
  }, [user]);

  // Fetch subscription tier
  useEffect(() => {
    const fetchBillingInfo = async () => {
      const clientId = getClientId(user);
      if (clientId) {
        try {
          const { billingService } = await import('../../services/billingService');
          const response = await billingService.get<{
            subscription?: { tier?: string };
          }>(`/api/stripe/billing/${clientId}`);
          
          if (response?.subscription?.tier) {
            // Capitalize tier name (e.g., "manager" -> "Manager")
            const tierName = response.subscription.tier;
            const capitalizedTier = tierName.charAt(0).toUpperCase() + tierName.slice(1);
            setSubscriptionTier(capitalizedTier);
          }
        } catch (error: any) {
          // Only log if it's not a 404 (expected when billing service isn't configured)
          if (error?.response?.status !== 404) {
            console.error('Failed to fetch billing info:', error);
          }
          // Default to Free tier if API fails
          setSubscriptionTier('Free');
        }
      }
    };

    fetchBillingInfo();
  }, [user]);

  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin + '/login',
      },
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-background px-4 md:px-6 border-b border-gray-300">
      <div className="flex items-center gap-2">
        {/* Hamburger Menu - Mobile Only */}
        <button
          onClick={onMobileMenuToggle}
          className="lg:hidden p-2 hover:bg-gray-100 transition-colors"
          aria-label="Toggle Menu"
        >
          <Menu className="h-6 w-6 text-[hsl(var(--dashboard-link-color))]" />
        </button>
        
        <h2 className="text-sm text-[hsl(var(--dashboard-link-color))]">
          <span className="font-bold">{clientName}</span>
          {subscriptionTier && (
            <>
              <span className="mx-2 font-normal text-gray-400">|</span>
              <span className="font-normal">{subscriptionTier} Plan</span>
            </>
          )}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="relative">
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="sr-only">Notifications</span>
              </Button>
              {unreadCount > 0 && (
                <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-[hsl(var(--dashboard-link-color))] text-white border-0">
                  {unreadCount}
                </Badge>
              )}
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-96 max-h-[500px] overflow-y-auto border-0">
            <DropdownMenuLabel>
              <div className="flex items-center justify-between">
                <span>Notifications</span>
                {notifications.length > 0 && (
                  <div className="flex gap-2">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="h-6 px-2 text-xs"
                      >
                        Mark all read
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAll}
                      className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                    >
                      Clear all
                    </Button>
                  </div>
                )}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">
                No notifications
              </div>
            ) : (
              <div className="max-h-[400px] overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-gray-200 transition-all ${
                      notification.read 
                        ? 'bg-gray-50 hover:bg-gray-100' 
                        : 'bg-blue-50 hover:bg-blue-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div 
                        className="flex items-start gap-2 flex-1 cursor-pointer"
                        onClick={() => {
                          if (!notification.read) {
                            markAsRead(notification.id);
                          }
                          navigate('/products');
                        }}
                      >
                        {notification.type === 'success' ? (
                          <CheckCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                            notification.read ? 'text-gray-400' : 'text-green-600'
                          }`} />
                        ) : notification.type === 'error' ? (
                          <XCircle className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                            notification.read ? 'text-gray-400' : 'text-red-600'
                          }`} />
                        ) : notification.type === 'update_change' ? (
                          <RefreshCw className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                            notification.read ? 'text-gray-400' : 'text-orange-500'
                          }`} />
                        ) : (
                          <Bell className={`h-4 w-4 mt-0.5 flex-shrink-0 ${
                            notification.read ? 'text-gray-400' : 'text-blue-600'
                          }`} />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className={`text-sm font-medium ${
                              notification.read ? 'text-gray-400 line-through' : 'text-[hsl(var(--dashboard-link-color))]'
                            }`}>
                              {notification.title}
                            </p>
                            {notification.type === 'update_change' && !notification.read && (
                              <Badge className="bg-orange-500 text-white border-0 text-[8px] px-1 py-0 h-4">
                                CHANGES
                              </Badge>
                            )}
                          </div>
                          <p className={`text-xs mt-1 ${
                            notification.read ? 'text-gray-400' : 'text-gray-600'
                          }`}>
                            {notification.message}
                          </p>
                          {notification.metadata?.newUpdatesCount !== undefined && notification.metadata.newUpdatesCount > 0 && (
                            <p className={`text-xs mt-0.5 ${
                              notification.read ? 'text-gray-300' : 'text-orange-600'
                            }`}>
                              {notification.metadata.newUpdatesCount} new update{notification.metadata.newUpdatesCount > 1 ? 's' : ''}
                              {notification.metadata.changedUpdatesCount && notification.metadata.changedUpdatesCount > 0 && 
                                `, ${notification.metadata.changedUpdatesCount} changed`}
                            </p>
                          )}
                          <p className={`text-xs mt-1 ${
                            notification.read ? 'text-gray-300' : 'text-gray-400'
                          }`}>
                            {new Date(notification.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className={`p-1.5 flex-shrink-0 transition-all hover:bg-red-100 group ${
                          notification.read ? 'text-gray-300' : 'text-gray-400'
                        }`}
                        aria-label="Delete notification"
                        title="Delete notification"
                      >
                        <Trash2 className="h-4 w-4 group-hover:text-red-600" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Separator orientation="vertical" className="h-6" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="h-8 w-8 cursor-pointer">
              <AvatarImage 
                src={userPicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=6b93c0&color=fff`} 
                alt={userName} 
              />
              <AvatarFallback>{userInitials}</AvatarFallback>
              <span className="sr-only">User Menu</span>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{userName}</p>
                <p className="text-xs leading-none text-muted-foreground">
                  {userEmail}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

