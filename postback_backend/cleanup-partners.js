// Clean up partners collection
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://gamepro_db_user:PwNiJGMwNyX9L1Aw@gamepro.jhvzauc.mongodb.net/gamepro_db?retryWrites=true&w=majority';

async function cleanupPartners() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;

    // Check partners collection
    const collections = await db.listCollections().toArray();
    if (collections.find(c => c.name === 'partners')) {
      console.log('🔍 Checking partners collection indexes...');
      const indexes = await db.collection('partners').indexes();
      console.log('📋 Partners indexes:', indexes);

      // Drop problematic indexes
      try {
        console.log('🗑️ Dropping partnerId_1 index...');
        await db.collection('partners').dropIndex('partnerId_1');
        console.log('✅ Dropped partnerId_1 index');
      } catch (error) {
        console.log('⚠️ Index partnerId_1 not found or already dropped');
      }

      // Clear partners collection
      console.log('🗑️ Clearing partners collection...');
      const deleteResult = await db.collection('partners').deleteMany({});
      console.log(`✅ Deleted ${deleteResult.deletedCount} partner records`);
    }

    console.log('🎉 Partners cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error cleaning up partners:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

cleanupPartners();
