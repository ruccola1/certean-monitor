import { useState, useEffect } from 'react';
import { CreditCard, Download, Calendar, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { SUBSCRIPTION_PLANS, getPlanById } from '@/config/subscriptionPlans';
import type { Subscription, Invoice, UsageStats } from '@/types/subscription';
import { apiService } from '@/services/api';

export default function Billing() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [usage, setUsage] = useState<UsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBillingData();
  }, []);

  const fetchBillingData = async () => {
    try {
      const clientId = 'supercase'; // TODO: Get from user context
      const response = await apiService.get(`/api/stripe/billing/${clientId}`);
      
      if (response.data) {
        setSubscription(response.data.subscription);
        setInvoices(response.data.invoices || []);
        setUsage(response.data.usage);
      }
    } catch (error) {
      console.error('Failed to fetch billing data:', error);
      // Set free tier defaults on error
      setSubscription(null);
      setUsage({
        productsCreated: 0,
        productsLimit: 5,
        dataRetentionDays: 7,
        currentPeriodStart: new Date().toISOString(),
        currentPeriodEnd: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = () => {
    window.location.href = '/pricing';
  };

  const handleManageBilling = async () => {
    if (!subscription?.stripeCustomerId) {
      alert('No active subscription found');
      return;
    }

    try {
      const response = await apiService.post('/api/stripe/create-portal-session', {
        customer_id: subscription.stripeCustomerId,
        return_url: `${window.location.origin}/billing`
      });

      if (response.data.url) {
        window.location.href = response.data.url;
      }
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      alert('Failed to open billing portal. Please try again.');
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will still have access until the end of your billing period.')) {
      return;
    }

    try {
      // TODO: Call API to cancel subscription
      console.log('Canceling subscription...');
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    }
  };

  const currentPlan = subscription ? getPlanById(subscription.tier) : null;
  const usagePercentage = usage && usage.productsLimit 
    ? Math.round((usage.productsCreated / usage.productsLimit) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-dashboard-view-background p-8 flex items-center justify-center">
        <p className="text-gray-600">Loading billing information...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dashboard-view-background p-8">
      <div className="max-w-7xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--dashboard-link-color))]">
            Billing & Subscription
          </h1>
          <p className="text-[15px] text-gray-600 mt-2">
            Manage your subscription, view invoices, and track usage
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Current Plan */}
          <div className="lg:col-span-2 space-y-6">
            {/* Plan Card */}
            <Card className="bg-white border-0">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-bold text-[hsl(var(--dashboard-link-color))] mb-1">
                      Current Plan
                    </h2>
                    <div className="flex items-center gap-3">
                      <h3 className="text-2xl font-bold text-[hsl(var(--dashboard-link-color))]">
                        {currentPlan?.name}
                      </h3>
                      {subscription?.status === 'active' && (
                        <Badge className="bg-green-100 text-green-700 border-0">
                          Active
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">
                      ${currentPlan?.price}
                    </div>
                    <div className="text-sm text-gray-500">/month</div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Features */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-2">PLAN FEATURES</p>
                  <ul className="grid grid-cols-2 gap-2">
                    {currentPlan?.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-gray-700">
                        • {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <Separator />

                {/* Billing Period */}
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Current period: {new Date(subscription?.currentPeriodStart || '').toLocaleDateString()} - {new Date(subscription?.currentPeriodEnd || '').toLocaleDateString()}
                  </span>
                </div>

                {subscription?.cancelAtPeriodEnd && (
                  <div className="bg-yellow-50 border-0 p-3 flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-yellow-900">
                        Subscription Ending
                      </p>
                      <p className="text-xs text-yellow-800 mt-1">
                        Your subscription will end on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  {subscription?.tier !== 'enterprise' && (
                    <Button
                      onClick={handleUpgrade}
                      className="bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white"
                    >
                      Upgrade Plan
                    </Button>
                  )}
                  <Button
                    onClick={handleManageBilling}
                    variant="outline"
                    className="border-0 bg-gray-100 hover:bg-gray-200 text-[hsl(var(--dashboard-link-color))]"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Manage Billing
                  </Button>
                  {subscription?.tier !== 'free' && !subscription?.cancelAtPeriodEnd && (
                    <Button
                      onClick={handleCancelSubscription}
                      variant="outline"
                      className="border-0 bg-red-50 hover:bg-red-100 text-red-600"
                    >
                      Cancel Subscription
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Invoices */}
            <Card className="bg-white border-0">
              <CardHeader>
                <h2 className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
                  Invoice History
                </h2>
              </CardHeader>
              <CardContent>
                {invoices.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No invoices yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {invoices.map((invoice) => (
                      <div
                        key={invoice.id}
                        className="flex items-center justify-between p-3 bg-dashboard-view-background"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <p className="text-sm font-semibold text-[hsl(var(--dashboard-link-color))]">
                              ${invoice.amount.toFixed(2)} {invoice.currency}
                            </p>
                            <Badge className={`border-0 ${
                              invoice.status === 'paid' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-gray-100 text-gray-700'
                            }`}>
                              {invoice.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(invoice.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric'
                            })}
                          </p>
                        </div>
                        {invoice.invoiceUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(invoice.invoiceUrl, '_blank')}
                            className="text-[hsl(var(--dashboard-link-color))]"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Usage Stats */}
          <div className="space-y-6">
            <Card className="bg-white border-0">
              <CardHeader>
                <h2 className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
                  Usage This Month
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Products Usage */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-gray-600">PRODUCTS</span>
                    <span className="text-xs text-gray-600">
                      {usage?.productsCreated} / {usage?.productsLimit || '∞'}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200">
                    <div
                      className="h-2 bg-[hsl(var(--dashboard-link-color))]"
                      style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {usage?.productsLimit ? `${usage.productsLimit - usage.productsCreated} remaining` : 'Unlimited'}
                  </p>
                </div>

                <Separator />

                {/* Data Retention */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">DATA RETENTION</p>
                  <p className="text-2xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">
                    {usage?.dataRetentionDays || '∞'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {usage?.dataRetentionDays ? 'days' : 'Unlimited'}
                  </p>
                </div>

                <Separator />

                {/* Next Billing Date */}
                <div>
                  <p className="text-xs font-semibold text-gray-600 mb-1">NEXT BILLING DATE</p>
                  <p className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
                    {new Date(subscription?.currentPeriodEnd || '').toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

