# Certean Monitor Design Rules

**MANDATORY**: All pages and components MUST follow these rules. No exceptions.

## Core Design Principles

### 1. **No Rounded Corners**

**Rule:** All UI elements MUST have sharp, 90-degree corners. No border-radius allowed.

**Implementation:**
- Set `border-radius: 0` globally
- Use `border-0` or explicit zero radius classes
- Apply `!important` override in global styles to ensure consistency

**Examples:**
```tsx
// ✅ Correct
<Card className="border-0">
<Button className="rounded-none">
<div className="rounded-0">

// ❌ Wrong
<Card className="rounded-lg">
<Button className="rounded-md">
<div className="rounded">
```

**Affected Components:**
- Cards
- Buttons
- Inputs
- Badges
- Modals/Dialogs
- Tooltips
- Dropdowns
- All UI elements

---

### 2. **No Drop Shadows**

**Rule:** No drop shadows, box-shadows, or any shadow effects. Keep design flat and clean.

**Implementation:**
- Set `box-shadow: none` globally
- Apply `!important` override to ensure no shadows anywhere
- Never use `shadow-*` Tailwind classes
- Flat design is mandatory

**Examples:**
```tsx
// ✅ Correct - No shadows
<Card className="bg-white border-0">

// ❌ Wrong - Never use shadows
<Card className="shadow-lg">
<Card className="shadow-md">
<div className="drop-shadow-lg">
```

**Affected Components:**
- Cards
- Buttons
- Modals/Dialogs
- Dropdowns
- Tooltips
- All UI elements

---

### 3. **No Borders Around Boxes**

**Rule:** Cards and container elements should NOT have visible borders. Use background color differentiation instead.

**Implementation:**
- Use `border-0` class on Card components
- Rely on white backgrounds against light gray page backgrounds for visual separation
- Use shadows sparingly if needed for depth (but prefer flat design)

**Examples:**
```tsx
// ✅ Correct
<Card className="bg-white border-0">

// ❌ Wrong
<Card className="border border-gray-200">
<Card className="border">
```

---

## Design System Reference

### Colors from Studio

**Background:**
- Page background: `bg-dashboard-view-background` → `#EEEFF0`
- Card background: `bg-white` → `#FFFFFF`
- Sidebar gradient: `#F5F5F6` to `#EEEFF0`

**Text:**
- Primary text: `text-[hsl(var(--dashboard-link-color))]` → Greyish-blue `hsl(220 30% 45%)`
- Secondary text: `text-gray-500`
- Monospace (numbers): `font-mono`

**Brand Colors:**
- Primary: Yellow/Gold `hsl(47 92% 61%)`
- Accent: Greyish-blue `hsl(220 30% 45%)`

### Typography

**Font Family:**
- Sans: Geist Sans (loaded from CDN)
- Mono: Geist Mono (loaded from CDN)

**Usage:**
- Body text: Geist Sans
- Numbers/metrics: Geist Mono
- Code: Geist Mono

---

## Component Guidelines

### Cards

```tsx
<Card className="bg-white border-0">
  <CardHeader>
    <CardTitle className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]">
      Title
    </CardTitle>
    <CardDescription className="text-sm text-gray-500">
      Description
    </CardDescription>
  </CardHeader>
  <CardContent>
    <div className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono">
      0
    </div>
  </CardContent>
</Card>
```

### Buttons

```tsx
<Button className="bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white">
  Action
</Button>
```

### Badges

```tsx
<Badge variant="secondary">
  Label
</Badge>
```

---

## Global CSS Rules

```css
* {
  border-radius: 0 !important;
  box-shadow: none !important;
}
```

This ensures all elements, including third-party components, respect the no-rounded-corners and no-shadows rules.

---

## Tailwind Configuration

```typescript
borderRadius: {
  lg: '0',
  md: '0',
  sm: '0',
  none: '0'
},
boxShadow: {
  none: 'none'
}
```

All border-radius utilities are set to 0 and shadows are disabled.

---

## Visual Hierarchy

Instead of borders, rounded corners, and shadows, use:

1. **Background color contrast** (white on light gray)
2. **Typography weight** (bold headings, normal body)
3. **Spacing** (generous padding and margins)
4. **Color** (accent colors for important elements)
5. **Size** (larger text for hierarchy)
6. **Flat design** (no depth effects, no shadows)

---

## Checklist for New Components

- [ ] No `rounded-*` classes used (except `rounded-0` or `rounded-none`)
- [ ] No `shadow-*` or drop-shadow classes used
- [ ] No `border` classes used on containers
- [ ] Background colors used for visual separation
- [ ] Flat design maintained (no depth effects)
- [ ] Colors match Studio design system
- [ ] Typography uses Geist fonts
- [ ] Numbers use `font-mono` class
- [ ] Sharp, clean, professional aesthetic maintained

---

## Enforcement

**During Development:**
- Lint warnings should flag rounded corners
- Code reviews should check for border usage
- Visual regression tests should catch design deviations

**Testing:**
- Check rendered components have `border-radius: 0`
- Verify no borders on cards/containers
- Ensure consistent with Studio repo styling

---

## Page Layout Standards

### Every Page MUST Follow This Structure:

```tsx
export default function PageName() {
  return (
    <div className="min-h-screen bg-dashboard-view-background p-8">
      <div className="max-w-7xl space-y-8">
        {/* Page Title */}
        <div>
          <h1 className="text-xl font-bold text-[hsl(var(--dashboard-link-color))]">
            Page Title
          </h1>
          <p className="text-[15px] text-[hsl(var(--dashboard-link-color))] mt-2">
            Page description
          </p>
        </div>

        {/* Page Content */}
        {/* Use Cards with bg-white border-0 */}
      </div>
    </div>
  );
}
```

### Required Classes for All Pages:

1. **Page Container:**
   - `className="min-h-screen bg-dashboard-view-background p-8"`

2. **Content Wrapper:**
   - `className="max-w-7xl space-y-8"`

3. **Page Title (H1):**
   - `className="text-xl font-bold text-[hsl(var(--dashboard-link-color))]"`

4. **Page Description:**
   - `className="text-[15px] text-[hsl(var(--dashboard-link-color))] mt-2"`

5. **Cards:**
   - `className="bg-white border-0"`

6. **Card Titles:**
   - `className="text-sm font-bold text-[hsl(var(--dashboard-link-color))]"`

7. **Card Descriptions:**
   - `className="text-sm text-gray-500"`

8. **Numbers/Metrics:**
   - `className="text-3xl font-bold text-[hsl(var(--dashboard-link-color))] font-mono"`

9. **Buttons (Primary):**
   - `className="bg-[hsl(var(--dashboard-link-color))] hover:bg-[hsl(var(--dashboard-link-color))]/80 text-white"`

10. **Secondary Text:**
    - `className="text-gray-500"`

---

## References

- **Source of Truth:** `/Users/nicolaszander/Desktop/certean/dev/studio` repository
- **Global Styles:** `src/styles/globals.css`
- **Tailwind Config:** `tailwind.config.ts`
- **Example Implementation:** `src/pages/Dashboard.tsx`
- **Styling Template:** `STYLING_TEMPLATE.md`

