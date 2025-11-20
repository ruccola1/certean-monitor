# Auth0 Setup Guide

This guide will help you configure Auth0 for the Certean Monitor application.

## Prerequisites

- Auth0 account (sign up at https://auth0.com if you don't have one)
- Access to the Auth0 Dashboard

---

## Step 1: Create Auth0 Application

1. **Log in to Auth0 Dashboard**
   - Go to https://manage.auth0.com
   - Log in with your credentials

2. **Create a New Application**
   - Click "Applications" in the left sidebar
   - Click "Create Application"
   - Name: `Certean Monitor`
   - Application Type: `Single Page Application`
   - Click "Create"

3. **Configure Application Settings**
   - Go to the "Settings" tab
   - Note down:
     - **Domain** (e.g., `dev-certean.us.auth0.com`)
     - **Client ID** (e.g., `abc123xyz456`)

---

## Step 2: Configure Allowed URLs

In the Application Settings, configure the following:

### Allowed Callback URLs
```
http://localhost:5173/callback,
https://your-production-domain.com/callback
```

### Allowed Logout URLs
```
http://localhost:5173/login,
https://your-production-domain.com/login
```

### Allowed Web Origins
```
http://localhost:5173,
https://your-production-domain.com
```

### Allowed Origins (CORS)
```
http://localhost:5173,
https://your-production-domain.com
```

Click **"Save Changes"** at the bottom.

---

## Step 3: Configure Auth0 API (Optional but Recommended)

This step is required if you want to secure your backend API with Auth0.

1. **Create API**
   - Go to "Applications" → "APIs"
   - Click "Create API"
   - Name: `Certean Monitor API`
   - Identifier: `https://api.certean-monitor.com` (This is the audience)
   - Signing Algorithm: `RS256`
   - Click "Create"

2. **Enable RBAC (Role-Based Access Control)**
   - Go to the API settings
   - Scroll to "RBAC Settings"
   - Enable "Enable RBAC"
   - Enable "Add Permissions in the Access Token"
   - Click "Save"

---

## Step 4: Update Environment Variables

Update your `.env` file with your Auth0 credentials:

```env
# Auth0 Configuration
VITE_AUTH0_DOMAIN=your-domain.us.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_REDIRECT_URI=http://localhost:5173
VITE_AUTH0_AUDIENCE=https://api.certean-monitor.com

# API Configuration
VITE_API_BASE_URL=http://localhost:3000/api
```

**Important:** 
- Replace `your-domain.us.auth0.com` with your actual Auth0 domain
- Replace `your-client-id` with your actual Client ID
- Update the redirect URI for production deployments

---

## Step 5: Customize Auth0 Login Page (Optional)

Make the Auth0 Universal Login match your brand:

1. **Go to Universal Login**
   - Click "Universal Login" in the left sidebar
   - Click "Login" tab

2. **Choose Experience**
   - Select "New Universal Login Experience"

3. **Customize Branding**
   - Go to "Branding" in the left sidebar
   - Upload your logo
   - Set primary color to match your brand (`#6b93c0` - dashboard link color)
   - Set page background color (`#EEEFF0` - dashboard view background)

4. **Advanced Customization (Optional)**
   - Enable "Customize Login Page"
   - You can modify the HTML/CSS/JavaScript of the login page
   - Use the design system colors from your app

---

## Step 6: Add User Metadata (For Demo)

To store client-specific information:

1. **Create a Rule**
   - Go to "Auth Pipeline" → "Rules"
   - Click "Create Rule"
   - Choose "Empty rule"
   - Name: `Add Client Metadata`
   
2. **Add the following script:**

```javascript
function addClientMetadata(user, context, callback) {
  const namespace = 'https://certean-monitor.com/';
  
  // Add custom claims to the token
  context.idToken[namespace + 'client_id'] = 'supercase_demo';
  context.idToken[namespace + 'client_name'] = 'Supercase';
  context.idToken[namespace + 'role'] = 'admin';
  context.idToken[namespace + 'subscription'] = 'professional';
  
  callback(null, user, context);
}
```

3. **Click "Save Changes"**

---

## Step 7: Test Authentication

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Navigate to:**
   ```
   http://localhost:5173
   ```

3. **Test the flow:**
   - You should be redirected to `/login`
   - Click "Sign In with Auth0"
   - Complete authentication on Auth0
   - You should be redirected back to `/dashboard`
   - Your user info should appear in the top-right dropdown

---

## Step 8: Create Demo User (For Testing)

1. **Go to User Management**
   - Click "User Management" → "Users"
   - Click "Create User"

2. **Fill in details:**
   - Email: `nicolas@supercase.se`
   - Password: Create a secure password
   - Connection: `Username-Password-Authentication`
   - Click "Create"

3. **Update User Metadata (Optional):**
   - Click on the user
   - Scroll to "Metadata"
   - Add `user_metadata`:
   ```json
   {
     "client_id": "supercase_demo",
     "client_name": "Supercase",
     "role": "admin",
     "department": "Compliance & Quality"
   }
   ```

---

## Step 9: Security Best Practices

### Token Rotation
- Refresh tokens are enabled by default in the config
- Tokens are stored in `localStorage`
- Consider using `memory` storage for higher security (requires session management)

### Session Management
```typescript
// In auth0Config.ts, you can adjust:
cacheLocation: 'localstorage' // or 'memory' for higher security
useRefreshTokens: true
```

### CORS Configuration
- Ensure your API allows requests from your frontend domain
- Add proper CORS headers on your backend

### Environment Variables
- **Never commit `.env` to version control**
- `.env` is already in `.gitignore`
- Use `.env.example` as a template for team members

---

## Troubleshooting

### "Invalid state" Error
- Clear browser cache and localStorage
- Verify callback URL matches exactly (including trailing slashes)

### "Access Denied" Error
- Check that the user exists in Auth0
- Verify the connection is enabled (Username-Password-Authentication)

### Infinite Redirect Loop
- Check that `/callback` route is not protected
- Verify `VITE_AUTH0_REDIRECT_URI` matches your app URL

### User Info Not Showing
- Check that `openid profile email` scopes are requested
- Verify the Rule for adding metadata is enabled and saved

### Local Development Issues
- Ensure `.env` file is in the root directory
- Restart dev server after changing `.env` variables
- Check browser console for specific error messages

---

## Production Deployment

When deploying to production:

1. **Update Environment Variables:**
   ```env
   VITE_AUTH0_DOMAIN=your-domain.auth0.com
   VITE_AUTH0_CLIENT_ID=your-production-client-id
   VITE_AUTH0_REDIRECT_URI=https://your-production-domain.com
   VITE_AUTH0_AUDIENCE=https://api.certean-monitor.com
   VITE_API_BASE_URL=https://api.your-production-domain.com
   ```

2. **Update Auth0 Application Settings:**
   - Add production URLs to Allowed Callback URLs
   - Add production URLs to Allowed Logout URLs
   - Add production domain to Allowed Web Origins

3. **Enable MFA (Multi-Factor Authentication):**
   - Go to "Security" → "Multi-factor Auth"
   - Enable at least one MFA method
   - Configure policies as needed

4. **Monitor Logs:**
   - Go to "Monitoring" → "Logs"
   - Set up log streaming for production monitoring

---

## Integration with Backend API

When calling your backend API, include the Auth0 access token:

```typescript
import { useAuth0 } from '@auth0/auth0-react';

function MyComponent() {
  const { getAccessTokenSilently } = useAuth0();

  const callAPI = async () => {
    try {
      const token = await getAccessTokenSilently();
      
      const response = await fetch('https://api.certean-monitor.com/products', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API call failed:', error);
    }
  };
}
```

Your backend should verify the JWT token and extract user/client information.

---

## Additional Resources

- [Auth0 React SDK Documentation](https://auth0.com/docs/libraries/auth0-react)
- [Auth0 Single Page Application Quickstart](https://auth0.com/docs/quickstart/spa/react)
- [Securing React Applications](https://auth0.com/blog/complete-guide-to-react-user-authentication/)
- [Auth0 Rules Documentation](https://auth0.com/docs/rules)

---

## Support

For issues specific to Auth0 configuration:
- Auth0 Community: https://community.auth0.com/
- Auth0 Support: https://support.auth0.com/

For issues specific to Certean Monitor integration:
- Check the browser console for errors
- Review the `/src/config/auth0.ts` configuration
- Ensure environment variables are correctly set

