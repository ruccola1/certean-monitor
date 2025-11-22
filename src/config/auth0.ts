// Helper function to ensure redirect_uri includes /callback path
function getRedirectUri(): string {
  const baseUri = import.meta.env.VITE_AUTH0_REDIRECT_URI || window.location.origin;
  // Ensure the redirect URI includes /callback path
  return baseUri.endsWith('/callback') ? baseUri : `${baseUri}/callback`;
}

export const auth0Config = {
  domain: import.meta.env.VITE_AUTH0_DOMAIN || '',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || '',
  authorizationParams: {
    redirect_uri: getRedirectUri(),
    ...(import.meta.env.VITE_AUTH0_AUDIENCE && { audience: import.meta.env.VITE_AUTH0_AUDIENCE }),
    scope: 'openid profile email',
  },
  cacheLocation: 'localstorage' as const,
  useRefreshTokens: true,
};

