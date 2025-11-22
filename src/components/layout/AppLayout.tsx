import { useState, type ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

interface AppLayoutProps {
  children: ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      
      {/* Sidebar - hidden on mobile by default, shown when menu is open */}
      <div className={`fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 lg:translate-x-0 ${
        isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar onMobileClose={() => setIsMobileMenuOpen(false)} />
      </div>
      
      {/* Main content - no left margin on mobile, left margin on desktop for sidebar */}
      <div className="ml-0 lg:ml-16">
        <Topbar onMobileMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        <main className="min-h-screen">
          {children}
        </main>
      </div>
    </div>
  );
}

