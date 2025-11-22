// Simple script to rename c_monitor_supercase to c_monitor_116304722376265922143
// Run in MongoDB Compass or Atlas Shell

const OLD_DB = "c_monitor_supercase";
const NEW_DB = "c_monitor_116304722376265922143";

const oldDb = db.getSiblingDB(OLD_DB);
const newDb = db.getSiblingDB(NEW_DB);

// Get all collections
const collections = oldDb.getCollectionNames();
print(`Migrating ${collections.length} collections from ${OLD_DB} to ${NEW_DB}...`);

// Copy each collection
collections.forEach(collectionName => {
  const oldCollection = oldDb.getCollection(collectionName);
  const newCollection = newDb.getCollection(collectionName);
  const count = oldCollection.countDocuments();
  
  if (count > 0) {
    const documents = oldCollection.find().toArray();
    newCollection.insertMany(documents);
    print(`✅ ${collectionName}: ${documents.length} documents`);
  } else {
    // Create empty collection
    newCollection.insertOne({ _temp: true });
    newCollection.deleteOne({ _temp: true });
    print(`✅ ${collectionName}: empty collection created`);
  }
});

// Drop old database
print(`\nDropping old database ${OLD_DB}...`);
oldDb.dropDatabase();
print(`✅ Done! Database renamed to ${NEW_DB}`);

