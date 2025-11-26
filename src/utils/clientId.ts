import { User } from '@auth0/auth0-react';

const CLIENT_ID_NAMESPACE = 'https://localhost/';

/**
 * Extract client_id (company ID) from Auth0 user object
 * Priority:
 * 1. Custom claim: https://localhost/client_id (from Auth0 Action)
 * 2. App metadata: app_metadata.client_id (set by admin)
 * 3. User metadata: user_metadata.client_id
 * 4. Returns null if no client assigned (new user with empty workspace)
 */
export function getClientId(user: User | undefined): string | null {
  if (!user) {
    console.log('❌ No user provided to getClientId');
    return null;
  }

  console.log('🔍 Full user object:', user);

  // Try custom claim first (from Auth0 Rules/Actions)
  const customClaim = (user as any)[`${CLIENT_ID_NAMESPACE}client_id`];
  if (customClaim) {
    console.log('✅ Found client_id in custom claim:', customClaim);
    return customClaim;
  }

  // Try app_metadata (set by admin in Auth0)
  const appMetadata = (user as any)[`${CLIENT_ID_NAMESPACE}app_metadata`] || (user as any).app_metadata;
  console.log('🔍 app_metadata:', appMetadata);
  if (appMetadata?.client_id) {
    console.log('✅ Found client_id in app_metadata:', appMetadata.client_id);
    return appMetadata.client_id;
  }

  // Try user_metadata
  const userMetadata = (user as any)[`${CLIENT_ID_NAMESPACE}user_metadata`] || (user as any).user_metadata;
  console.log('🔍 user_metadata:', userMetadata);
  if (userMetadata?.client_id) {
    console.log('✅ Found client_id in user_metadata:', userMetadata.client_id);
    return userMetadata.client_id;
  }

  // No client assigned - user sees empty workspace
  console.log('📋 No client_id assigned - user will see empty workspace');
  console.log('📋 Available keys in user object:', Object.keys(user));
  return null;
}

/**
 * Get the display name for the client/company
 * @deprecated Use fetchClientInfo() from '@/services/clientService' instead
 * This function is kept for backward compatibility but should not be used
 */
export function getClientName(user: User | undefined): string {
  if (!user) {
    return 'Your Company';
  }

  // Try custom claim first (from Auth0 Rules/Actions)
  const customClaim = (user as any)[`${CLIENT_ID_NAMESPACE}client_name`];
  if (customClaim) {
    console.log('✅ Found client_name in custom claim:', customClaim);
    return customClaim;
  }

  // Try to get client name from metadata
  const appMetadata = (user as any)[`${CLIENT_ID_NAMESPACE}app_metadata`] || (user as any).app_metadata;
  if (appMetadata?.client_name) {
    console.log('✅ Found client_name in app_metadata:', appMetadata.client_name);
    return appMetadata.client_name;
  }

  const userMetadata = (user as any)[`${CLIENT_ID_NAMESPACE}user_metadata`] || (user as any).user_metadata;
  if (userMetadata?.client_name) {
    console.log('✅ Found client_name in user_metadata:', userMetadata.client_name);
    return userMetadata.client_name;
  }

  // Check if user has a client_id assigned
  const clientId = getClientId(user);
  if (!clientId) {
    console.log('📋 No client_name found and no client_id assigned');
    return 'Your Company';
  }

  // Has client but no name - return generic
  console.log('📋 Client assigned but no client_name found');
  return 'Your Company';
}

/**
 * Check if user has a client assigned
 */
export function hasClientAssigned(user: User | undefined): boolean {
  return getClientId(user) !== null;
}

