export interface Subscription {
  id: string;
  clientId: string;
  tier: 'free' | 'professional' | 'expert';
  status: 'active' | 'inactive' | 'canceled' | 'past_due';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  usage: SubscriptionUsage;
  limits: SubscriptionLimits;
}

export interface SubscriptionUsage {
  productsCount: number;
  tokensUsed: number;
  costsThisMonth: number;
}

export interface SubscriptionLimits {
  maxProducts: number | null; // null = unlimited
  maxMarkets: number | null;
  maxComplianceElements: number | null;
  maxUsers: number | null;
  tokensPerProduct: number;
  maxConcurrentProcesses: number;
  hasRealTimeNotifications: boolean;
}

