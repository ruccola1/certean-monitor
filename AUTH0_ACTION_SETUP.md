# Auth0 Action Setup - Add client_id as Custom Claim

This guide explains how to configure an Auth0 Action to add `client_id` as a custom claim in the JWT token.

## Step 1: Create a New Action

1. Log in to your Auth0 Dashboard
2. Navigate to **Actions** → **Flows** → **Login**
3. Click **+ Create** (or **+ Add Action** if you already have actions)
4. Select **Build Custom**
5. Name it: `Add client_id to Token`
6. Click **Create**

## Step 2: Add the Action Code

Replace the default code with this:

```javascript
/**
* Handler that will be called during the execution of a PostLogin flow.
*
* @param {Event} event - Details about the user and the context in which they are logging in.
* @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
*/
exports.onExecutePostLogin = async (event, api) => {
  const namespace = 'https://localhost/';
  
  // Priority: user_metadata > app_metadata > user.sub (fallback)
  let clientId = null;
  
  // Try user_metadata first
  if (event.user.user_metadata && event.user.user_metadata.client_id) {
    clientId = event.user.user_metadata.client_id;
  }
  // Then try app_metadata
  else if (event.user.app_metadata && event.user.app_metadata.client_id) {
    clientId = event.user.app_metadata.client_id;
  }
  // Fallback to user.sub (not ideal, but better than nothing)
  else if (event.user.sub) {
    clientId = event.user.sub;
  }
  
  // Add client_id as a custom claim in the token
  if (clientId) {
    api.idToken.setCustomClaim(`${namespace}client_id`, clientId);
    api.accessToken.setCustomClaim(`${namespace}client_id`, clientId);
  }
};
```

## Step 3: Deploy the Action

1. Click **Deploy** in the top right corner
2. Confirm the deployment

## Step 4: Add the Action to the Login Flow

1. Go back to **Actions** → **Flows** → **Login**
2. You should see your action in the **Custom** section on the right
3. Drag and drop your action (`Add client_id to Token`) into the flow
4. Click **Apply** to save the flow

## Step 5: Test the Configuration

1. Log out of your application
2. Log back in
3. Check the browser console - you should see:
   - `✅ Found client_id in custom claim: [your-client-id]`
   - No more warnings about "No client_id found in Auth0 user"

## Step 6: Verify the Token

You can verify the token contains the claim by:

1. Open browser DevTools → Application → Local Storage
2. Find the Auth0 token (usually under `@@auth0spajs@@::[client-id]::[audience]::openid profile email`)
3. Decode the token at https://jwt.io
4. Look for `https://certean-monitor.com/client_id` in the payload

## Troubleshooting

### If client_id is still not found:

1. **Check user metadata:**
   - Go to Auth0 Dashboard → Users
   - Find your user
   - Check **User Metadata** or **App Metadata** tabs
   - Ensure `client_id` is set (e.g., `69220097bca3a5ba1420fee58`)

2. **Verify the Action is deployed:**
   - Go to Actions → Flows → Login
   - Ensure your action is in the flow and enabled

3. **Check Action logs:**
   - Go to Actions → Your Action → Logs
   - Look for any errors during login

4. **Clear browser cache:**
   - Clear localStorage
   - Log out and log back in

## Alternative: Using Auth0 Rules (Legacy)

If you prefer using Rules instead of Actions:

1. Go to **Auth Pipeline** → **Rules**
2. Click **+ Create Rule**
3. Name it: `Add client_id to Token`
4. Use this code:

```javascript
function (user, context, callback) {
  const namespace = 'https://certean-monitor.com/';
  
  let clientId = null;
  
  if (user.user_metadata && user.user_metadata.client_id) {
    clientId = user.user_metadata.client_id;
  } else if (user.app_metadata && user.app_metadata.client_id) {
    clientId = user.app_metadata.client_id;
  } else if (user.sub) {
    clientId = user.sub;
  }
  
  if (clientId) {
    context.idToken[namespace + 'client_id'] = clientId;
    context.accessToken[namespace + 'client_id'] = clientId;
  }
  
  callback(null, user, context);
}
```

5. Click **Save Changes**

## Notes

- The namespace `https://localhost/` is used to avoid conflicts with standard claims
- The custom claim will be available in both ID tokens and access tokens
- The frontend code already checks for this custom claim first (highest priority)
- The backend also checks for this custom claim when decoding JWT tokens

