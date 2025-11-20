import { useAuth0 } from '@auth0/auth0-react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LogIn, Shield, Bell, Package } from 'lucide-react';

export default function Login() {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();

  useEffect(() => {
    // If already authenticated, this will be handled by App.tsx routing
    if (isAuthenticated) {
      window.location.href = '/dashboard';
    }
  }, [isAuthenticated]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dashboard-view-background flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin border-4 border-[hsl(var(--dashboard-link-color))] border-t-transparent"></div>
          <p className="mt-4 text-sm text-[hsl(var(--dashboard-link-color))]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dashboard-view-background flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid md:grid-cols-2 gap-8 items-center">
        {/* Left side - Branding and features */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-bold text-[hsl(var(--dashboard-link-color))] mb-2">
              Certean Monitor
            </h1>
            <p className="text-lg text-gray-600">
              Compliance monitoring platform for modern product teams
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[hsl(var(--dashboard-link-color))] flex items-center justify-center">
                <Package className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[hsl(var(--dashboard-link-color))] mb-1">
                  Product Monitoring
                </h3>
                <p className="text-sm text-gray-600">
                  Track compliance requirements across all your products and markets
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[hsl(var(--dashboard-link-color))] flex items-center justify-center">
                <Bell className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[hsl(var(--dashboard-link-color))] mb-1">
                  Real-time Updates
                </h3>
                <p className="text-sm text-gray-600">
                  Get notified instantly when regulations change or deadlines approach
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0 w-12 h-12 bg-[hsl(var(--dashboard-link-color))] flex items-center justify-center">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-[hsl(var(--dashboard-link-color))] mb-1">
                  Compliance Confidence
                </h3>
                <p className="text-sm text-gray-600">
                  Stay ahead of regulatory requirements with AI-powered monitoring
                </p>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <p className="text-xs text-gray-500">
              Trusted by product teams at leading companies worldwide
            </p>
          </div>
        </div>

        {/* Right side - Login card */}
        <Card className="bg-white border-0">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-[hsl(var(--dashboard-link-color))]">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Sign in to access your compliance dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Button
              onClick={() => loginWithRedirect()}
              className="w-full bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white h-12 text-base font-semibold"
            >
              <LogIn className="mr-2 h-5 w-5" />
              Sign In with Auth0
            </Button>

            <div className="space-y-3 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Secure authentication</span>
                <span className="flex items-center">
                  <Shield className="h-3 w-3 mr-1 text-green-500" />
                  SSL Encrypted
                </span>
              </div>
            </div>

            <div className="pt-4">
              <p className="text-xs text-gray-500 text-center">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

