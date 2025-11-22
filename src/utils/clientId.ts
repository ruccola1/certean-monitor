import { User } from '@auth0/auth0-react';

const CLIENT_ID_NAMESPACE = 'https://localhost/';

/**
 * Extract client_id (company ID) from Auth0 user object
 * Priority:
 * 1. Custom claim: https://certean-monitor.com/client_id
 * 2. User metadata: user_metadata.client_id
 * 3. App metadata: app_metadata.client_id
 * 4. Fallback: '69220097bca3a5ba1420fee58' (ObjectId)
 */
export function getClientId(user: User | undefined): string {
  if (!user) {
    return '69220097bca3a5ba1420fee58';
  }

  // Debug: Log the user object to see what's available
  console.log('🔍 Auth0 User Object:', {
    sub: (user as any).sub,
    email: (user as any).email,
    customClaim: (user as any)[`${CLIENT_ID_NAMESPACE}client_id`],
    user_metadata: (user as any).user_metadata,
    app_metadata: (user as any).app_metadata,
    allKeys: Object.keys(user as any)
  });

  // Try custom claim first (from Auth0 Rules/Actions)
  const customClaim = (user as any)[`${CLIENT_ID_NAMESPACE}client_id`];
  if (customClaim) {
    console.log('✅ Found client_id in custom claim:', customClaim);
    return customClaim;
  }

  // Try user_metadata
  const userMetadata = (user as any).user_metadata;
  if (userMetadata?.client_id) {
    console.log('✅ Found client_id in user_metadata:', userMetadata.client_id);
    return userMetadata.client_id;
  }

  // Try app_metadata
  const appMetadata = (user as any).app_metadata;
  if (appMetadata?.client_id) {
    console.log('✅ Found client_id in app_metadata:', appMetadata.client_id);
    return appMetadata.client_id;
  }

  // Fallback to ObjectId
  console.warn('⚠️ No client_id found in Auth0 user, using fallback: 69220097bca3a5ba1420fee58');
  console.warn('User object keys:', Object.keys(user as any));
  return '69220097bca3a5ba1420fee58';
}

