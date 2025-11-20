export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  role: UserRole;
  clientId: string;
  createdAt: string;
  lastLogin?: string;
}

export type UserRole = 'super_admin' | 'client_admin' | 'member' | 'viewer';

export interface Client {
  id: string;
  name: string;
  logo?: string;
  subscriptionTier: SubscriptionTier;
  createdAt: string;
  settings: ClientSettings;
}

export type SubscriptionTier = 'free' | 'professional' | 'expert';

export interface ClientSettings {
  timezone: string;
  defaultMarkets: string[];
  notificationFrequency: 'immediate' | 'daily' | 'weekly' | 'disabled';
  language: string;
}

