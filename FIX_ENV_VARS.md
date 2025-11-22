# How to Fix Environment Variables in Amplify

## The Problem:
Vite environment variables are baked into the JavaScript bundle at BUILD TIME.
If you add `VITE_BILLING_API_URL` after the build, it won't be available until you rebuild.

## Solution:

### Option 1: Redeploy (Easiest)
1. Go to AWS Amplify → Your app
2. Click "Build history" in left sidebar
3. Find the latest build
4. Click the three dots (...) → "Redeploy this version"
5. Wait 2-3 minutes for rebuild
6. Test again

### Option 2: Trigger New Build
1. Make a small change (add a comment to any file)
2. Commit and push
3. Amplify will automatically rebuild
4. Wait 2-3 minutes
5. Test again

## Verify It Worked:
After rebuild, check browser console:
- Should see calls to your billing service URL (not certean-ai)
- No more 404 errors for Stripe endpoints

## Environment Variables Checklist:
- ✅ `VITE_BILLING_API_URL` = Your billing App Runner URL
- ✅ `VITE_API_BASE_URL` = certean-ai App Runner URL
- ✅ All other VITE_* variables

**Remember: After adding/changing env vars, you MUST rebuild!**
