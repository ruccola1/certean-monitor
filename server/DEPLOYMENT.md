# Email Server Deployment Guide

This guide will help you deploy the Certean Monitor email notification server.

## Overview

The email server is a simple Express.js application that sends email notifications via Resend. It needs to be publicly accessible so your production frontend at `https://monitor.certean.com` can reach it.

## Prerequisites

- Resend API key (already configured: `re_c8gDmB9T_...`)
- Access to AWS Console or Railway account

---

## Option 1: AWS App Runner (Recommended)

Since you already have `certean-ai` on AWS App Runner, this is the most consistent option.

### Step-by-Step Deployment

1. **Prepare the Code**
   - The `server` folder is ready to deploy
   - All configuration files are already created

2. **Deploy to AWS App Runner**

   **Via AWS Console:**

   a. Go to [AWS App Runner Console](https://console.aws.amazon.com/apprunner)

   b. Click **Create service**

   c. **Source:**
      - Repository type: **Source code repository**
      - Connect to your GitHub repository
      - Repository: `certean-monitor`
      - Branch: `main`
      - Source directory: `server`

   d. **Build settings:**
      - Configuration file: **Use configuration file**
      - Configuration file location: `server/apprunner.yaml`

   e. **Service settings:**
      - Service name: `certean-monitor-email-server`
      - Port: `3001`

   f. **Environment variables** (Click "Add environment variable" for each):
      ```
      RESEND_API_KEY=re_c8gDmB9T_FhbaibQuE7aAPeyVLDjSqgAt
      RESEND_FROM_EMAIL=notifications@certean.com
      FRONTEND_URL=https://monitor.certean.com
      PORT=3001
      ```

   g. Click **Create & deploy**

3. **Get Your Service URL**
   - After deployment completes, copy the service URL
   - It will look like: `https://xyz123.us-east-1.awsapprunner.com`

4. **Update AWS Amplify Environment Variables**

   a. Go to [AWS Amplify Console](https://console.aws.amazon.com/amplify)

   b. Select your `certean-monitor` app

   c. Go to **Environment variables** (in left sidebar)

   d. Add new variable:
      - Variable name: `VITE_EMAIL_API_URL`
      - Value: `https://xyz123.us-east-1.awsapprunner.com` (your App Runner URL)

   e. **Redeploy** your frontend to pick up the new environment variable

5. **Test the Setup**
   ```bash
   # Test the health endpoint
   curl https://your-apprunner-url.awsapprunner.com/health

   # Should return:
   # {"status":"ok","service":"certean-monitor-server","emailServiceEnabled":true}
   ```

---

## Option 2: Railway (Faster Alternative)

Railway is simpler and faster to set up, with a generous free tier.

### Step-by-Step Deployment

1. **Install Railway CLI**
   ```bash
   npm i -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Deploy from the server directory**
   ```bash
   cd server
   railway init
   # Follow prompts to create a new project

   railway up
   # This will deploy your server
   ```

4. **Set Environment Variables**
   ```bash
   railway variables set RESEND_API_KEY=re_c8gDmB9T_FhbaibQuE7aAPeyVLDjSqgAt
   railway variables set RESEND_FROM_EMAIL=notifications@certean.com
   railway variables set FRONTEND_URL=https://monitor.certean.com
   railway variables set PORT=3001
   ```

5. **Get Your Service URL**
   ```bash
   railway open
   # This opens Railway dashboard
   # Copy the deployment URL (e.g., https://your-app.up.railway.app)
   ```

6. **Update AWS Amplify Environment Variables**
   - Same as Option 1, step 4 above
   - Use your Railway URL instead of App Runner URL

---

## After Deployment

### Verify Email Sending Works

1. Visit your production site: `https://monitor.certean.com`

2. Trigger a notification (e.g., complete a compliance step)

3. Check your email for the notification

4. Check browser console for success message:
   ```
   ✅ Email notification sent successfully
   ```

### Monitor Logs

**AWS App Runner:**
```bash
# View logs in AWS Console
# App Runner > Your Service > Logs
```

**Railway:**
```bash
railway logs
```

---

## Troubleshooting

### CORS Errors
- The backend is already configured to allow `https://monitor.certean.com`
- If you use a different domain, update `server/index.js` line 21

### Email Not Sending
1. Check Resend API key is set correctly
2. Verify Resend account is active
3. Check server logs for errors

### Health Check Failing
```bash
curl https://your-backend-url/health
```
Should return `{"status":"ok",...}`

---

## Security Notes

- Never commit `.env` files with secrets to Git
- Use environment variables for all sensitive data
- The Resend API key is already configured in your AWS environment
- CORS is configured to only allow requests from `monitor.certean.com`

---

## Cost Estimates

**AWS App Runner:**
- ~$5-10/month for a small service
- Pay per use (vCPU + memory)

**Railway:**
- Free tier: $5 credit/month
- Usually sufficient for low-traffic email server
- Upgrade to Hobby plan: $5/month for more resources

---

## Need Help?

If you encounter issues:
1. Check the health endpoint: `https://your-backend-url/health`
2. Review server logs in your deployment platform
3. Verify environment variables are set correctly
