import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  Bell, 
  Settings,
  CreditCard,
  Users,
  FileText,
  Truck,
  Store
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Package, label: 'Products', href: '/products' },
  { icon: Truck, label: 'Suppliers', href: '/suppliers' },
  { icon: Store, label: 'Retailers', href: '/retailers' },
  { icon: Bell, label: 'Notifications', href: '/notifications' },
  { icon: FileText, label: 'Logged Events', href: '/logged-events' },
  { icon: CreditCard, label: 'Billing', href: '/billing' },
  { icon: Users, label: 'Team', href: '/team' },
  { icon: Settings, label: 'Settings', href: '/settings' },
];

interface SidebarProps {
  onMobileClose?: () => void;
}

export default function Sidebar({ onMobileClose }: SidebarProps) {
  const location = useLocation();

  return (
    <TooltipProvider>
      <aside className="h-screen w-16 bg-sidebar-gradient flex flex-col items-center py-4 shadow-subtle">
        {/* Logo */}
        <Link 
          to="/" 
          className="mb-8 h-8 w-8 flex items-center justify-center text-sidebar-primary hover:text-sidebar-primary/80 transition-colors"
          aria-label="Certean Monitor Home"
        >
          <svg 
            version="1.0" 
            xmlns="http://www.w3.org/2000/svg"
            width="32px" 
            height="35px" 
            viewBox="0 0 649.000000 717.000000"
            preserveAspectRatio="xMidYMid meet"
            fill="currentColor"
            stroke="none"
          >
            <g transform="translate(0.000000,717.000000) scale(0.100000,-0.100000)">
              <path d="M3160 7158 c-19 -5 -703 -366 -1519 -801 -1151 -614 -1493 -802
            -1528 -835 -24 -23 -56 -68 -71 -100 l-27 -57 0 -1740 0 -1740 31 -66 c20 -41
            47 -79 75 -103 58 -50 2956 -1681 3022 -1701 69 -20 120 -18 194 8 35 12 723
            393 1530 847 1131 636 1478 835 1513 870 72 71 95 127 95 235 0 108 -23 164
            -95 235 -35 34 -342 214 -1248 730 -661 376 -1202 687 -1202 690 0 3 537 314
            1193 690 776 446 1208 700 1238 728 143 131 135 368 -16 494 -40 33 -2936
            1587 -3000 1610 -55 19 -130 22 -185 6z m-252 -2428 l-3 -521 -932 533 c-513
            292 -930 534 -927 537 3 3 423 229 932 501 l927 495 3 -512 c1 -281 1 -746 0
            -1033z m1604 1047 c504 -270 917 -496 918 -501 1 -7 -1852 -1079 -1856 -1073
            -5 8 10 2067 15 2067 3 0 419 -222 923 -493z m-2882 -1607 c517 -294 939 -538
            940 -541 0 -6 -1850 -1072 -1882 -1084 -17 -7 -18 49 -18 1080 0 749 3 1086
            10 1083 6 -2 433 -244 950 -538z m2933 -1675 c499 -285 906 -519 905 -520 -4
            -3 -1848 -1039 -1875 -1054 l-23 -12 0 1077 0 1076 43 -25 c23 -13 450 -257
            950 -542z m-1667 -1582 c-7 -7 -1865 1041 -1863 1050 2 5 421 249 932 543
            l930 534 3 -1061 c1 -584 0 -1064 -2 -1066z"/>
            </g>
          </svg>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href || 
                           (item.href === '/dashboard' && location.pathname === '/');
            const Icon = item.icon;
            
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    to={item.href}
                    onClick={onMobileClose}
                    className={cn(
                      "flex items-center justify-center w-10 h-10 transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground"
                    )}
                    aria-label={item.label}
                  >
                    <Icon className="h-5 w-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">
                  <p>{item.label}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </aside>
    </TooltipProvider>
  );
}

