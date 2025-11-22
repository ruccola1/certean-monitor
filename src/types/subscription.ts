export type SubscriptionTier = 'free' | 'manager' | 'expert' | 'enterprise';

export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'incomplete' | 'trialing';

export interface SubscriptionPlan {
  id: SubscriptionTier;
  name: string;
  price: number | null; // null for custom pricing
  interval: 'month' | 'year';
  stripePriceId?: string | null; // null for contact us plans
  features: string[];
  limits: {
    productsPerMonth: number | null; // null = unlimited
    dataRetentionDays: number | null; // null = unlimited
    pipelineSteps: number; // 2, 5, 5
    maxMarkets: number | null; // null = unlimited
    apiAccess: boolean;
    exportReports: boolean;
    multiUser: boolean;
    prioritySupport: boolean;
  };
}

export interface Subscription {
  id: string;
  userId: string;
  clientId: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Invoice {
  id: string;
  subscriptionId: string;
  amount: number;
  currency: string;
  status: 'paid' | 'open' | 'void' | 'uncollectible';
  invoiceUrl?: string;
  paidAt?: string;
  createdAt: string;
}

export interface UsageStats {
  productsCreated: number;
  productsLimit: number | null;
  dataRetentionDays: number | null;
  currentPeriodStart: string;
  currentPeriodEnd: string;
}

