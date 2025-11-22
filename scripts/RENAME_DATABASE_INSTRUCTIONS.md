# Rename Database: c_monitor_supercase → c_monitor_{client_id}

## Step 1: Get Your Client ID

Your client_id is: `116304722376265922143` (from Auth0 user.sub)

## Step 2: Choose Migration Method

### Option A: Using MongoDB Compass (Easiest)

1. Open MongoDB Compass
2. Connect to your MongoDB cluster
3. Open the MongoDB Shell (bottom panel)
4. Copy and paste this script (replace CLIENT_ID with your actual ID):

```javascript
const OLD_DB = "c_monitor_supercase";
const NEW_DB = "c_monitor_116304722376265922143"; // Your client_id
const oldDb = db.getSiblingDB(OLD_DB);
const newDb = db.getSiblingDB(NEW_DB);
const collections = oldDb.getCollectionNames();

print("Migrating collections: " + collections.join(", "));

collections.forEach(collectionName => {
  print("Migrating: " + collectionName);
  const oldCollection = oldDb.getCollection(collectionName);
  const newCollection = newDb.getCollection(collectionName);
  const count = oldCollection.countDocuments();
  
  if (count > 0) {
    const documents = oldCollection.find().toArray();
    newCollection.insertMany(documents);
    print("  ✅ Migrated " + documents.length + " documents");
  } else {
    // Create empty collection
    newCollection.insertOne({ _temp: true });
    newCollection.deleteOne({ _temp: true });
    print("  ✅ Created empty collection");
  }
});

print("\n✅ Migration complete!");
print("\nVerifying new database:");
newDb.getCollectionNames().forEach(name => {
  const count = newDb.getCollection(name).countDocuments();
  print("  - " + name + ": " + count + " documents");
});
```

5. Run the script
6. Verify all collections are migrated (including `compliance_areas`)

### Option B: Using MongoDB Atlas Shell

1. Go to MongoDB Atlas → Your Cluster → "..." → "Open MongoDB Shell"
2. Paste the same script as above
3. Run it

### Option C: Using Command Line

```bash
# Update CLIENT_ID in the script first
cd /Users/nicolaszander/Desktop/certean/dev/certean-monitor
./scripts/rename-database.sh 116304722376265922143
```

## Step 3: Verify Migration

In MongoDB Atlas, check:
- Database: `c_monitor_116304722376265922143` exists
- Collections migrated:
  - `products`
  - `users`
  - `compliance_areas` ← **Make sure this is included!**

## Step 4: Test the Application

1. Save compliance areas from Settings page
2. Verify they appear in `c_monitor_116304722376265922143.compliance_areas`
3. Test other features (products, etc.)

## Step 5: Drop Old Database (ONLY AFTER VERIFICATION)

⚠️ **ONLY do this after you've verified everything works!**

```javascript
// In MongoDB Compass or Atlas Shell:
db.getSiblingDB("c_monitor_supercase").dropDatabase()
```

## Collections That Should Be Migrated

- ✅ `products`
- ✅ `users`
- ✅ `compliance_areas` ← **Important!**

