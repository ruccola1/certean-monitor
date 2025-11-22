// MongoDB script to rename c_monitor_supercase to c_monitor_{client_id}
// and migrate all collections including compliance_areas

// Usage:
// 1. Get your client_id from Auth0 (user.sub) - e.g., "116304722376265922143"
// 2. Update OLD_DB_NAME and NEW_DB_NAME below
// 3. Run: mongosh "your-connection-string" < scripts/rename-database.js
//    OR in MongoDB Compass: Paste this script in the MongoDB shell

const OLD_DB_NAME = "c_monitor_supercase";
const NEW_DB_NAME = "c_monitor_116304722376265922143"; // Replace with your actual client_id

print(`Starting database migration from ${OLD_DB_NAME} to ${NEW_DB_NAME}...`);

// Get the old database
const oldDb = db.getSiblingDB(OLD_DB_NAME);
const newDb = db.getSiblingDB(NEW_DB_NAME);

// Get all collection names from old database
const collections = oldDb.getCollectionNames();

print(`Found ${collections.length} collections to migrate: ${collections.join(", ")}`);

// Migrate each collection
collections.forEach(collectionName => {
  print(`\nMigrating collection: ${collectionName}...`);
  
  const oldCollection = oldDb.getCollection(collectionName);
  const newCollection = newDb.getCollection(collectionName);
  
  // Count documents
  const count = oldCollection.countDocuments();
  print(`  Found ${count} documents`);
  
  if (count > 0) {
    // Copy all documents
    const documents = oldCollection.find().toArray();
    if (documents.length > 0) {
      newCollection.insertMany(documents);
      print(`  ✅ Migrated ${documents.length} documents`);
    }
  } else {
    print(`  ⚠️  Collection is empty, creating empty collection`);
    // Create empty collection by inserting and deleting a dummy doc
    newCollection.insertOne({ _temp: true });
    newCollection.deleteOne({ _temp: true });
  }
});

// Verify migration
print(`\n✅ Migration complete!`);
print(`\nVerifying collections in new database:`);
const newCollections = newDb.getCollectionNames();
newCollections.forEach(collectionName => {
  const count = newDb.getCollection(collectionName).countDocuments();
  print(`  - ${collectionName}: ${count} documents`);
});

print(`\n⚠️  IMPORTANT: After verifying the migration, you can drop the old database:`);
print(`   db.getSiblingDB("${OLD_DB_NAME}").dropDatabase()`);
print(`\n⚠️  DO NOT drop the old database until you've verified everything works!`);

