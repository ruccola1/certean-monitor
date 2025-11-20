# Certean Monitor - Page Styling Template

## Quick Reference - Copy & Paste These Classes

This document provides ready-to-use class combinations for all UI elements.
**All pages and components MUST use these exact classes.**

---

## Page Layout

### Basic Page Structure

```tsx
export default function PageName() {
  return (
    <div className="min-h-screen bg-dashboard-view-background p-8">
      <div className="max-w-7xl space-y-8">
        {/* Content goes here */}
      </div>
    </div>
  );
}
```

**Classes:**
- Page wrapper: `min-h-screen bg-dashboard-view-background p-8`
- Content container: `max-w-7xl space-y-8`

---

## Typography

### Page Title (H1)
```tsx
<h1 className="text-xl font-bold text-[hsl(var(--dashboard-link-color))]">
  Title Here
</h1>
```
**Class:** `text-xl font-bold text-[hsl(var(--dashboard-link-color))]`

### Page Subtitle/Description
```tsx
<p className="text-[15px] text-[hsl(var(--dashboard-link-color))] mt-2">
  Description text
</p>
```
**Class:** `text-[15px] text-[hsl(var(--dashboard-link-color))] mt-2`

### Section Heading
```tsx
<h2 className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
  Section Title
</h2>
```
**Class:** `text-sm font-bold text-[hsl(var(--dashboard-link-color))]`

### Body Text / Description
```tsx
<p className="text-sm text-gray-500">
  Body text here
</p>
```
**Class:** `text-sm text-gray-500`

### Metric / Number
```tsx
<div className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">
  42
</div>
```
**Class:** `text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono`

---

## Cards

### Basic Card
```tsx
<Card className="bg-white border-0">
  <CardHeader>
    <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
      Card Title
    </CardTitle>
    <CardDescription className="text-sm text-gray-500">
      Card description
    </CardDescription>
  </CardHeader>
  <CardContent>
    {/* Content */}
  </CardContent>
</Card>
```

**Classes:**
- Card: `bg-white border-0`
- CardTitle: `text-sm font-bold text-[hsl(var(--dashboard-link-color))]`
- CardDescription: `text-sm text-gray-500`

### Metric Card
```tsx
<Card className="bg-white border-0">
  <CardHeader>
    <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
      Products
    </CardTitle>
    <CardDescription className="text-sm text-gray-500">
      Total products monitored
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">
      0
    </div>
    <Badge variant="secondary" className="mt-2">Free Tier</Badge>
  </CardContent>
</Card>
```

---

## Buttons

### Primary Button
```tsx
<Button className="bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white">
  Click Me
</Button>
```
**Class:** `bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white`

### Secondary Button (using shadcn variant)
```tsx
<Button variant="secondary">
  Secondary Action
</Button>
```

### Outline Button (using shadcn variant)
```tsx
<Button variant="outline">
  Outline Action
</Button>
```

### Destructive Button
```tsx
<Button variant="destructive">
  Delete
</Button>
```

---

## Badges

### Default Badge
```tsx
<Badge variant="secondary">
  Label
</Badge>
```

### Success Badge
```tsx
<Badge className="bg-green-500 text-white hover:bg-green-600">
  Connected
</Badge>
```

### Status Badge (with color)
```tsx
<Badge className="bg-blue-500 text-white">
  Active
</Badge>
```

---

## Grid Layouts

### 3-Column Grid (for cards)
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  <Card className="bg-white border-0">{/* Card 1 */}</Card>
  <Card className="bg-white border-0">{/* Card 2 */}</Card>
  <Card className="bg-white border-0">{/* Card 3 */}</Card>
</div>
```
**Class:** `grid grid-cols-1 md:grid-cols-3 gap-6`

### 2-Column Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
  {/* Content */}
</div>
```
**Class:** `grid grid-cols-1 md:grid-cols-2 gap-6`

### 4-Column Grid
```tsx
<div className="grid grid-cols-1 md:grid-cols-4 gap-6">
  {/* Content */}
</div>
```
**Class:** `grid grid-cols-1 md:grid-cols-4 gap-6`

---

## Lists

### Vertical Stack with Spacing
```tsx
<div className="space-y-4">
  <div>{/* Item 1 */}</div>
  <div>{/* Item 2 */}</div>
  <div>{/* Item 3 */}</div>
</div>
```
**Class:** `space-y-4` (or `space-y-2`, `space-y-6`, `space-y-8`)

### Horizontal Stack with Spacing
```tsx
<div className="flex gap-4">
  <div>{/* Item 1 */}</div>
  <div>{/* Item 2 */}</div>
</div>
```
**Class:** `flex gap-4`

---

## Data Display

### Key-Value Pair (horizontal)
```tsx
<div className="flex justify-between">
  <span className="text-gray-500">Label:</span>
  <span className="font-mono text-[hsl(var(--dashboard-link-color))]">Value</span>
</div>
```

### Key-Value List
```tsx
<div className="space-y-2 text-sm">
  <div className="flex justify-between">
    <span className="text-gray-500">API Endpoint:</span>
    <span className="font-mono text-[hsl(var(--dashboard-link-color))]">
      https://api.example.com
    </span>
  </div>
  <div className="flex justify-between">
    <span className="text-gray-500">Version:</span>
    <span className="font-mono text-[hsl(var(--dashboard-link-color))]">1.0.0</span>
  </div>
</div>
```

---

## Color Reference (Quick Copy)

### Primary Colors
- Dashboard background: `bg-dashboard-view-background`
- Card background: `bg-white`
- No borders: `border-0`

### Text Colors
- Primary text (headings): `text-[hsl(var(--dashboard-link-color))]`
- Secondary text: `text-gray-500`
- White text: `text-white`

### Button Colors
- Primary button bg: `bg-[hsl(var(--dashboard-link-color))]`
- Primary button hover: `hover:bg-[hsl(var(--dashboard-link-color))]/80`
- Success badge: `bg-green-500 text-white hover:bg-green-600`

---

## Complete Page Example

```tsx
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function ExamplePage() {
  return (
    <div className="min-h-screen bg-dashboard-view-background p-8">
      <div className="max-w-7xl space-y-8">
        {/* Page Header */}
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--dashboard-link-color))]">
            Page Title
          </h1>
          <p className="text-[15px] text-[hsl(var(--dashboard-link-color))] mt-2">
            Brief description of what this page does
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white border-0">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
                Metric 1
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Description of metric
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">
                42
              </div>
              <Badge variant="secondary" className="mt-2">Active</Badge>
            </CardContent>
          </Card>

          <Card className="bg-white border-0">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
                Metric 2
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Another metric
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">
                123
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border-0">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
                Metric 3
              </CardTitle>
              <CardDescription className="text-sm text-gray-500">
                Third metric
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">
                89%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Content Card */}
        <Card className="bg-white border-0">
          <CardHeader>
            <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
              Section Title
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Section description
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-500">
              Content goes here. This could be text, tables, forms, or any other content.
            </p>
            <Button className="bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white">
              Take Action
            </Button>
          </CardContent>
        </Card>

        {/* Info Card */}
        <Card className="bg-white border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
              Information
              <Badge className="bg-green-500 text-white hover:bg-green-600">
                Status
              </Badge>
            </CardTitle>
            <CardDescription className="text-sm text-gray-500">
              Additional information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Key 1:</span>
                <span className="font-mono text-[hsl(var(--dashboard-link-color))]">
                  Value 1
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Key 2:</span>
                <span className="font-mono text-[hsl(var(--dashboard-link-color))]">
                  Value 2
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

---

## DO NOT Use These Classes

❌ Never use:
- `rounded-*` (except `rounded-0`)
- `shadow-*` (any drop shadows)
- `drop-shadow-*` (any shadow effects)
- `border` (on cards/containers - use `border-0` instead)
- `bg-gray-*` (for page background - use `bg-dashboard-view-background`)
- Custom colors (use the HSL variables)

✅ Always use:
- `border-0` on all cards
- `bg-dashboard-view-background` for page background
- `bg-white` for cards
- `text-[hsl(var(--dashboard-link-color))]` for primary text
- `text-gray-500` for secondary text
- `font-mono` for numbers/metrics

---

## Checklist for New Pages

Before committing a new page, verify:

- [ ] Page uses `bg-dashboard-view-background` for main container
- [ ] All cards have `bg-white border-0`
- [ ] Page title uses correct styling (text-xl, bold, correct color)
- [ ] All headings use `text-[hsl(var(--dashboard-link-color))]`
- [ ] Secondary text uses `text-gray-500`
- [ ] Numbers/metrics use `font-mono`
- [ ] No rounded corners anywhere
- [ ] No drop shadows anywhere (no `shadow-*` classes)
- [ ] No borders on cards
- [ ] Buttons use correct primary color
- [ ] Layout follows max-w-7xl pattern
- [ ] Spacing is consistent (space-y-8, gap-6, etc.)
- [ ] Flat design maintained (no depth effects)

---

## Need Help?

- **Reference:** See `src/pages/Dashboard.tsx` for a complete working example
- **Design Rules:** See `DESIGN_RULES.md` for detailed guidelines
- **Studio Source:** Check `/Users/nicolaszander/Desktop/certean/dev/studio` for original styling

