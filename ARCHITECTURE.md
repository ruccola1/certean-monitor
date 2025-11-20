# Certean Monitor - Architecture Documentation

## Database Architecture

### Multi-Tenant Model with Shared Compliance Knowledge Base

The system uses a **hybrid database architecture** with client-specific databases and a shared compliance database.

---

## Database Structure

### 1. Shared Database (`c_monitor_shared`)

**Purpose:** Central knowledge base for ALL compliance-related data that benefits all clients.

**Contains:**
- ✅ **Compliance Elements** - Regulations, standards, markings, certifications
- ✅ **Compliance Updates** - Changes, amendments, new requirements
- ✅ **Markets** - Geographic regions and their regulations
- ✅ **Categories** - Product categories and classification
- ✅ **Legislation** - Laws and legal frameworks
- ✅ **Standards** - Technical standards (ISO, EN, etc.)

**Key Principle:** 
> **NO client-specific data** in shared DB. Only universal compliance knowledge.

---

### 2. Client Databases (`c_monitor_{client_id}`)

**Purpose:** Client-specific operational data and product inventory.

**Contains:**
- ✅ **Products** - Client's product catalog
- ✅ **Product-Compliance Relationships** - References to shared compliance elements
- ✅ **Dossiers** - Product certification documentation
- ✅ **User Preferences** - Client-specific settings
- ✅ **Notifications** - Client-specific alerts
- ✅ **Tasks** - Client-specific action items

**Key Principle:**
> **NO compliance element data** stored here. Only **references (IDs)** to shared DB.

---

## Data Flow Architecture

### Product Entry Flow

```
1. Client adds new product
   └─> Product stored in: c_monitor_{client_id}.products

2. System analyzes product for compliance requirements
   └─> AI identifies relevant compliance elements

3. For EACH compliance element found:
   
   A. Check if element exists in shared DB
      ├─> EXISTS: Get existing element ID
      └─> NEW: Create in shared DB, get new ID
   
   B. Create reference in client DB
      └─> Store: {product_id, compliance_element_id}

4. Result:
   ├─> Compliance elements: Stored ONCE in shared DB
   ├─> Product: Stored in client DB
   └─> Relationship: IDs linking product to compliance elements
```

---

## Key Relationships

### Product → Compliance Elements

**Storage:**
```javascript
// Client DB (c_monitor_{client_id})
{
  _id: "product_123",
  name: "Electric Toothbrush",
  category: "Personal Care",
  market: ["EU", "US"],
  compliance_element_ids: [  // ← REFERENCES to shared DB
    "ce_456",
    "ce_789",
    "ce_101"
  ]
}

// Shared DB (c_monitor_shared)
{
  _id: "ce_456",
  title: "CE Marking Requirement",
  type: "marking",
  market: "EU",
  // ... full compliance data
}
```

### Product → Compliance Updates

**Flow:**
1. Compliance update created/modified in **shared DB**
2. System checks which products reference affected compliance elements
3. Notifications sent to relevant clients based on their product references

**Query Pattern:**
```javascript
// 1. Get product's compliance element IDs from client DB
const product = await clientDB.products.findOne({_id: "product_123"});
const elementIds = product.compliance_element_ids;

// 2. Get compliance elements from shared DB
const elements = await sharedDB.compliance_elements.find({
  _id: {$in: elementIds}
});

// 3. Get updates for those elements from shared DB
const updates = await sharedDB.compliance_updates.find({
  compliance_element_id: {$in: elementIds},
  date: {$gte: startDate, $lte: endDate}
});
```

---

## Benefits of This Architecture

### 1. **Shared Knowledge Base**
- Compliance elements discovered by one client benefit ALL clients
- Reduces duplicate data entry
- Ensures consistency across all clients

### 2. **Scalability**
- New compliance elements added once, used by many
- Client DBs remain small (only their products + references)
- Easy to update compliance data globally

### 3. **Data Integrity**
- Single source of truth for compliance data
- Updates to compliance elements automatically affect all referencing products
- No synchronization issues between clients

### 4. **Privacy**
- Client products remain isolated in their own DBs
- Clients cannot see other clients' products
- Shared DB contains only public compliance information

---

## Data Operations

### Adding New Compliance Element

**When:** Product analysis discovers new requirement

**Process:**
1. Check shared DB for existing element (by designation, title, or reference)
2. If NOT exists:
   ```javascript
   // Create in shared DB
   const newElement = await sharedDB.compliance_elements.insertOne({
     title: "New Regulation X",
     designation: "REG-2024-001",
     market: "EU",
     type: "legislation",
     // ... full details
   });
   
   const elementId = newElement.insertedId;
   ```
3. Store reference in client DB:
   ```javascript
   // Add to product's compliance_element_ids array
   await clientDB.products.updateOne(
     {_id: productId},
     {$addToSet: {compliance_element_ids: elementId}}
   );
   ```

### Updating Compliance Element

**When:** Regulation changes, amendment published, deadline updated

**Process:**
1. Update element in shared DB ONLY:
   ```javascript
   await sharedDB.compliance_elements.updateOne(
     {_id: elementId},
     {$set: {effective_date: newDate}}
   );
   ```
2. Change automatically affects ALL clients referencing this element
3. System triggers notifications for affected clients

### Querying Product Compliance

**Get all compliance elements for a product:**
```javascript
// 1. Get product from client DB
const product = await clientDB.products.findOne({_id: productId});

// 2. Fetch full compliance elements from shared DB
const elements = await sharedDB.compliance_elements.find({
  _id: {$in: product.compliance_element_ids}
});

// Result: Full compliance data for this product
```

**Get all products affected by compliance update:**
```javascript
// 1. Get compliance element ID from update (shared DB)
const update = await sharedDB.compliance_updates.findOne({_id: updateId});
const elementId = update.compliance_element_id;

// 2. For EACH client DB, find products referencing this element
const affectedClients = await getAllClientDatabases();

for (const clientDB of affectedClients) {
  const affectedProducts = await clientDB.products.find({
    compliance_element_ids: elementId
  });
  
  // Send notifications to this client for these products
}
```

---

## API Endpoints Architecture

### Client-Specific Endpoints

**Base URL:** `/api/`

**Authentication:** Includes `client_id` from JWT token

**Examples:**
- `GET /api/products` → Returns products from `c_monitor_{client_id}`
- `POST /api/products` → Creates product in client DB
- `GET /api/products/{id}/compliance` → Gets product + related compliance elements

**Pattern:**
1. Extract `client_id` from JWT
2. Switch to client database: `c_monitor_{client_id}`
3. Execute query on client data
4. If needed, join with shared DB for compliance elements

### Shared Endpoints

**Base URL:** `/api/compliance/`

**Authentication:** Available to all authenticated clients

**Examples:**
- `GET /api/compliance/elements` → Search shared compliance elements
- `GET /api/compliance/updates` → Get recent compliance updates
- `GET /api/compliance/markets` → Get all markets

**Pattern:**
1. Query shared database: `c_monitor_shared`
2. Return public compliance data
3. No client-specific filtering (shared knowledge base)

---

## Notification System

### Compliance Update Notifications

**Trigger:** New compliance update added to shared DB

**Process:**
1. Update created in `c_monitor_shared.compliance_updates`
2. Get affected compliance element ID
3. Query ALL client databases for products referencing this element:
   ```javascript
   for (const clientId of allClients) {
     const clientDB = getClientDatabase(clientId);
     const affectedProducts = await clientDB.products.find({
       compliance_element_ids: affectedComplianceElementId
     });
     
     if (affectedProducts.length > 0) {
       // Create notification in this client's DB
       await clientDB.notifications.insertOne({
         type: "compliance_update",
         compliance_update_id: updateId,
         affected_products: affectedProducts.map(p => p._id),
         created_at: new Date()
       });
     }
   }
   ```

---

## Data Consistency Rules

### NEVER Store These in Client DB:
- ❌ Compliance element full data
- ❌ Compliance update content
- ❌ Market definitions
- ❌ Legislation text
- ❌ Standard specifications

### ALWAYS Store These in Client DB:
- ✅ Product information
- ✅ Product-compliance references (IDs only)
- ✅ Client-specific settings
- ✅ User data
- ✅ Notifications (with references to shared data)

### Reference Pattern:
```javascript
// ✅ CORRECT: Store only IDs
{
  product_id: "p_123",
  compliance_element_ids: ["ce_456", "ce_789"]
}

// ❌ WRONG: Duplicating compliance data
{
  product_id: "p_123",
  compliance_elements: [
    {title: "CE Marking", market: "EU", ...},  // Don't do this!
    {title: "FCC", market: "US", ...}
  ]
}
```

---

## Migration & Seeding

### Initial Setup

1. **Create Shared DB:** `c_monitor_shared`
2. **Seed Shared Data:**
   - Core markets (EU, US, UK, etc.)
   - Common compliance elements
   - Standard certifications (CE, FCC, UL, etc.)

3. **Create Client DB:** `c_monitor_{client_id}` for new client
4. **Seed Client Data:**
   - Empty products collection
   - Default settings
   - Initial user

### Adding New Client

```javascript
// 1. Create client database
await createDatabase(`c_monitor_${newClientId}`);

// 2. Initialize collections
await initializeClientCollections(newClientId);

// 3. Client can now add products
// 4. Products will reference shared compliance elements
```

---

## Performance Considerations

### Caching Strategy

**Shared DB Queries:**
- Compliance elements rarely change → Cache heavily
- Cache TTL: 1 hour
- Invalidate cache on update

**Client DB Queries:**
- Product data changes frequently → Short cache
- Cache TTL: 5 minutes

### Query Optimization

**Join Pattern:**
```javascript
// Efficient: Single query to shared DB with array of IDs
const elements = await sharedDB.compliance_elements.find({
  _id: {$in: productComplianceIds}
});

// Inefficient: Multiple queries
for (const id of productComplianceIds) {
  const element = await sharedDB.compliance_elements.findOne({_id: id});
}
```

---

## Future Enhancements

### Potential Additions to Shared DB:
- Industry best practices
- Compliance templates
- Risk assessment frameworks
- Common product categories
- Testing lab directory

### Client DB Enhancements:
- Product history/versions
- Internal compliance workflows
- Custom fields for products
- Team collaboration features

---

## Summary

**Key Principle:** 
> Compliance knowledge is **shared and universal**.  
> Product inventory is **private and client-specific**.  
> Relationships are maintained through **ID references**.

This architecture ensures:
- ✅ Efficient data storage
- ✅ Consistent compliance data across all clients
- ✅ Privacy for client products
- ✅ Easy updates to compliance requirements
- ✅ Scalability as client base grows

