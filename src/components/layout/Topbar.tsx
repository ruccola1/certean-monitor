import { useAuth0 } from '@auth0/auth0-react';
import { Bell, User, Settings, LogOut } from 'lucide-react';
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

export default function Topbar() {
  const { user, logout } = useAuth0();

  // Use Auth0 user data if available, otherwise use demo data
  const clientName = "Supercase"; // This would come from user metadata in production
  const userName = user?.name || "Nicolas Zander";
  const userEmail = user?.email || "nicolas@supercase.se";
  const userInitials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase()
    : "NZ";
  const userPicture = user?.picture;
  const notificationCount = 0;

  const handleLogout = () => {
    logout({
      logoutParams: {
        returnTo: window.location.origin + '/login',
      },
    });
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between bg-background px-4 md:px-6 border-b border-gray-300">
      <div className="flex items-center gap-4">
        <h2 className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
          {clientName}
        </h2>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5 text-gray-600" />
            <span className="sr-only">Notifications</span>
          </Button>
          {notificationCount > 0 && (
            <Badge className="absolute -top-1 -right-1 px-1.5 py-0.5 text-xs bg-[hsl(var(--dashboard-link-color))] text-white">
              {notificationCount}
            </Badge>
          )}
        </div>
        
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

