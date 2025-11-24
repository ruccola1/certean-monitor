# Email Notifications - Local Server Setup

**Date:** November 24, 2025  
**Status:** ✅ Complete and Ready

---

## Overview

Email notifications are now implemented **locally in certean-monitor** with a simple Express server, completely separate from certean-ai.

### Architecture

```
┌─────────────────┐
│  React Frontend │
│  (localhost:5173│
└────────┬────────┘
         │ 1. UI notification (instant)
         │ 2. Email API call
         ↓
┌─────────────────┐
│  Express Server │
│  (localhost:3001│
└────────┬────────┘
         │ Send email
         ↓
┌─────────────────┐
│  Resend API     │
│  (resend.com)   │
└─────────────────┘
```

---

## Features

✅ **Local Email Server** - Simple Express.js server in certean-monitor  
✅ **Resend Integration** - Professional HTML emails  
✅ **Instant UI Feedback** - Notifications show immediately  
✅ **Background Email Sending** - Non-blocking  
✅ **Beautiful Email Templates** - Branded with Certean styling  
✅ **Priority Levels** - Low, medium, high priority  
✅ **Product Context** - Product name and step info in emails  
✅ **No Backend Dependency** - Independent from certean-ai  

---

## Setup Instructions

### 1. Get Resend API Key

**Option A: Use Existing Key from certean.com (Recommended)**
- Copy your existing Resend API key from certean.com
- Domain (certean.com) already verified
- No additional setup needed

**Option B: Create New Key**
1. Go to https://resend.com/api-keys
2. Click "Create API Key"
3. Name: "Certean Monitor Notifications"
4. Copy the key (starts with `re_`)

### 2. Configure Environment Variables

Edit `.env` file in certean-monitor root:

```bash
# Resend API Key
RESEND_API_KEY=re_your_api_key_here

# Sender email (must be from verified domain)
RESEND_FROM_EMAIL=notifications@certean.com

# Frontend URL (for email links)
FRONTEND_URL=http://localhost:5173

# Server port (optional)
PORT=3001
```

### 3. Start the Email Server

**Option A: Run both frontend and server**
```bash
cd /Users/nicolaszander/Desktop/certean/dev/certean-monitor
npm run dev:all
```

This starts:
- Frontend on `http://localhost:5173`
- Email server on `http://localhost:3001`

**Option B: Run separately**

Terminal 1 (Frontend):
```bash
npm run dev
```

Terminal 2 (Email Server):
```bash
npm run dev:server
```

### 4. Verify It's Working

When the server starts, you should see:
```
🚀 Certean Monitor server running on port 3001
📧 Email service: ✅ Enabled (Resend)
🌐 Frontend URL: http://localhost:5173
```

If you see:
```
📧 Email service: ⚠️  Disabled (no API key)
```

Then `RESEND_API_KEY` is not set in `.env`

---

## How It Works

### When You Trigger a Notification

1. **Instant UI Notification** - Shows in topbar immediately
2. **Email API Call** - Frontend calls `http://localhost:3001/api/email/notification`
3. **Email Sent** - Server sends email via Resend
4. **User Receives Email** - Professional HTML email with branding

### Email Content

**Subject:** `Certean Monitor ✓ Product Analysis Complete`

**Body Includes:**
- Header with Certean branding (color-coded by type)
- Priority badge (if high priority)
- Notification title and message
- Product name (if applicable)
- Step number and name (if applicable)
- "View in Dashboard" button
- Footer with Certean branding

---

## Files Created

### Backend Server (New)

```
certean-monitor/
├── server/
│   ├── index.js                    [NEW] - Express server entry point
│   ├── routes/
│   │   └── email.js                [NEW] - Email notification routes
│   └── services/
│       └── emailService.js         [NEW] - Resend email service
├── .env                            [NEW] - Email configuration
└── EMAIL_NOTIFICATIONS_SETUP.md   [NEW] - This file
```

### Frontend (Modified)

```
certean-monitor/
├── src/
│   └── hooks/
│       └── useNotifications.ts     [MODIFIED] - Calls local email server
└── package.json                    [MODIFIED] - Added express, cors, dotenv
```

---

## API Reference

### POST /api/email/notification

Send email notification to specified recipients.

**Request:**
```json
{
  "to": ["user@example.com"],
  "type": "success",
  "title": "Product Analysis Complete",
  "message": "Your product compliance analysis finished successfully",
  "productName": "Smart Watch Pro",
  "step": 0,
  "priority": "medium"
}
```

**Response (Success):**
```json
{
  "success": true,
  "emailsSent": 1,
  "message": "Email sent to 1 recipient(s)"
}
```

**Response (Error):**
```json
{
  "success": false,
  "error": "Email service not configured"
}
```

### GET /health

Check server status and email service availability.

**Response:**
```json
{
  "status": "ok",
  "service": "certean-monitor-server",
  "timestamp": "2025-11-24T12:34:56.789Z",
  "emailServiceEnabled": true
}
```

---

## Testing

### 1. Test Email Server

```bash
# Check health
curl http://localhost:3001/health

# Should return:
# {"status":"ok","emailServiceEnabled":true,...}
```

### 2. Test Email Sending

```bash
curl -X POST http://localhost:3001/api/email/notification \
  -H "Content-Type: application/json" \
  -d '{
    "to": ["your-email@example.com"],
    "type": "info",
    "title": "Test Notification",
    "message": "Testing email delivery from certean-monitor",
    "priority": "medium"
  }'
```

Check your inbox for the email!

### 3. Test from UI

1. Start both frontend and server (`npm run dev:all`)
2. Add a product and run analysis
3. When step completes:
   - ✓ Notification appears in UI
   - ✓ Email sent to your inbox
   - ✓ Check server logs for confirmation

---

## Troubleshooting

### Issue: "Email service not enabled" in logs

**Solution:** Add `RESEND_API_KEY` to `.env` file

### Issue: "Email server not available" in console

**Solution:** Start the email server with `npm run dev:server`

### Issue: "403 Forbidden" from Resend

**Solution:** 
- Verify API key is correct
- Check sender email is from verified domain (certean.com)

### Issue: Emails go to spam

**Solution:**
- Verify domain DNS records in Resend dashboard
- Ensure SPF and DKIM are configured
- certean.com should already be verified

### Issue: Server won't start on port 3001

**Solution:**
```bash
# Kill any process using port 3001
lsof -ti:3001 | xargs kill -9

# Or change port in .env
PORT=3002
```

---

## Package Scripts

```json
{
  "dev": "vite",                    // Start frontend only
  "dev:server": "node server/index.js",  // Start email server only
  "dev:all": "npm run dev:server & npm run dev",  // Start both
  "server": "node server/index.js",  // Production server
  "build": "tsc -b && vite build"   // Build frontend
}
```

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `RESEND_API_KEY` | Yes | - | Resend API key for sending emails |
| `RESEND_FROM_EMAIL` | No | `notifications@certean.com` | Sender email address |
| `FRONTEND_URL` | No | `http://localhost:5173` | Frontend URL for email links |
| `PORT` | No | `3001` | Server port |

---

## Production Deployment

### 1. Build Frontend

```bash
npm run build
```

### 2. Start Email Server

```bash
# Set production environment variables
export RESEND_API_KEY=re_your_production_key
export RESEND_FROM_EMAIL=notifications@certean.com
export FRONTEND_URL=https://monitor.certean.com
export PORT=3001

# Start server
npm run server
```

### 3. Use Process Manager (Optional)

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server/index.js --name certean-monitor-email

# Save process list
pm2 save

# Setup startup script
pm2 startup
```

---

## Security Considerations

✅ **API Key Security** - Never commit `.env` to git  
✅ **CORS Configuration** - Only allows localhost origins  
✅ **No Authentication on Local Server** - Only runs locally  
⚠️ **Add Auth for Production** - Implement API key authentication  
⚠️ **Rate Limiting** - Consider adding rate limits  
⚠️ **Input Validation** - Currently basic, enhance for production  

---

## Benefits vs. certean-ai Backend

✅ **Simpler Setup** - No Auth0 Management API needed  
✅ **Faster Development** - No backend restart needed  
✅ **Independent** - Not coupled to certean-ai  
✅ **Easier Debugging** - Local server, easy to monitor  
✅ **Flexible** - Can customize without affecting certean-ai  

❌ **Limitation** - Only sends to current user (not all company users)

**Note:** If you need to send emails to all users in a company, you'll need Auth0 user lookup (which would require certean-ai backend integration).

---

## Future Enhancements

### For Later

1. **Multiple Recipients** - Send to all company users (requires Auth0)
2. **Email Preferences** - User opt-in/opt-out
3. **Notification Queue** - Redis queue for reliability
4. **Email Templates** - Multiple template options
5. **Analytics** - Track open rates, click rates
6. **Unsubscribe** - Add unsubscribe links
7. **Authentication** - Secure the email API

---

## Summary

✅ **Email Server** - Running locally in certean-monitor  
✅ **Resend Integration** - Professional email delivery  
✅ **Simple Setup** - Just add API key to .env  
✅ **Independent** - No certean-ai dependency  
✅ **Ready to Use** - Start with `npm run dev:all`  

---

## Quick Start Checklist

- [ ] Get Resend API key (reuse from certean.com if possible)
- [ ] Add `RESEND_API_KEY` to `.env` file
- [ ] Run `npm run dev:all` to start both frontend and server
- [ ] Look for "✅ Enabled (Resend)" in server logs
- [ ] Trigger a notification in the UI
- [ ] Check your email inbox
- [ ] Celebrate! 🎉

---

**Status:** Ready to use! Just add your Resend API key to `.env` and start the servers.

