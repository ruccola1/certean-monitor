import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthCallback() {
  const { isAuthenticated, isLoading, error } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Redirect to dashboard after successful authentication
        navigate('/dashboard', { replace: true });
      } else if (error) {
        console.error('Authentication error:', error);
        navigate('/login', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, error, navigate]);

  return (
    <div className="min-h-screen bg-dashboard-view-background flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block h-8 w-8 animate-spin border-4 border-[hsl(var(--dashboard-link-color))] border-t-transparent"></div>
        <p className="mt-4 text-sm text-[hsl(var(--dashboard-link-color))]">
          {error ? 'Authentication failed. Redirecting...' : 'Completing sign in...'}
        </p>
      </div>
    </div>
  );
}

