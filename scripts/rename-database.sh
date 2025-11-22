#!/bin/bash
# Script to rename c_monitor_supercase database to c_monitor_{client_id}
# This migrates all collections including compliance_areas

# Get MongoDB connection string from environment or use default
MONGODB_URI="${MONGODB_URI:-mongodb://localhost:27017}"

# Get client_id from user (or use the one from Auth0)
CLIENT_ID="${1:-116304722376265922143}"

OLD_DB="c_monitor_supercase"
NEW_DB="c_monitor_${CLIENT_ID}"

echo "Migrating database: ${OLD_DB} -> ${NEW_DB}"
echo "Client ID: ${CLIENT_ID}"
echo ""

# Run the migration script
mongosh "${MONGODB_URI}" --eval "
const oldDb = db.getSiblingDB('${OLD_DB}');
const newDb = db.getSiblingDB('${NEW_DB}');
const collections = oldDb.getCollectionNames();

print('Found collections: ' + collections.join(', '));

collections.forEach(collectionName => {
  print('Migrating: ' + collectionName);
  const oldCollection = oldDb.getCollection(collectionName);
  const newCollection = newDb.getCollection(collectionName);
  const count = oldCollection.countDocuments();
  
  if (count > 0) {
    const documents = oldCollection.find().toArray();
    newCollection.insertMany(documents);
    print('  Migrated ' + documents.length + ' documents');
  } else {
    // Create empty collection
    newCollection.insertOne({ _temp: true });
    newCollection.deleteOne({ _temp: true });
    print('  Created empty collection');
  }
});

print('\\nMigration complete!');
print('Collections in new database:');
newDb.getCollectionNames().forEach(name => {
  const count = newDb.getCollection(name).countDocuments();
  print('  - ' + name + ': ' + count + ' documents');
});
"

echo ""
echo "✅ Migration script completed!"
echo ""
echo "⚠️  Verify the data in MongoDB Atlas before dropping the old database"
echo "⚠️  To drop old database (AFTER verification):"
echo "   mongosh \"${MONGODB_URI}\" --eval \"db.getSiblingDB('${OLD_DB}').dropDatabase()\""

