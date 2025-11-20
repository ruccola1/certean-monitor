# Certean Monitor

**Multi-tenant SaaS compliance monitoring platform** built with React, TypeScript, and Tailwind CSS.

## Features

- 🔐 **Auth0 Authentication** - Secure multi-tenant user management
- 📦 **Product-centric workflow** - Add products → Auto-process → Review → Approve
- 🔄 **Real-time updates** - Socket.io for live pipeline status
- 📊 **Compliance tracking** - Shared knowledge base across all clients
- 💳 **Stripe integration** - Subscription management (Free, Professional, Expert Level)
- 👥 **Multi-user support** - Role-based access (Admin, Member, Viewer)
- 🔔 **Smart notifications** - Email + in-app compliance updates (3-month window)
- 📈 **Analytics dashboard** - AI-generated summaries and charts

## Tech Stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS** + **shadcn/ui** (Radix UI components)
- **React Router v6** for navigation
- **Auth0 React SDK** for authentication
- **Axios** for API calls
- **Socket.io-client** for real-time updates
- **Recharts** for data visualization
- **Stripe** for payments

## Design System

Copied from `studio` repo with strict design rules:

### Core Principles
- ✅ **No rounded corners** - All elements have sharp 90-degree corners
- ✅ **No borders on cards** - Use background contrast instead
- ✅ **Consistent colors** - HSL variables from Studio design system
- ✅ **Geist fonts** - Sans for text, Mono for numbers/code

### Design Files
- **[STYLING_TEMPLATE.md](./STYLING_TEMPLATE.md)** - Copy-paste classes for all UI elements
- **[DESIGN_RULES.md](./DESIGN_RULES.md)** - Detailed design guidelines
- **[.cursorrules](./.cursorrules)** - AI assistant rules for consistent styling

### Quick Start Classes
```tsx
// Page container
<div className="min-h-screen bg-dashboard-view-background p-8">
  
// Card (no borders, no rounded corners)
<Card className="bg-white border-0">
  
// Primary button
<Button className="bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white">
```

**Reference Implementation:** See `src/pages/Dashboard.tsx` for complete example.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Access to `certean-ai` backend API (must be running on `localhost:8000`)

### Installation

```bash
# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Update .env with your credentials:
# - Auth0 domain and client ID
# - Stripe publishable key
# - API base URL (http://localhost:8000)

# Start development server
npm run dev
```

The app will open at `http://localhost:5173`

### Auth0 Setup

See **[AUTH0_SETUP.md](./AUTH0_SETUP.md)** for complete Auth0 configuration guide including:
- Creating an Auth0 application
- Configuring allowed URLs
- Setting up user metadata
- Customizing the login page
- Production deployment steps

### Environment Variables

```env
# Auth0 Configuration
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_REDIRECT_URI=http://localhost:5173
VITE_AUTH0_AUDIENCE=https://api.certean-monitor.com

# API Configuration
VITE_API_BASE_URL=http://localhost:8000

# Stripe (Optional)
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Socket.io (Optional)
VITE_SOCKET_URL=ws://localhost:8000
```

**See [AUTH0_SETUP.md](./AUTH0_SETUP.md) for detailed Auth0 configuration instructions.**

## Project Structure

```
src/
├── components/          # React components
│   ├── ui/             # shadcn/ui components (Button, Card, etc.)
│   ├── auth/           # Authentication components
│   ├── onboarding/     # Onboarding wizard
│   ├── dashboard/      # Dashboard widgets
│   ├── products/       # Product management
│   ├── steps/          # Step review interfaces
│   ├── notifications/  # Notification center
│   └── layout/         # Layout components (Sidebar, Header)
├── contexts/           # React context providers
├── hooks/              # Custom React hooks
├── services/           # API service layer
├── types/              # TypeScript type definitions
├── pages/              # Page components
├── lib/                # Utility functions
└── styles/             # Global CSS
```

## Backend Integration

This frontend connects to the **certean-ai** backend API at `http://localhost:8000`.

### Required Backend Endpoints

See [API_ENDPOINTS.md](./API_ENDPOINTS.md) for full list.

Key endpoints:
- `POST /api/products/bulk` - Add products
- `POST /api/products/{id}/step0` - Run Step 0 (Product Decomposition)
- `GET /api/dashboard/summary` - AI-generated summary
- `GET /api/compliance/elements` - Search shared compliance DB
- `GET /api/notifications` - Get compliance notifications

## User Workflow

1. **Sign up** → Select subscription tier (Free/Professional/Expert Level)
2. **Onboarding wizard** → Add first product + market
3. **Auto-processing** → System runs Step 0, 1, 2 in background
4. **Review & validate** → Approve/edit each step's output
5. **Monitor updates** → Receive notifications for compliance changes

## Development

```bash
# Development mode with hot reload
npm run dev

# Type checking
npm run type-check

# Build for production
npm run build

# Preview production build
npm run preview
```

## Subscription Tiers

| Feature | Free | Professional (€899/mo) | Expert Level |
|---------|------|------------------------|--------------|
| Products | 1 | 5 | Unlimited |
| Markets | 1 | Unlimited | Unlimited |
| Compliance Elements | 5 | Unlimited | Unlimited |
| Users | 1 | 5 | Unlimited |
| Real-time Notifications | ❌ | ✅ | ✅ |
| Background Processing | ❌ | ✅ (3 concurrent) | ✅ (10+ concurrent) |
| Support | Community | Priority | Dedicated + SME validation |

## Architecture

### Multi-Tenant Model with Shared Compliance Knowledge Base

**Database Structure:**
- **Client Databases** (`c_monitor_{client_id}`) - Store products and references only
- **Shared Database** (`c_monitor_shared`) - Store ALL compliance elements and updates

**Key Principles:**
1. ✅ **Compliance elements** → Stored ONLY in shared DB
2. ✅ **Compliance updates** → Stored ONLY in shared DB
3. ✅ **Products** → Stored in client DBs with **ID references** to shared compliance elements
4. ✅ **No duplication** → Compliance data lives in ONE place (shared DB)

**Data Flow:**
- New product added → System identifies compliance requirements
- New compliance elements → Added to shared DB, referenced by ID from client DB
- Compliance updates → Updated in shared DB, automatically affects all referencing products
- Queries → Join client products with shared compliance elements via IDs

**Benefits:**
- Knowledge sharing across all clients
- Single source of truth for compliance data
- Easy global updates to compliance requirements
- Client privacy maintained (products stay separate)

**See:** [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed documentation

### Real-time Updates
- **Socket.io** connection per client
- Pipeline status updates (Step 0, 1, 2 progress)
- Compliance notifications (when shared DB changes)
- Notification triggers: Updates within 3 months + future dates only

## Contributing

This is a private project. Contact the team for access.

## License

Proprietary - © 2025 Certean
