# Email Service Migration: SendGrid → Resend

## Summary

The notification email service has been updated from **SendGrid** to **Resend** to maintain consistency with certean.com.

---

## Why the Change?

- **Consistency**: certean.com already uses Resend for contact forms
- **Simplified Management**: Use the same account/API key across all Certean services
- **Verified Domain**: certean.com is already verified in Resend
- **Cost Efficiency**: Share the same plan/quota across services

---

## What Changed

### Backend (certean-ai)

#### 1. Email Service (`backend/services/email_service.py`)

**Before (SendGrid):**
```python
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, To, From, Content

class EmailService:
    def __init__(self):
        self.client = SendGridAPIClient(settings.sendgrid_api_key)
```

**After (Resend):**
```python
import httpx

class EmailService:
    def __init__(self):
        self.api_key = settings.resend_api_key
        self.api_url = "https://api.resend.com/emails"
    
    async def send_notification_email(...):
        async with httpx.AsyncClient() as client:
            response = await client.post(
                self.api_url,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json"
                },
                json={
                    "from": f"Certean Monitor <{from_email}>",
                    "to": to_emails,
                    "subject": subject,
                    "html": html_content,
                    "text": text_content
                }
            )
```

#### 2. Configuration (`backend/config.py`)

**Before:**
```python
sendgrid_api_key: Optional[str] = None
sendgrid_from_email: Optional[str] = None
```

**After:**
```python
resend_api_key: Optional[str] = None
resend_from_email: Optional[str] = None
```

#### 3. Dependencies (`requirements.txt`)

**Before:**
```
sendgrid==6.11.0
```

**After:**
```
# Uses existing httpx (already in requirements.txt)
```

---

## Environment Variables

### Old (SendGrid)

```bash
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=notifications@certean.com
```

### New (Resend)

```bash
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=notifications@certean.com
```

---

## Setup Instructions

### 1. Get Resend API Key

**Option A: Use Existing (Recommended)**
- If you have Resend configured for certean.com, use the same API key
- No additional setup needed - domain already verified

**Option B: Create New**
- Go to https://resend.com/api-keys
- Create new API key
- Domain (certean.com) should already be verified

### 2. Update Environment Variables

Edit `/Users/nicolaszander/Desktop/certean/dev/certean-ai/.env`:

```bash
# Remove old SendGrid variables
# SENDGRID_API_KEY=...
# SENDGRID_FROM_EMAIL=...

# Add new Resend variables
RESEND_API_KEY=re_your_api_key_here
RESEND_FROM_EMAIL=notifications@certean.com
```

### 3. Restart Backend

```bash
# Stop current backend
pkill -f "uvicorn backend.main"

# Start with new configuration
cd /Users/nicolaszander/Desktop/certean/dev/certean-ai
python -m uvicorn backend.main:app --host 0.0.0.0 --port 8001 --reload
```

You should see in logs:
```
Resend email service initialized successfully
```

### 4. Test Email Sending

```bash
curl -X POST http://localhost:8001/api/notifications/ \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -d '{
    "client_id": "69220097bca3a5ba1420fee58",
    "type": "info",
    "title": "Test Notification",
    "message": "Testing Resend integration",
    "send_email": true
  }'
```

Check:
- ✓ Response shows `"email_sent": true`
- ✓ Check inbox for email
- ✓ Check Resend dashboard: https://resend.com/emails

---

## Benefits of Resend

### Compared to SendGrid:

1. **Simpler API**: RESTful JSON API (no SDK needed)
2. **Modern Developer Experience**: Better documentation, cleaner interface
3. **Unified Management**: Same account as certean.com
4. **Cost Effective**: Share quota across services
5. **No Extra Dependencies**: Uses existing httpx library

### Pricing:

- **Free**: 3,000 emails/month, 100 emails/day
- **Pro**: $20/month for 50,000 emails/month
- Can share plan with certean.com

---

## Verification

### Check Backend Logs

On startup, you should see:
```
✅ Resend email service initialized successfully
```

When sending notification:
```
✅ Email sent successfully to N recipients via Resend
```

### Check Resend Dashboard

- Go to https://resend.com/emails
- View all sent emails
- Check delivery status
- Monitor bounce rates

---

## Migration Checklist

- [x] Updated `email_service.py` to use Resend API
- [x] Updated `config.py` with Resend variables
- [x] Updated `requirements.txt` (removed sendgrid)
- [x] Updated `EMAIL_NOTIFICATION_SETUP.md`
- [x] Updated `EMAIL_NOTIFICATIONS_IMPLEMENTED.md`
- [x] Created `RESEND_MIGRATION.md`
- [ ] Set `RESEND_API_KEY` in `.env`
- [ ] Set `RESEND_FROM_EMAIL` in `.env`
- [ ] Restart backend
- [ ] Test email sending
- [ ] Verify emails arrive
- [ ] Check Resend dashboard

---

## Troubleshooting

### Issue: "Email service not enabled"

**Solution**: Set `RESEND_API_KEY` in `.env` file

### Issue: "403 Forbidden" from Resend

**Solution**: 
- Verify API key is correct
- Check sender email is from verified domain (certean.com)

### Issue: "Email goes to spam"

**Solution**:
- Verify domain DNS records in Resend dashboard
- Ensure SPF and DKIM are properly configured

### Issue: "No emails received"

**Solution**:
1. Check backend logs for errors
2. Verify users have `client_id` in Auth0
3. Check users have verified emails
4. Check Resend dashboard for delivery status

---

## Rollback (if needed)

If you need to revert to SendGrid:

1. Install SendGrid:
   ```bash
   pip install sendgrid==6.11.0
   ```

2. Revert code changes:
   ```bash
   git checkout backend/services/email_service.py
   git checkout backend/config.py
   ```

3. Update `.env`:
   ```bash
   SENDGRID_API_KEY=...
   SENDGRID_FROM_EMAIL=...
   ```

4. Restart backend

---

## Summary

✅ **Migration Complete**
- SendGrid → Resend
- Consistent with certean.com
- Same functionality, simpler setup
- Ready for configuration

📝 **Next Steps**
1. Add `RESEND_API_KEY` to `.env`
2. Add `RESEND_FROM_EMAIL` to `.env`
3. Restart backend
4. Test notification flow

🎯 **Benefit**
- Single email provider (Resend) across all Certean services
- Simplified management and billing
- No extra dependencies


