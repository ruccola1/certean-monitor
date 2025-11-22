# AWS Amplify Environment Variables Guide

## Common Issues with Vite + AWS Amplify

### Problem: Environment Variables Not Available at Build Time

**Why it happens:**
- Vite embeds `import.meta.env.VITE_*` variables **at build time** (not runtime)
- AWS Amplify Console environment variables may not be available during the build phase
- Variables must be set **before** `npm run build` executes

### Solution 1: Amplify Console (Recommended First Try)

1. **Go to AWS Amplify Console**
   - Navigate to your app → **App settings** → **Environment variables**

2. **Add all required variables:**
   ```
   VITE_AUTH0_DOMAIN=your-domain.auth0.com
   VITE_AUTH0_CLIENT_ID=your-client-id
   VITE_AUTH0_REDIRECT_URI=https://main.d2uoumf6pfk145.amplifyapp.com
   VITE_AUTH0_AUDIENCE=https://api.certean-monitor.com
   VITE_API_BASE_URL=https://q57c4vz2em.eu-west-1.awsapprunner.com
   VITE_CERTEAN_API_KEY=your-api-key
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
   VITE_STRIPE_PRICE_MANAGER=price_xxx
   VITE_STRIPE_PRICE_EXPERT=price_xxx
   ```

3. **Important:** 
   - Set variables **per branch** (main, dev, etc.)
   - Click **Save** after adding each variable
   - **Redeploy** the app after adding variables

4. **Verify in build logs:**
   - Check the build output for "Environment variables check"
   - Variables should show values, not "not-set"

---

### Solution 2: AWS Secrets Manager (Recommended for Production)

**Best for:** Sensitive values like API keys, client secrets

1. **Create secret using the setup script:**
   ```bash
   ./scripts/setup-secrets-manager.sh certean-monitor/env-vars
   ```
   Or manually:
   ```bash
   aws secretsmanager create-secret \
     --name "certean-monitor/env-vars" \
     --description "Environment variables for Certean Monitor" \
     --secret-string '{
       "VITE_AUTH0_DOMAIN": "your-domain.auth0.com",
       "VITE_AUTH0_CLIENT_ID": "your-client-id",
       "VITE_AUTH0_REDIRECT_URI": "https://main.d2uoumf6pfk145.amplifyapp.com",
       "VITE_AUTH0_AUDIENCE": "https://api.certean-monitor.com",
       "VITE_API_BASE_URL": "https://q57c4vz2em.eu-west-1.awsapprunner.com",
       "VITE_CERTEAN_API_KEY": "your-api-key"
     }'
   ```

2. **Grant Amplify permission to read the secret:**
   - Go to **AWS IAM Console**
   - Find your Amplify service role (or create one)
   - Attach this policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "secretsmanager:GetSecretValue",
           "secretsmanager:DescribeSecret"
         ],
         "Resource": "arn:aws:secretsmanager:*:*:secret:certean-monitor/env-vars*"
       }
     ]
   }
   ```

3. **Enable in Amplify Console:**
   - Add environment variable: `SECRET_NAME=certean-monitor/env-vars`
   - The `amplify.yml` will automatically fetch from Secrets Manager

4. **The secret will be fetched during build:**
   - Script runs in `preBuild` phase
   - Variables are exported before `npm run build`
   - Only fetches if `SECRET_NAME` is set

---

### Solution 3: AWS Systems Manager Parameter Store

If Amplify Console variables don't work, use Parameter Store:

1. **Store parameters in AWS Systems Manager:**
   ```bash
   aws ssm put-parameter \
     --name "/certean-monitor/VITE_AUTH0_DOMAIN" \
     --value "your-domain.auth0.com" \
     --type "String"
   
   aws ssm put-parameter \
     --name "/certean-monitor/VITE_AUTH0_CLIENT_ID" \
     --value "your-client-id" \
     --type "SecureString" \
     --key-id "alias/aws/ssm"  # For sensitive values
   ```

2. **Enable Parameter Store in amplify.yml:**
   - Uncomment the Parameter Store fetch script in `amplify.yml`:
   ```yaml
   preBuild:
     commands:
       - npm ci
       - |
         if [ -f scripts/fetch-env-from-ssm.sh ]; then
           chmod +x scripts/fetch-env-from-ssm.sh
           source scripts/fetch-env-from-ssm.sh
         fi
   ```

3. **Grant Amplify IAM permissions:**
   - Go to **App settings** → **Access control**
   - Add IAM role with `ssm:GetParameter` and `ssm:GetParameters` permissions
   - Or attach this policy to Amplify's service role:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "ssm:GetParameter",
           "ssm:GetParameters"
         ],
         "Resource": "arn:aws:ssm:*:*:parameter/certean-monitor/*"
       }
     ]
   }
   ```

---

### Solution 4: Build Script with Direct AWS SDK

Create a Node.js script that fetches from Parameter Store:

1. **Create `scripts/fetch-env.js`:**
   ```javascript
   const { SSMClient, GetParameterCommand } = require('@aws-sdk/client-ssm');
   
   const ssm = new SSMClient({ region: process.env.AWS_REGION || 'us-east-1' });
   
   async function fetchEnvVar(name) {
     try {
       const command = new GetParameterCommand({
         Name: `/certean-monitor/${name}`,
         WithDecryption: true
       });
       const response = await ssm.send(command);
       return response.Parameter.Value;
     } catch (error) {
       console.warn(`Failed to fetch ${name}:`, error.message);
       return null;
     }
   }
   
   async function main() {
     const vars = [
       'VITE_AUTH0_DOMAIN',
       'VITE_AUTH0_CLIENT_ID',
       // ... add all vars
     ];
     
     for (const varName of vars) {
       if (!process.env[varName]) {
         const value = await fetchEnvVar(varName);
         if (value) {
           process.env[varName] = value;
           console.log(`✓ Set ${varName}`);
         }
       }
     }
   }
   
   main();
   ```

2. **Update `amplify.yml`:**
   ```yaml
   preBuild:
     commands:
       - npm ci
       - node scripts/fetch-env.js
   ```

---

### Solution 5: Environment File in S3

1. **Upload `.env.production` to S3:**
   ```bash
   aws s3 cp .env.production s3://your-bucket/certean-monitor/.env.production
   ```

2. **Fetch in amplify.yml:**
   ```yaml
   preBuild:
     commands:
       - aws s3 cp s3://your-bucket/certean-monitor/.env.production .env.production
       - npm ci
   ```

---

## Debugging Steps

1. **Check build logs:**
   - Look for "Environment variables check" output
   - Verify variables show actual values, not "not-set"

2. **Verify variable names:**
   - Must start with `VITE_` prefix
   - Case-sensitive
   - No typos

3. **Check timing:**
   - Variables must be set **before** `npm run build`
   - Use `preBuild` phase, not `build` phase

4. **Test locally:**
   ```bash
   # Set variables manually
   export VITE_AUTH0_DOMAIN=test
   export VITE_AUTH0_CLIENT_ID=test
   npm run build
   ```

5. **Verify in built code:**
   - Check `dist/assets/index-*.js`
   - Search for your variable values
   - They should be embedded as strings, not `import.meta.env.VITE_*`

---

## Recommended Approach

1. **Start with Amplify Console** (easiest, for non-sensitive values)
2. **Use Secrets Manager for production** (most secure, recommended for API keys and secrets)
3. **Fallback to Parameter Store** (if Secrets Manager has issues)

---

## Quick Reference: Required Variables

```env
# Auth0
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_REDIRECT_URI=https://main.d2uoumf6pfk145.amplifyapp.com
VITE_AUTH0_AUDIENCE=https://api.certean-monitor.com

# API
VITE_API_BASE_URL=https://q57c4vz2em.eu-west-1.awsapprunner.com
VITE_CERTEAN_API_KEY=your-api-key

# Stripe (optional)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
VITE_STRIPE_PRICE_MANAGER=price_xxx
VITE_STRIPE_PRICE_EXPERT=price_xxx
```

---

## Troubleshooting

**"Environment variable not set" error:**
- Check variable name has `VITE_` prefix
- Verify it's set in Amplify Console for the correct branch
- Redeploy after adding variables

**"Callback URL mismatch" error:**
- Verify `VITE_AUTH0_REDIRECT_URI` matches your Amplify domain
- Add `/callback` to Auth0 allowed callback URLs
- Code automatically appends `/callback` to redirect URI

**Variables work locally but not in Amplify:**
- Amplify Console variables may not be available during build
- Use Parameter Store or build script instead
- Check IAM permissions for Parameter Store access

