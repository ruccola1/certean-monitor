# Certean Monitor - Development Guide

## Project Overview

**Certean Monitor** is a multi-tenant SaaS compliance monitoring platform. This frontend consumes the **certean-ai** backend API and provides a modern React interface for product compliance tracking.

## Repository Location

```
/Users/nicolaszander/Desktop/certean/dev/certean-monitor/
```

## Quick Start

```bash
cd /Users/nicolaszander/Desktop/certean/dev/certean-monitor
npm install          # If not already installed
npm run dev          # Start dev server on http://localhost:5173
```

## Project Architecture

### Design System Source
All design tokens (colors, spacing, fonts) are copied from:
```
/Users/nicolaszander/Desktop/certean/dev/studio/
```

**Do not modify studio repo!** Only read/copy from it.

### Backend API
Connects to existing certean-ai backend:
```
/Users/nicolaszander/Desktop/certean/dev/certean-ai/
```

API runs on `http://localhost:8000`

## Development Workflow

### 1. Adding New UI Components

When you need a component from studio:

```bash
# 1. Find the component in studio
ls /Users/nicolaszander/Desktop/certean/dev/studio/src/components/ui/

# 2. Read the component
# Copy to certean-monitor/src/components/ui/

# 3. Remove "use client" directives (we're not using Next.js)
# 4. Update imports to use @/* aliases
```

### 2. Creating New Pages

```typescript
// src/pages/MyNewPage.tsx
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

export default function MyNewPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">My Page</h1>
      {/* Your content */}
    </div>
  );
}
```

Then add route in `src/App.tsx`:
```typescript
<Route path="/my-page" element={<MyNewPage />} />
```

### 3. Adding New API Services

```typescript
// src/services/myService.ts
import { api } from './api';
import type { ApiResponse } from '@/types/api';

export const myService = {
  async getData(): Promise<ApiResponse<MyData>> {
    const { data } = await api.get('/api/my-endpoint');
    return data;
  },
};
```

### 4. Creating Custom Hooks

```typescript
// src/hooks/useMyData.ts
import { useState, useEffect } from 'react';
import { myService } from '@/services/myService';

export function useMyData() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await myService.getData();
        setData(response.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return { data, loading, error };
}
```

## Component Library (shadcn/ui)

### Already Installed
- ✅ Button
- ✅ Card
- ✅ Badge
- ✅ Input
- ✅ Label

### To Install Next
Priority components needed:
1. Dialog (for modals)
2. Select (for dropdowns)
3. Table (for product list)
4. Tabs (for step reviews)
5. Toast (for notifications)

### Adding shadcn/ui Components

```bash
# Option 1: Copy from studio
cp /Users/nicolaszander/Desktop/certean/dev/studio/src/components/ui/dialog.tsx \
   /Users/nicolaszander/Desktop/certean/dev/certean-monitor/src/components/ui/

# Option 2: Use shadcn CLI (if configured)
npx shadcn-ui@latest add dialog
```

## Styling Guidelines

### Colors

Use CSS variables from `globals.css`:

```tsx
// Brand colors (Yellow/Gold)
<div className="bg-brand-primary text-brand-primary-foreground">
  
// Status colors
<Badge variant="success">Complete</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="destructive">Error</Badge>

// Accent (Greyish blue)
<Button className="bg-accent">Click</Button>
```

### Typography

```tsx
// Headers - Geist Sans
<h1 className="text-4xl font-bold">Title</h1>

// Body - Geist Sans
<p className="text-base">Regular text</p>

// Technical/Code - Geist Mono
<code className="font-mono text-sm">const x = 5;</code>
```

### Spacing

Use Tailwind spacing scale (4px increments):
```tsx
<div className="p-4">       // 16px padding
<div className="mb-8">      // 32px margin-bottom
<div className="gap-6">     // 24px gap
```

## State Management

### React Context Pattern

```typescript
// src/contexts/MyContext.tsx
import { createContext, useContext, useState } from 'react';

interface MyContextValue {
  data: any;
  setData: (data: any) => void;
}

const MyContext = createContext<MyContextValue | undefined>(undefined);

export function MyProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState(null);

  return (
    <MyContext.Provider value={{ data, setData }}>
      {children}
    </MyContext.Provider>
  );
}

export function useMyContext() {
  const context = useContext(MyContext);
  if (!context) {
    throw new Error('useMyContext must be used within MyProvider');
  }
  return context;
}
```

## API Integration

### Making API Calls

```typescript
import { productService } from '@/services/productService';

// In a component
async function handleCreateProduct() {
  try {
    const response = await productService.createBulk([{
      name: 'My Product',
      description: 'Product description',
      markets: ['EU'],
    }]);
    
    if (response.success) {
      console.log('Created:', response.data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### Authentication

Token is automatically included in requests via axios interceptor in `services/api.ts`.

To set token after Auth0 login:
```typescript
import { apiService } from '@/services/api';

apiService.setToken(auth0Token);
```

## Real-time Updates (Socket.io)

```typescript
// Future implementation
import io from 'socket.io-client';

const socket = io(import.meta.env.VITE_SOCKET_URL);

socket.on('product_update', (data) => {
  console.log('Product updated:', data);
});
```

## Testing

```bash
# Run development build
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type check
npx tsc --noEmit
```

## Common Issues & Solutions

### Import Errors

If you see `Cannot find module '@/...'`:
1. Check `tsconfig.app.json` has path aliases
2. Check `vite.config.ts` has resolve aliases
3. Restart dev server

### Styling Not Working

If Tailwind classes don't apply:
1. Check `globals.css` is imported in `main.tsx`
2. Check `tailwind.config.ts` content paths include your files
3. Restart dev server

### API Calls Failing

1. Verify certean-ai backend is running on `http://localhost:8000`
2. Check CORS is enabled on backend
3. Check token is set in localStorage
4. Check network tab in browser dev tools

## File Organization Best Practices

### Components
- **Small, focused components** - One responsibility per file
- **Separate logic from UI** - Use hooks for complex logic
- **PropTypes at top** - Use TypeScript interfaces
- **Export default** - For page components
- **Named exports** - For utility components

### Services
- **One service per domain** - productService, userService, etc.
- **Consistent API** - All services return ApiResponse<T>
- **Error handling** - Let axios interceptor handle 401, catch others

### Types
- **Shared types** - In src/types/
- **Component-specific types** - In same file as component
- **Extend, don't duplicate** - Use intersection/union types

## Environment Variables

Required in `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_AUTH0_DOMAIN=xxx
VITE_AUTH0_CLIENT_ID=xxx
VITE_AUTH0_AUDIENCE=xxx
VITE_STRIPE_PUBLISHABLE_KEY=xxx
VITE_SOCKET_URL=ws://localhost:8000
```

Access in code:
```typescript
const apiUrl = import.meta.env.VITE_API_BASE_URL;
```

## Next Steps

See `IMPLEMENTATION_STATUS.md` for detailed task list.

Priority tasks:
1. **Auth0 setup** - Login/logout flow
2. **Product form** - Add products with file upload
3. **Product table** - List with real-time updates
4. **Step reviews** - Validate Step 0, 1, 2 outputs

## Resources

- **Tailwind CSS**: https://tailwindcss.com/docs
- **Radix UI**: https://www.radix-ui.com/primitives/docs
- **React Router**: https://reactrouter.com
- **Recharts**: https://recharts.org
- **Auth0 React**: https://auth0.com/docs/quickstart/spa/react
- **Stripe React**: https://stripe.com/docs/stripe-js/react

## Getting Help

1. Check `IMPLEMENTATION_STATUS.md` for what's completed
2. Reference studio repo for design patterns
3. Check certean-ai repo for backend API structure
4. Review plan in `.plan.md` file

Happy coding! 🚀

