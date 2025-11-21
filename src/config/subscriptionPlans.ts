import type { SubscriptionPlan } from '@/types/subscription';

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: 'month',
    stripePriceId: null,
    features: [
      '5 products per month',
      '1 target market per product',
      'Basic compliance checks (Steps 0-2)',
      'Email support',
      '7-day data retention',
      'Limited features'
    ],
    limits: {
      productsPerMonth: 5,
      dataRetentionDays: 7,
      pipelineSteps: 2,
      maxMarkets: 1,
      apiAccess: false,
      exportReports: false,
      multiUser: false,
      prioritySupport: false
    }
  },
  {
    id: 'manager',
    name: 'Manager',
    price: 495,
    interval: 'month',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_MANAGER,
    features: [
      'Up to 50 products',
      'Up to 3 target markets per product',
      'Full compliance pipeline (Steps 0-5)',
      'Priority email support',
      '90-day data retention',
      'Export reports (PDF)',
      'Team collaboration'
    ],
    limits: {
      productsPerMonth: 50,
      dataRetentionDays: 90,
      pipelineSteps: 5,
      maxMarkets: 3,
      apiAccess: true,
      exportReports: true,
      multiUser: true,
      prioritySupport: true
    }
  },
  {
    id: 'expert',
    name: 'Expert',
    price: 895,
    interval: 'month',
    stripePriceId: import.meta.env.VITE_STRIPE_PRICE_EXPERT,
    features: [
      'Unlimited products',
      'Unlimited target markets',
      'Full compliance pipeline (Steps 0-5)',
      'Priority phone & email support',
      'Unlimited data retention',
      'API access',
      'Advanced analytics',
      'Multi-user access',
      'Custom integrations'
    ],
    limits: {
      productsPerMonth: null, // unlimited
      dataRetentionDays: null, // unlimited
      pipelineSteps: 5,
      maxMarkets: null, // unlimited
      apiAccess: true,
      exportReports: true,
      multiUser: true,
      prioritySupport: true
    }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: null, // Custom pricing
    interval: 'month',
    stripePriceId: null, // Contact us - no Stripe product
    features: [
      'Unlimited products',
      'Unlimited target markets',
      'Full compliance pipeline (Steps 0-5)',
      'Dedicated account manager',
      'Unlimited data retention',
      'White-label options',
      'Custom integrations',
      'Advanced analytics',
      'Multi-user access',
      'SLA guarantees',
      'On-premise deployment options'
    ],
    limits: {
      productsPerMonth: null,
      dataRetentionDays: null,
      pipelineSteps: 5,
      maxMarkets: null, // unlimited
      apiAccess: true,
      exportReports: true,
      multiUser: true,
      prioritySupport: true
    }
  }
];

export const getPlanById = (planId: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
};

export const getDefaultPlan = (): SubscriptionPlan => {
  return SUBSCRIPTION_PLANS[0]; // Free tier
};

