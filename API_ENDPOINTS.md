# API Endpoints Reference

This document specifies the API endpoints that the **certean-monitor** frontend expects from the **certean-ai** backend.

## Base URL

```
http://localhost:8000
```

## ⚠️ Database Architecture (CRITICAL)

**Compliance Data Storage:**
- ✅ **Compliance elements** → Stored ONLY in `c_monitor_shared` database
- ✅ **Compliance updates** → Stored ONLY in `c_monitor_shared` database
- ✅ **Products** → Stored in `c_monitor_{client_id}` with **ID references** to shared compliance elements
- ❌ **NEVER** duplicate compliance data in client databases

**API Implementation Pattern:**
1. Products API → Query `c_monitor_{client_id}` for products
2. Join with shared DB → Use product's `compliance_element_ids` to fetch from `c_monitor_shared`
3. Return combined data to frontend

**See:** [ARCHITECTURE.md](./ARCHITECTURE.md) for complete details.

## Authentication

All requests (except login) must include:
```
Authorization: Bearer {auth0_jwt_token}
```

The JWT should contain:
- `user_id` - The authenticated user's ID
- `client_id` - The client/organization ID for database switching

## Response Format

All endpoints return:
```typescript
{
  "success": boolean,
  "data"?: any,
  "error"?: string,
  "message"?: string
}
```

---

## 🔐 Authentication Endpoints

### POST /api/auth/login
**Purpose**: Verify Auth0 token and get user/client data

**Request**:
```json
{
  "token": "auth0_jwt_token"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_123",
      "email": "user@example.com",
      "name": "John Doe",
      "role": "client_admin",
      "clientId": "client_abc"
    },
    "client": {
      "id": "client_abc",
      "name": "Acme Corp",
      "subscriptionTier": "professional"
    }
  }
}
```

### GET /api/auth/me
**Purpose**: Get current authenticated user

**Response**: Same as login

---

## 📊 Dashboard Endpoints

### GET /api/dashboard/summary
**Purpose**: Get AI-generated compliance summary (uses OpenAI from certean-ai)

**Response**:
```json
{
  "success": true,
  "data": {
    "text": "Your products currently have 12 active compliance requirements across 3 markets. There are 4 upcoming deadlines in the next 90 days...",
    "generatedAt": "2025-11-20T14:30:00Z"
  }
}
```

**Backend Logic**:
1. Query client's products and compliance elements
2. Generate summary using OpenAI (from certean-ai existing integration)
3. Cache for 1 hour

### GET /api/dashboard/upcoming-updates
**Purpose**: List compliance updates with deadlines < 3 months AND > today

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "update_123",
      "title": "EU MDR Certificate Renewal",
      "date": "2026-01-15",
      "type": "deadline",
      "complianceElement": "EU MDR 2017/745",
      "daysUntil": 56
    }
  ]
}
```

**Backend Logic**:
```python
today = datetime.now()
three_months = today + timedelta(days=90)

updates = db.compliance_update.find({
  "date": {
    "$gt": today,
    "$lt": three_months
  }
})
```

### GET /api/dashboard/chart-data
**Purpose**: Compliance updates grouped by type for bar chart

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-11",
      "legislation": 5,
      "standard": 3,
      "marking": 2
    },
    {
      "date": "2025-12",
      "legislation": 7,
      "standard": 4,
      "marking": 1
    }
  ]
}
```

---

## 📦 Product Endpoints

### POST /api/products/bulk
**Purpose**: Create multiple products

**Request**:
```json
{
  "products": [
    {
      "name": "Smart Thermostat",
      "description": "IoT temperature control device",
      "type": "existing",
      "urls": ["https://example.com/product"],
      "markets": ["EU", "US"]
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_123",
      "name": "Smart Thermostat",
      "status": "pending",
      "step0Status": "pending",
      "step1Status": "pending",
      "step2Status": "pending",
      "createdAt": "2025-11-20T14:30:00Z"
    }
  ]
}
```

**Backend Logic**:
1. Validate subscription limits (Free: 1 product max, Professional: 5 max)
2. Insert into `c_monitor_{client_id}.products` collection
3. Return product objects

### GET /api/products
**Purpose**: Get all products for current client

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "prod_123",
      "name": "Smart Thermostat",
      "status": "complete",
      "step0Status": "completed",
      "step1Status": "completed",
      "step2Status": "completed",
      "components": [...],
      "createdAt": "2025-11-20T14:30:00Z",
      "updatedAt": "2025-11-20T15:45:00Z"
    }
  ]
}
```

### GET /api/products/{id}
**Purpose**: Get single product with components

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "prod_123",
    "name": "Smart Thermostat",
    "description": "...",
    "components": [
      {
        "id": "comp_456",
        "name": "Temperature Sensor",
        "parentId": null,
        "materials": ["Silicon", "Copper"],
        "step1Result": {
          "complianceAssessment": "...",
          "riskAreas": ["EMC", "Safety"],
          "testingRequirements": ["EN 60730-1"]
        }
      }
    ]
  }
}
```

### PUT /api/products/{id}
**Purpose**: Update product

**Request**:
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

### DELETE /api/products/{id}
**Purpose**: Delete product

---

## 🔄 Pipeline Step Endpoints

### POST /api/products/{id}/step0
**Purpose**: Execute Step 0 (Product Decomposition)

**Request**: None (product ID in URL)

**Response**:
```json
{
  "success": true,
  "data": {
    "jobId": "job_789",
    "status": "running"
  }
}
```

**Backend Logic**:
1. Queue Step 0 task
2. Emit Socket.io event: `product_status_update`
3. When complete, update `products.step0Status = "completed"`
4. Store components in `components` collection

### PUT /api/products/{id}/step0/review
**Purpose**: Approve Step 0 results (with optional edits)

**Request**:
```json
{
  "components": [
    {
      "id": "comp_456",
      "name": "Temperature Sensor",
      "description": "Edited description",
      "technicalSpecifications": "...",
      "materials": ["Silicon", "Copper"]
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "message": "Step 0 approved. Step 1 will begin automatically."
}
```

**Backend Logic**:
1. Update components with client edits
2. Mark `step0Status = "completed"`
3. Automatically queue Step 1

### POST /api/products/{id}/step1
**Purpose**: Execute Step 1 (Compliance Assessment per component)

### PUT /api/products/{id}/step1/review
**Purpose**: Approve Step 1 results

### POST /api/products/{id}/step2
**Purpose**: Execute Step 2 (Identify Compliance Elements)

### PUT /api/products/{id}/step2/review
**Purpose**: Approve Step 2 results

**Request**:
```json
{
  "complianceElements": [
    {
      "name": "EN 60730-1",
      "type": "standard",
      "applicability": "Mandatory for EU",
      "isMandatory": true
    }
  ]
}
```

**Backend Logic**:
1. For each element, check if exists in `c_monitor_shared.compliance_element`
2. If EXISTS: Link to client's product
3. If NEW: Run Step 4 & 5 to find sources and add to shared DB
4. Mark `step2Status = "completed"`

---

## 🧩 Component Endpoints

### GET /api/products/{id}/components
**Purpose**: Get component tree

### PUT /api/components/{id}
**Purpose**: Update component

### POST /api/components
**Purpose**: Add new component

### DELETE /api/components/{id}
**Purpose**: Remove component

---

## 📋 Compliance Endpoints (Shared DB)

### GET /api/compliance/elements
**Purpose**: Search shared compliance elements

**Query Params**:
- `search` - Text search
- `type` - regulation | standard | certification | marking
- `market` - Country code

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "elem_123",
      "name": "EU MDR 2017/745",
      "type": "regulation",
      "description": "Medical Device Regulation",
      "markets": ["EU"]
    }
  ]
}
```

**Backend**: Query `c_monitor_shared.compliance_element`

### GET /api/compliance/updates
**Purpose**: Search compliance updates

**Query Params**:
- `elementId` - Filter by compliance element
- `fromDate` - Start date
- `toDate` - End date

---

## 🔔 Notification Endpoints

### GET /api/notifications
**Purpose**: Get client notifications

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "notif_123",
      "type": "deadline_approaching",
      "title": "EU MDR Deadline in 45 days",
      "message": "...",
      "isRead": false,
      "priority": "high",
      "createdAt": "2025-11-20T14:30:00Z"
    }
  ]
}
```

### PUT /api/notifications/{id}/read
**Purpose**: Mark notification as read

### DELETE /api/notifications/{id}
**Purpose**: Delete notification

---

## ⚙️ Settings Endpoints

### GET /api/settings/client
**Purpose**: Get client settings

**Response**:
```json
{
  "success": true,
  "data": {
    "name": "Acme Corp",
    "logo": "https://...",
    "timezone": "Europe/Amsterdam",
    "defaultMarkets": ["EU", "US"],
    "notificationFrequency": "daily",
    "language": "en"
  }
}
```

### PUT /api/settings/client
**Purpose**: Update client settings

### POST /api/settings/client/logo
**Purpose**: Upload logo (multipart/form-data)

---

## 💳 Subscription Endpoints

### GET /api/subscription/status
**Purpose**: Get subscription info

**Response**:
```json
{
  "success": true,
  "data": {
    "tier": "professional",
    "status": "active",
    "currentPeriodEnd": "2025-12-20",
    "usage": {
      "productsCount": 3,
      "tokensUsed": 45000,
      "costsThisMonth": 12.50
    },
    "limits": {
      "maxProducts": 5,
      "maxUsers": 5,
      "tokensPerProduct": 200000
    }
  }
}
```

### POST /api/subscription/checkout
**Purpose**: Create Stripe checkout session

**Request**:
```json
{
  "tier": "professional"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "sessionId": "stripe_session_id",
    "url": "https://checkout.stripe.com/..."
  }
}
```

### POST /api/subscription/portal
**Purpose**: Create Stripe customer portal session

---

## 👥 Admin Endpoints (Client Admin)

### GET /api/admin/users
**Purpose**: List team members

### POST /api/admin/users/invite
**Purpose**: Invite new user

### DELETE /api/admin/users/{id}
**Purpose**: Remove user

### PUT /api/admin/users/{id}/role
**Purpose**: Change user role

---

## 🔧 Super Admin Endpoints

### GET /api/superadmin/clients
**Purpose**: List all clients

### GET /api/superadmin/clients/{id}
**Purpose**: Get client details with usage stats

### GET /api/superadmin/analytics
**Purpose**: Platform-wide analytics

### GET /api/superadmin/compliance-monitor
**Purpose**: Monitor shared DB changes

---

## 🔌 WebSocket Events (Socket.io)

### Client → Server

```javascript
socket.emit('subscribe', { clientId: 'client_abc' });
```

### Server → Client

**Product status update**:
```javascript
socket.emit('product_status_update', {
  productId: 'prod_123',
  status: 'processing',
  step0Status: 'running',
  progress: 45
});
```

**Compliance notification**:
```javascript
socket.emit('compliance_notification', {
  type: 'deadline_approaching',
  title: 'EU MDR Deadline in 45 days',
  complianceElementId: 'elem_123'
});
```

---

## 🚨 Error Responses

```json
{
  "success": false,
  "error": "Product limit reached for Free tier",
  "message": "Upgrade to Professional to add more products"
}
```

**HTTP Status Codes**:
- `200` - Success
- `400` - Bad request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `429` - Rate limit exceeded
- `500` - Server error

---

## 📌 Implementation Notes

### Multi-tenancy
Every request includes `client_id` from JWT. Backend must:
1. Parse JWT to extract `client_id`
2. Switch to `c_monitor_{client_id}` database
3. Ensure queries only access client's data

### Shared DB Access
`c_monitor_shared` is read-only for clients:
- Read: `compliance_element`, `compliance_update`
- Write: Only via Step 4/5 when new elements discovered

### Token Capping
Track token usage per product:
- Free: 50K tokens max
- Professional: 200K tokens max
- Return error if limit exceeded

### Email Notifications
Backend should send emails when:
1. Compliance update is modified (upsert)
2. Update date is in future
3. Update date is within 3 months
4. Client has `notificationFrequency != "disabled"`

Batch emails based on frequency setting.

---

This completes the API specification for **certean-monitor** frontend integration.



