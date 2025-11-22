// MongoDB doesn't support direct database renaming
// This script copies all collections and drops the old database
// Run in MongoDB Compass or Atlas Shell

const OLD_DB = "c_monitor_supercase";
const NEW_DB = "c_monitor_116304722376265922143";

// Use admin database for copyDatabase (deprecated but still works in some versions)
// Or use the modern approach: copy collections manually

const oldDb = db.getSiblingDB(OLD_DB);
const newDb = db.getSiblingDB(NEW_DB);

// Get all collections
const collections = oldDb.getCollectionNames();
print(`Renaming database: ${OLD_DB} → ${NEW_DB}`);
print(`Collections to migrate: ${collections.join(", ")}\n`);

// Copy each collection
collections.forEach(collectionName => {
  print(`Migrating ${collectionName}...`);
  oldDb.getCollection(collectionName).aggregate([{ $match: {} }, { $out: `${NEW_DB}.${collectionName}` }]);
  print(`✅ ${collectionName} migrated`);
});

// Drop old database
print(`\nDropping old database ${OLD_DB}...`);
oldDb.dropDatabase();
print(`✅ Database renamed to ${NEW_DB}`);

