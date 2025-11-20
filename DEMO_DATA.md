# Demo Client Data - Supercase

## Client Information

**Client Name:** Supercase  
**Client ID:** `supercase_demo`  
**Database:** `c_monitor_supercase_demo`  
**Industry:** Product Manufacturing  
**Created:** 2025-01-20

---

## Users

### User 1: Nicolas Zander (Admin)

**Personal Information:**
- **Name:** Nicolas Zander
- **Email:** nicolas@supercase.se
- **Role:** Admin
- **User ID:** `user_nicolas_supercase`
- **Initials:** NZ
- **Phone:** +46 70 123 45 67
- **Department:** Compliance & Quality

**Auth0 User Setup:**
```json
{
  "email": "nicolas@supercase.se",
  "name": "Nicolas Zander",
  "user_metadata": {
    "client_id": "supercase_demo",
    "client_name": "Supercase",
    "role": "admin",
    "department": "Compliance & Quality"
  }
}
```

**Permissions:**
- ✅ Full product management
- ✅ Compliance monitoring
- ✅ User management
- ✅ Settings & configuration
- ✅ Reports & analytics

**Subscription:**
- **Tier:** Professional
- **Price:** €899/month
- **Features:**
  - 5 products
  - Unlimited markets
  - Unlimited compliance elements
  - 5 users
  - Real-time notifications
  - Background processing (3 concurrent)
  - Priority support

---

## Authentication Flow

### Login Process
1. User navigates to app (unauthenticated)
2. Redirected to `/login` page
3. Clicks "Sign In with Auth0"
4. Redirected to Auth0 Universal Login
5. Enters credentials (nicolas@supercase.se)
6. Auth0 validates and redirects to `/callback`
7. App processes auth callback
8. User redirected to `/dashboard`
9. Topbar displays "Supercase" and "Nicolas Zander" with avatar

### Token Claims
```json
{
  "sub": "auth0|user_id",
  "name": "Nicolas Zander",
  "email": "nicolas@supercase.se",
  "picture": "https://...",
  "https://certean-monitor.com/client_id": "supercase_demo",
  "https://certean-monitor.com/client_name": "Supercase",
  "https://certean-monitor.com/role": "admin",
  "https://certean-monitor.com/subscription": "professional"
}
```

---

## Sample Products (To Be Added)

### Product 1: Smart Home Speaker
- **Name:** Echo Home Pro
- **Category:** Electronics / Audio
- **Markets:** EU, US, UK
- **Status:** Active
- **Compliance Elements:**
  - CE Marking (EU)
  - FCC Certification (US)
  - UKCA Marking (UK)
  - RoHS Compliance
  - WEEE Directive
  - RED (Radio Equipment Directive)

### Product 2: Wireless Headphones
- **Name:** SoundWave X1
- **Category:** Electronics / Audio
- **Markets:** EU, US
- **Status:** Active
- **Compliance Elements:**
  - CE Marking (EU)
  - FCC Certification (US)
  - Bluetooth SIG Certification
  - RoHS Compliance
  - WEEE Directive

### Product 3: LED Desk Lamp
- **Name:** BrightWork Pro
- **Category:** Lighting / Office Equipment
- **Markets:** EU, US, UK, SE
- **Status:** In Development
- **Compliance Elements:**
  - CE Marking (EU)
  - LVD (Low Voltage Directive)
  - EMC (Electromagnetic Compatibility)
  - ERP (Energy-related Products)
  - RoHS Compliance
  - Swedish Energy Efficiency Standards

---

## Compliance Elements (Referenced from Shared DB)

These are examples of compliance elements that Supercase products would reference from `c_monitor_shared`:

### CE Marking
- **ID:** `ce_marking_eu_001`
- **Title:** CE Marking Requirement
- **Market:** EU
- **Type:** Marking
- **Mandatory:** Yes
- **Description:** Mandatory conformity marking for products sold in the European Economic Area

### FCC Certification
- **ID:** `fcc_cert_us_001`
- **Title:** FCC Equipment Authorization
- **Market:** US
- **Type:** Certification
- **Mandatory:** Yes
- **Description:** Federal Communications Commission certification for electronic devices

### RoHS Directive
- **ID:** `rohs_eu_001`
- **Title:** Restriction of Hazardous Substances
- **Market:** EU
- **Type:** Directive
- **Mandatory:** Yes
- **Description:** Limits use of specific hazardous materials in electrical and electronic products

---

## Dashboard Metrics (Initial State)

### Products
- **Total:** 0
- **Active:** 0
- **In Development:** 0
- **Archived:** 0

### Compliance Elements
- **Tracked:** 0 / 5 used (Professional tier limit)
- **By Market:**
  - EU: 0
  - US: 0
  - UK: 0

### Notifications
- **Pending:** 0
- **Read:** 0
- **Total:** 0

### Tasks
- **Active:** 0
- **Completed:** 0
- **Overdue:** 0

---

## Onboarding Flow

When Nicolas logs in for the first time:

1. **Welcome Screen**
   - Introduction to Supercase workspace
   - Quick tour of features

2. **Add First Product**
   - Guided product entry wizard
   - Market selection
   - Category selection

3. **Auto-Processing**
   - System analyzes product
   - Identifies compliance requirements
   - Links to shared compliance elements

4. **Review & Approve**
   - Nicolas reviews identified requirements
   - Approves/edits as needed

5. **Monitor Updates**
   - System monitors for compliance changes
   - Notifications sent when updates occur

---

## API Authentication

**JWT Token Contents:**
```json
{
  "user_id": "user_nicolas_supercase",
  "client_id": "supercase_demo",
  "email": "nicolas@supercase.se",
  "name": "Nicolas Zander",
  "role": "admin",
  "subscription": "professional",
  "exp": 1737408000
}
```

**Backend Database Switching:**
```javascript
// Extract from JWT
const clientId = jwt["https://certean-monitor.com/client_id"]; // "supercase_demo"

// Switch to client database
const clientDB = getDatabase(`c_monitor_${clientId}`);
// → c_monitor_supercase_demo
```

---

## Data Storage Example

### Client DB (`c_monitor_supercase_demo`)

**Products Collection:**
```json
{
  "_id": "product_supercase_001",
  "name": "Echo Home Pro",
  "category": "Electronics / Audio",
  "markets": ["EU", "US", "UK"],
  "status": "active",
  "compliance_element_ids": [
    "ce_marking_eu_001",
    "fcc_cert_us_001",
    "ukca_marking_uk_001",
    "rohs_eu_001",
    "weee_eu_001",
    "red_eu_001"
  ],
  "created_by": "user_nicolas_supercase",
  "created_at": "2025-01-20T10:00:00Z",
  "updated_at": "2025-01-20T10:00:00Z"
}
```

**Users Collection:**
```json
{
  "_id": "user_nicolas_supercase",
  "auth0_id": "auth0|xyz123",
  "name": "Nicolas Zander",
  "email": "nicolas@supercase.se",
  "role": "admin",
  "department": "Compliance & Quality",
  "created_at": "2025-01-20T09:00:00Z"
}
```

### Shared DB (`c_monitor_shared`)

**Compliance Elements Collection:**
```json
{
  "_id": "ce_marking_eu_001",
  "title": "CE Marking Requirement",
  "designation": "CE",
  "market": "EU",
  "type": "marking",
  "mandatory": true,
  "description": "Mandatory conformity marking for products sold in the EEA",
  "authority": "European Commission",
  "effective_date": "1993-01-01",
  "related_directives": ["LVD", "EMC", "RED"],
  "reference_url": "https://ec.europa.eu/growth/single-market/ce-marking_en"
}
```

---

## Testing Scenarios

### Scenario 1: First Login
1. Navigate to `http://localhost:5173`
2. Should redirect to `/login`
3. Click "Sign In with Auth0"
4. Auth0 login page appears
5. Enter `nicolas@supercase.se` credentials
6. After auth, redirect to `/dashboard`
7. Topbar shows "Supercase" and "Nicolas Zander"
8. Avatar shows "NZ" initials
9. Dashboard welcome: "Welcome Nicolas at Supercase"

### Scenario 2: Logout and Re-login
1. Click avatar in top-right
2. Click "Log out"
3. Should redirect to `/login`
4. Login again → seamless redirect to dashboard

### Scenario 3: Protected Route Access
1. Logout if logged in
2. Try to navigate directly to `/products`
3. Should redirect to `/login`
4. After login, redirect to `/products`

### Scenario 4: First Product Entry
1. Nicolas logs in
2. Clicks "Add Your First Product"
3. Enters "Echo Home Pro"
4. Selects markets: EU, US, UK
5. System processes → finds 6 compliance elements
6. Nicolas reviews and approves
7. Dashboard shows 1 product, 6 compliance elements

### Scenario 5: Compliance Update Notification
1. System detects update to CE Marking requirements
2. Checks which Supercase products reference CE Marking
3. Finds: Echo Home Pro, SoundWave X1
4. Creates notification in Supercase DB
5. Nicolas sees notification badge (2)
6. Clicks notification → sees details
7. Can mark as read or take action

---

## Summary

**Supercase** is the demo client for Certean Monitor featuring:
- Single admin user: **Nicolas Zander** (nicolas@supercase.se)
- Professional subscription tier (€899/month)
- Auth0 authentication with custom claims
- Ready to add products and track compliance
- Demonstrates multi-tenant architecture with shared compliance database
- Complete authentication flow with protected routes
