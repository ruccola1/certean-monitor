import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SUBSCRIPTION_PLANS } from '@/config/subscriptionPlans';
import type { SubscriptionTier } from '@/types/subscription';
import { apiService } from '@/services/api';
import { useAuth0 } from '@auth0/auth0-react';

export default function Pricing() {
  const [selectedTier, setSelectedTier] = useState<SubscriptionTier | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth0();

  const handleSelectPlan = async (tier: SubscriptionTier) => {
    setSelectedTier(tier);
    setLoading(true);
    setError(null);

    try {
      if (tier === 'enterprise') {
        // Enterprise tier - contact us via email
        window.location.href = 'mailto:info@certean.com?subject=Enterprise Plan Inquiry&body=I am interested in the Enterprise plan. Please contact me with more information.';
        setLoading(false);
      } else if (tier === 'free') {
        // Free tier - no payment needed
        console.log('Free tier selected');
        // TODO: Update user subscription to free tier in backend
        setLoading(false);
      } else {
        // Get price ID for the selected tier
        const plan = SUBSCRIPTION_PLANS.find(p => p.id === tier);
        if (!plan || !plan.stripePriceId) {
          throw new Error('Plan not found or price ID missing');
        }

        // Call backend to create Stripe Checkout session
        const response = await apiService.post('/api/stripe/create-checkout-session', {
          price_id: plan.stripePriceId,
          client_id: 'supercase', // TODO: Get from user context
          user_email: user?.email || 'nicolas@supercase.se',
          success_url: `${window.location.origin}/billing?success=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${window.location.origin}/pricing?canceled=true`
        });

        // Redirect to Stripe Checkout
        if (response.data.url) {
          window.location.href = response.data.url;
        } else {
          throw new Error('No checkout URL returned');
        }
      }
    } catch (err: any) {
      console.error('Failed to select plan:', err);
      setError(err.response?.data?.detail || err.message || 'Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-view-background p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] mb-4">
            Choose Your Plan
          </h1>
          <p className="text-[15px] text-gray-600 max-w-2xl mx-auto">
            Select the plan that best fits your compliance monitoring needs. 
            Upgrade or downgrade at any time.
          </p>
          {error && (
            <div className="mt-4 bg-red-50 border-0 p-4 max-w-2xl mx-auto">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isPopular = plan.id === 'manager';
            const isEnterprise = plan.id === 'enterprise';

            return (
              <Card 
                key={plan.id} 
                className={`bg-white border-0 relative flex flex-col ${
                  isPopular ? 'ring-2 ring-[hsl(var(--dashboard-link-color))]' : ''
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-4 left-0 right-0 flex justify-center">
                    <Badge className="bg-[hsl(var(--dashboard-link-color))] text-white border-0 px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="pb-4">
                  <div className="space-y-2">
                    <h3 className="text-xl font-bold text-[hsl(var(--dashboard-link-color))]">
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1">
                      {plan.price !== null ? (
                        <>
                          <span className="text-4xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">
                            €{plan.price}
                          </span>
                          <span className="text-gray-500">/{plan.interval}</span>
                        </>
                      ) : (
                        <span className="text-2xl font-bold text-[hsl(var(--dashboard-link-color))]">
                          Custom Pricing
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="flex-1 flex flex-col space-y-6">
                  {/* Features List */}
                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button
                    onClick={() => handleSelectPlan(plan.id)}
                    disabled={loading && selectedTier === plan.id}
                    className={`w-full ${
                      isPopular || isEnterprise
                        ? 'bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-[hsl(var(--dashboard-link-color))]'
                    }`}
                  >
                    {loading && selectedTier === plan.id
                      ? 'Processing...'
                      : plan.id === 'enterprise'
                      ? 'Contact Us'
                      : plan.id === 'free'
                      ? 'Get Started Free'
                      : `Subscribe to ${plan.name}`}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ / Additional Info */}
        <div className="mt-12 text-center">
          <p className="text-sm text-gray-600">
            All plans include secure data storage and regular compliance updates. 
            <br />
            Need a custom plan? <a href="mailto:support@certean.com" className="text-[hsl(var(--dashboard-link-color))] hover:underline">Contact us</a>
          </p>
        </div>
      </div>
    </div>
  );
}

