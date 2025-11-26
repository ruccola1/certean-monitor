import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '@/services/api';

export default function AuthCallback() {
  const { isAuthenticated, isLoading, error, getAccessTokenSilently } = useAuth0();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated) {
        // Get Auth0 access token and store it for user identification
        getAccessTokenSilently()
          .then((token) => {
            console.log('✅ Got Auth0 access token, storing for user identification');
            apiService.setAuth0Token(token);
          })
          .catch((err) => {
            console.warn('⚠️ Could not get Auth0 token:', err);
          })
          .finally(() => {
            // Redirect to dashboard after successful authentication
            navigate('/dashboard', { replace: true });
          });
      } else if (error) {
        console.error('Authentication error:', error);
        navigate('/login', { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, error, navigate, getAccessTokenSilently]);

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

