# AWS Secrets Manager Setup for Amplify

## Quick Setup (5 minutes)

### Step 1: Create the Secret

**Option A: Use the interactive script (recommended)**
```bash
cd /Users/nicolaszander/Desktop/certean/dev/certean-monitor
./scripts/setup-secrets-manager.sh certean-monitor/env-vars
```

**Option B: Create manually via AWS CLI**
```bash
aws secretsmanager create-secret \
  --name "certean-monitor/env-vars" \
  --description "Environment variables for Certean Monitor frontend" \
  --secret-string '{
    "VITE_AUTH0_DOMAIN": "your-domain.auth0.com",
    "VITE_AUTH0_CLIENT_ID": "your-client-id",
    "VITE_AUTH0_REDIRECT_URI": "https://main.d2uoumf6pfk145.amplifyapp.com",
    "VITE_AUTH0_AUDIENCE": "https://api.certean-monitor.com",
    "VITE_API_BASE_URL": "https://q57c4vz2em.eu-west-1.awsapprunner.com",
    "VITE_CERTEAN_API_KEY": "your-api-key",
    "VITE_STRIPE_PUBLISHABLE_KEY": "pk_live_xxx",
    "VITE_STRIPE_PRICE_MANAGER": "price_xxx",
    "VITE_STRIPE_PRICE_EXPERT": "price_xxx"
  }' \
  --region eu-west-1
```

### Step 2: Grant Amplify Permission

**Find your Amplify service role:**
1. Go to **AWS Amplify Console** → Your App → **App settings** → **Access control**
2. Note the **Service role ARN** (e.g., `arn:aws:iam::123456789012:role/amplify-role`)

**Attach policy to the role:**
```bash
# Replace ROLE_NAME with your Amplify service role name
aws iam put-role-policy \
  --role-name amplify-role \
  --policy-name SecretsManagerReadAccess \
  --policy-document '{
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
  }'
```

**Or via AWS Console:**
1. Go to **IAM** → **Roles** → Find your Amplify service role
2. Click **Add permissions** → **Create inline policy**
3. Use JSON editor and paste:
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

### Step 3: Enable in Amplify

1. Go to **AWS Amplify Console** → Your App → **App settings** → **Environment variables**
2. Add **one** variable:
   ```
   SECRET_NAME=certean-monitor/env-vars
   ```
3. Click **Save**
4. **Redeploy** your app

### Step 4: Verify

Check the build logs for:
```
Fetching environment variables from AWS Secrets Manager...
Fetching secrets from certean-monitor/env-vars...
✓ Set VITE_AUTH0_DOMAIN from Secrets Manager
✓ Set VITE_AUTH0_CLIENT_ID from Secrets Manager
...
Environment variable fetch complete.
```

---

## Updating Secrets

**Update via script:**
```bash
./scripts/setup-secrets-manager.sh certean-monitor/env-vars
```

**Update via AWS CLI:**
```bash
aws secretsmanager update-secret \
  --secret-id "certean-monitor/env-vars" \
  --secret-string '{
    "VITE_AUTH0_DOMAIN": "new-value",
    ...
  }' \
  --region eu-west-1
```

**Update via AWS Console:**
1. Go to **AWS Secrets Manager** → Find `certean-monitor/env-vars`
2. Click **Retrieve secret value** → **Edit**
3. Update JSON values
4. Click **Save**
5. **Redeploy** Amplify app (secrets are fetched on each build)

---

## How It Works

1. **During build**, `amplify.yml` checks if `SECRET_NAME` is set
2. If set, it runs `scripts/fetch-env-from-secrets.sh`
3. Script fetches secret from AWS Secrets Manager
4. Parses JSON and exports each variable
5. Variables are available when `npm run build` runs
6. Vite embeds them into the built JavaScript

---

## Troubleshooting

**"AccessDeniedException" error:**
- Check IAM permissions on Amplify service role
- Verify resource ARN matches your secret ARN
- Ensure region is correct

**"ResourceNotFoundException" error:**
- Verify secret name matches `SECRET_NAME` variable
- Check secret exists in the correct region
- Use `aws secretsmanager list-secrets` to find it

**Variables not appearing in build:**
- Check build logs for fetch script output
- Verify `SECRET_NAME` is set in Amplify Console
- Ensure secret JSON has correct key names (must start with `VITE_`)

**Secret values not updating:**
- Secrets are fetched on each build
- After updating secret, **redeploy** Amplify app
- Check build logs to confirm new values are fetched

---

## Security Best Practices

1. **Use Secrets Manager for sensitive values** (API keys, client secrets)
2. **Use Amplify Console for non-sensitive values** (URLs, feature flags)
3. **Rotate secrets regularly** (update secret, redeploy app)
4. **Use least privilege IAM policies** (only `GetSecretValue` permission)
5. **Enable CloudTrail** to audit secret access

---

## Cost

- **AWS Secrets Manager:** $0.40 per secret per month + $0.05 per 10,000 API calls
- **For this use case:** ~$0.40/month (very minimal API calls)

---

## Alternative: Multiple Secrets

If you want to separate secrets by environment:

```bash
# Production secrets
aws secretsmanager create-secret \
  --name "certean-monitor/prod/env-vars" \
  ...

# Staging secrets
aws secretsmanager create-secret \
  --name "certean-monitor/staging/env-vars" \
  ...
```

Then set `SECRET_NAME` per branch in Amplify Console.

