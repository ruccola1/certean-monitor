# API Progress Tracking Guide

## How to Know When API is Processing Products

### 1. **Frontend UI Indicators** (Automatic)

The Products page (`/products`) automatically shows real-time status:

**Status Badges:**
- 🔵 **`pending`** - Product created, waiting to start
- 🔵 **`running`** - Step is currently processing (with spinner)
- 🟢 **`completed`** - Step finished successfully
- 🔴 **`error`** - Step failed

**Real-time Updates:**
- Page polls every **5 seconds** automatically
- Spinners animate when processing
- Status updates without page refresh

### 2. **Manual Testing via API**

Check any product's current status:

```bash
# Get all products
curl -H "Authorization: Bearer cbebae12ccf204ca7239bedc5df2dd69" \
  http://localhost:8000/api/products

# Get specific product
curl -H "Authorization: Bearer cbebae12ccf204ca7239bedc5df2dd69" \
  http://localhost:8000/api/products/{product_id}
```

### 3. **Check MongoDB Directly**

```bash
mongosh "mongodb+srv://dbCertainRoot:jo6mtfW16Z5OVVyA@cluster0.k4m5wtv.mongodb.net/" \
  --eval "
    db = db.getSiblingDB('c_monitor_supercase');
    db.products.find({}, {
      name: 1,
      status: 1,
      step0Status: 1,
      step1Status: 1,
      step2Status: 1,
      updatedAt: 1
    }).pretty();
  "
```

### 4. **Backend Logs**

Watch the backend console for processing logs:

```bash
tail -f /tmp/certean-backend.log
```

Look for:
- `✅ Starting Step 0 for product: {id}`
- `⏳ Step 0 running...`
- `✅ Step 0 completed`

### 5. **Trigger Processing**

**Option A: Automatic (Default)**
- When you add a product, Step 0 **starts automatically**
- No action needed!

**Option B: Manual Trigger**
- Go to `/products` page
- Find product with `pending` status
- Click **"Start"** button
- Watch status change to `running` → `completed`

**Option C: Via API**
```bash
# Trigger Step 0 for a product
curl -X POST \
  -H "Authorization: Bearer cbebae12ccf204ca7239bedc5df2dd69" \
  http://localhost:8000/api/products/{product_id}/execute-step0
```

### 6. **Status Flow**

```
Product Created
    ↓
step0Status: pending
    ↓
[Click "Start" or Auto-trigger]
    ↓
step0Status: running (spinner shows)
status: processing
    ↓
[AI processes for ~10 seconds]
    ↓
step0Status: completed
    ↓
step1Status: pending (ready for next step)
```

### 7. **Watch Live Updates**

**In Browser:**
1. Go to `/products`
2. Add a new product
3. **Automatically redirected to products page**
4. See product with `running` status and spinner
5. **Every 5 seconds**: Status updates automatically
6. After ~10 seconds: Status changes to `completed`

**In Terminal (Real-time):**
```bash
# Watch products update every 2 seconds
watch -n 2 'curl -s -H "Authorization: Bearer cbebae12ccf204ca7239bedc5df2dd69" \
  http://localhost:8000/api/products | \
  python3 -c "import sys, json; data = json.load(sys.stdin); \
  [print(f\"{p[\"name\"]}: step0={p[\"step0Status\"]} status={p[\"status\"]}\") \
  for p in data[\"data\"]]"'
```

## Current Processing Time

- **Step 0**: ~10 seconds (simulated)
- Future: Will integrate actual AI processing

## Troubleshooting

### Product stuck on "pending"?
1. Check backend is running: `curl http://localhost:8000/api/health`
2. Click "Start" button manually
3. Check backend logs for errors

### No status updates?
1. Refresh page (`Cmd+R`)
2. Check browser console for errors
3. Verify backend API is accessible

### Want faster updates?
Edit `src/pages/Products.tsx` line 38:
```typescript
// Change from 5000ms to 2000ms
const interval = setInterval(() => {
  fetchProducts();
}, 2000); // Update every 2 seconds
```

## Summary

✅ **Automatic**: Products auto-start processing after creation
✅ **Real-time**: UI updates every 5 seconds with spinners
✅ **Visible**: Status badges show current state
✅ **Trackable**: Monitor via UI, API, MongoDB, or logs
✅ **Manual**: Can trigger processing with "Start" button

**Go test it now:** Add a product and watch it process in real-time! 🚀

