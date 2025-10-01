// Clean up database indexes and collections
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://gamepro_db_user:PwNiJGMwNyX9L1Aw@gamepro.jhvzauc.mongodb.net/gamepro_db?retryWrites=true&w=majority';

async function cleanupDatabase() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Check existing collections
    console.log('🔍 Checking existing collections...');
    const collections = await db.listCollections().toArray();
    console.log('📋 Collections found:', collections.map(c => c.name));

    // Check postbacks collection indexes
    if (collections.find(c => c.name === 'postbacks')) {
      console.log('🔍 Checking postbacks collection indexes...');
      const indexes = await db.collection('postbacks').indexes();
      console.log('📋 Postbacks indexes:', indexes);

      // Drop problematic indexes
      try {
        console.log('🗑️ Dropping postbackId_1 index...');
        await db.collection('postbacks').dropIndex('postbackId_1');
        console.log('✅ Dropped postbackId_1 index');
      } catch (error) {
        console.log('⚠️ Index postbackId_1 not found or already dropped');
      }

      // Clear postbacks collection to start fresh
      console.log('🗑️ Clearing postbacks collection...');
      const deleteResult = await db.collection('postbacks').deleteMany({});
      console.log(`✅ Deleted ${deleteResult.deletedCount} postback records`);
    }

    // Check offerlogs collection indexes
    if (collections.find(c => c.name === 'offerlogs')) {
      console.log('🔍 Checking offerlogs collection indexes...');
      const offerIndexes = await db.collection('offerlogs').indexes();
      console.log('📋 OfferLogs indexes:', offerIndexes);

      // Clear offer logs to start fresh
      console.log('🗑️ Clearing offerlogs collection...');
      const deleteOfferResult = await db.collection('offerlogs').deleteMany({});
      console.log(`✅ Deleted ${deleteOfferResult.deletedCount} offer log records`);
    }

    console.log('🎉 Database cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error cleaning up database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

cleanupDatabase();
