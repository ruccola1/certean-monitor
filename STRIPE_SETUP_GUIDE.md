# Stripe Integration Setup Guide

## ✅ What's Been Built

### Frontend (certean-monitor)
1. **Pricing Page** (`/pricing`) - Tier selection with 3 plans
2. **Billing Dashboard** (`/billing`) - Subscription management
3. **Type Definitions** - Full TypeScript types for subscriptions
4. **Subscription Plans Config** - Centralized plan definitions

### Status
- ✅ Frontend UI complete
- ⏳ Backend integration needed
- ⏳ Stripe account setup needed

---

## 🚀 Next Steps: Stripe Setup

### Step 1: Create Stripe Account

1. Go to [https://dashboard.stripe.com/register](https://dashboard.stripe.com/register)
2. Sign up for a Stripe account
3. Complete business verification

### Step 2: Create Products in Stripe Dashboard

Go to **Products** → **Add Product** and create:

#### Professional Plan
- **Name**: Certean Monitor - Professional
- **Description**: 50 products/month, full pipeline, priority support
- **Pricing**: $49 USD / month recurring
- **Copy the Price ID**: `price_xxx` (starts with `price_`)

#### Enterprise Plan
- **Name**: Certean Monitor - Enterprise
- **Description**: Unlimited products, full features, dedicated support
- **Pricing**: $199 USD / month recurring
- **Copy the Price ID**: `price_yyy` (starts with `price_`)

### Step 3: Get API Keys

Go to **Developers** → **API Keys**:

1. **Publishable key**: `pk_test_xxx` or `pk_live_xxx`
2. **Secret key**: `sk_test_xxx` or `sk_live_xxx`

### Step 4: Add Environment Variables

#### Frontend (.env)
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_STRIPE_PRICE_PROFESSIONAL=price_xxx
VITE_STRIPE_PRICE_ENTERPRISE=price_yyy
```

#### Backend (.env)
```bash
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx  # From Step 5
```

### Step 5: Set Up Webhooks

Go to **Developers** → **Webhooks** → **Add endpoint**:

- **Endpoint URL**: `https://your-api-url.com/api/webhooks/stripe`
- **Events to listen for**:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`

- **Copy the Webhook Secret**: `whsec_xxx`

---

## 💻 Backend Implementation Needed

### Files to Create

#### 1. `certean-ai/backend/api/stripe_routes.py`

```python
from fastapi import APIRouter, HTTPException, Request
from backend.database import MongoDB
import stripe
import os

router = APIRouter(prefix="/api/stripe", tags=["stripe"])
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

@router.post("/create-checkout-session")
async def create_checkout_session(request: dict):
    \"\"\"Create Stripe Checkout session for subscription\"\"\"
    try:
        tier = request.get("tier")
        user_id = request.get("user_id")
        client_id = request.get("client_id")
        
        # Get price ID from tier
        price_id = get_price_id_for_tier(tier)
        
        # Create Stripe Checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price": price_id,
                "quantity": 1
            }],
            mode="subscription",
            success_url=f"{os.getenv('FRONTEND_URL')}/billing?success=true",
            cancel_url=f"{os.getenv('FRONTEND_URL')}/pricing?canceled=true",
            client_reference_id=f"{client_id}:{user_id}",
            metadata={
                "client_id": client_id,
                "user_id": user_id,
                "tier": tier
            }
        )
        
        return {"checkout_url": session.url}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/create-portal-session")
async def create_portal_session(request: dict):
    \"\"\"Create Stripe Customer Portal session\"\"\"
    try:
        customer_id = request.get("customer_id")
        
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{os.getenv('FRONTEND_URL')}/billing"
        )
        
        return {"portal_url": session.url}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def get_price_id_for_tier(tier: str) -> str:
    price_ids = {
        "professional": os.getenv("STRIPE_PRICE_PROFESSIONAL"),
        "enterprise": os.getenv("STRIPE_PRICE_ENTERPRISE")
    }
    return price_ids.get(tier)
```

#### 2. `certean-ai/backend/api/webhook_routes.py`

```python
from fastapi import APIRouter, Request, HTTPException
from backend.database import MongoDB
import stripe
import os
from datetime import datetime

router = APIRouter(prefix="/api/webhooks", tags=["webhooks"])
stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET")

@router.post("/stripe")
async def stripe_webhook(request: Request):
    \"\"\"Handle Stripe webhooks\"\"\"
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    
    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
    
    # Handle different event types
    if event["type"] == "checkout.session.completed":
        await handle_checkout_completed(event["data"]["object"])
    elif event["type"] == "customer.subscription.updated":
        await handle_subscription_updated(event["data"]["object"])
    elif event["type"] == "customer.subscription.deleted":
        await handle_subscription_canceled(event["data"]["object"])
    elif event["type"] == "invoice.paid":
        await handle_invoice_paid(event["data"]["object"])
    
    return {"success": True}

async def handle_checkout_completed(session):
    \"\"\"Create subscription in MongoDB after successful checkout\"\"\"
    client_id, user_id = session["client_reference_id"].split(":")
    
    subscription = {
        "userId": user_id,
        "clientId": client_id,
        "tier": session["metadata"]["tier"],
        "status": "active",
        "stripeCustomerId": session["customer"],
        "stripeSubscriptionId": session["subscription"],
        "currentPeriodStart": datetime.utcnow().isoformat(),
        "currentPeriodEnd": datetime.utcnow().isoformat(),  # Update from Stripe
        "cancelAtPeriodEnd": False,
        "createdAt": datetime.utcnow().isoformat(),
        "updatedAt": datetime.utcnow().isoformat()
    }
    
    db = MongoDB.client["c_monitor_shared"]
    await db["subscriptions"].insert_one(subscription)
```

#### 3. `certean-ai/backend/api/billing_routes.py`

```python
from fastapi import APIRouter, HTTPException
from backend.database import MongoDB
from bson import ObjectId

router = APIRouter(prefix="/api/billing", tags=["billing"])

@router.get("/{client_id}")
async def get_billing_info(client_id: str):
    \"\"\"Get subscription and billing info for client\"\"\"
    try:
        db = MongoDB.client["c_monitor_shared"]
        
        # Get subscription
        subscription = await db["subscriptions"].find_one({"clientId": client_id})
        
        # Get invoices
        invoices = await db["invoices"].find(
            {"clientId": client_id}
        ).sort("createdAt", -1).limit(10).to_list(length=10)
        
        # Calculate usage stats
        products_db = MongoDB.client[f"c_monitor_{client_id}"]
        products_count = await products_db["products"].count_documents({
            "createdAt": {"$gte": subscription["currentPeriodStart"]}
        })
        
        return {
            "subscription": subscription,
            "invoices": invoices,
            "usage": {
                "productsCreated": products_count,
                "productsLimit": get_limit_for_tier(subscription["tier"]),
                "currentPeriodStart": subscription["currentPeriodStart"],
                "currentPeriodEnd": subscription["currentPeriodEnd"]
            }
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

### MongoDB Schema

Add to `c_monitor_shared` database:

```javascript
// subscriptions collection
{
  "_id": ObjectId,
  "userId": "string",
  "clientId": "string",
  "tier": "free|professional|enterprise",
  "status": "active|canceled|past_due",
  "stripeCustomerId": "cus_xxx",
  "stripeSubscriptionId": "sub_xxx",
  "currentPeriodStart": "ISO date",
  "currentPeriodEnd": "ISO date",
  "cancelAtPeriodEnd": boolean,
  "createdAt": "ISO date",
  "updatedAt": "ISO date"
}

// invoices collection
{
  "_id": ObjectId,
  "clientId": "string",
  "subscriptionId": ObjectId,
  "stripeInvoiceId": "in_xxx",
  "amount": 49.00,
  "currency": "usd",
  "status": "paid|open|void",
  "invoiceUrl": "https://stripe.com/...",
  "paidAt": "ISO date",
  "createdAt": "ISO date"
}
```

---

## 🧪 Testing

### Test Mode
1. Use test API keys (`pk_test_`, `sk_test_`)
2. Test card number: `4242 4242 4242 4242`
3. Any future expiry date
4. Any 3-digit CVC

### Test Workflow
1. Go to `/pricing`
2. Click "Subscribe to Professional"
3. Complete Stripe Checkout
4. Verify redirect to `/billing`
5. Check subscription is active
6. Try "Manage Billing" button (opens Stripe Portal)

---

## 📚 Additional Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/checkout)
- [Stripe Customer Portal](https://stripe.com/docs/billing/subscriptions/customer-portal)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Testing Stripe](https://stripe.com/docs/testing)

---

## ⚠️ Production Checklist

Before going live:
- [ ] Switch to live API keys (`pk_live_`, `sk_live_`)
- [ ] Update webhook endpoint to production URL
- [ ] Test subscription flow end-to-end
- [ ] Set up billing alerts in Stripe
- [ ] Configure tax collection (if needed)
- [ ] Add terms of service link to checkout
- [ ] Test cancellation and refund flow

