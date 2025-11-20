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

Copied from `studio` repo with:
- Geist Sans & Geist Mono fonts
- Light theme with Yellow/Gold brand color
- Responsive sidebar layout
- Consistent component styling

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

### Environment Variables

```env
VITE_API_BASE_URL=http://localhost:8000
VITE_AUTH0_DOMAIN=your-domain.auth0.com
VITE_AUTH0_CLIENT_ID=your-client-id
VITE_AUTH0_AUDIENCE=your-api-audience
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_xxx
VITE_SOCKET_URL=ws://localhost:8000
```

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

### Multi-Tenant Model
- **One deployment** serves all clients
- **Auth0** provides `client_id` in JWT
- **Backend** switches to `c_monitor_{client_id}` database per request
- **Shared compliance DB** (`c_monitor_shared`) benefits all clients

### Real-time Updates
- **Socket.io** connection per client
- Pipeline status updates (Step 0, 1, 2 progress)
- Compliance notifications (when shared DB changes)
- Notification triggers: Updates within 3 months + future dates only

## Contributing

This is a private project. Contact the team for access.

## License

Proprietary - © 2025 Certean
