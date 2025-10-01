// Simple test to check what's in the database
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://gamepro_db_user:PwNiJGMwNyX9L1Aw@gamepro.jhvzauc.mongodb.net/gamepro_db?retryWrites=true&w=majority';

async function checkDatabase() {
  try {
    console.log('🔍 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Check what collections exist
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('\n📋 Available collections:');
    collections.forEach(col => console.log(`  - ${col.name}`));

    // Define the schema to check users
    const gameproUserSchema = new mongoose.Schema({
      username: String,
      email: String,
      password: String,
      role: String,
      points: Number,
      level: Number
    });

    const GameProUser = mongoose.model('GameProUser', gameproUserSchema);

    // Check existing users
    const users = await GameProUser.find({}, 'username email role points');
    console.log('\n👥 Existing users:');
    if (users.length === 0) {
      console.log('  No users found!');
      
      // Create test users
      console.log('\n🔧 Creating test users...');
      const bcrypt = require('bcrypt');
      
      const adminUser = new GameProUser({
        username: 'admin',
        email: 'admin@example.com',
        password: await bcrypt.hash('admin123', 10),
        role: 'admin',
        points: 0,
        level: 1
      });
      
      const regularUser = new GameProUser({
        username: 'user',
        email: 'user@example.com',
        password: await bcrypt.hash('user123', 10),
        role: 'simpleuser',
        points: 0,
        level: 1
      });

      await adminUser.save();
      await regularUser.save();
      
      console.log('✅ Created admin user: admin/admin123');
      console.log('✅ Created regular user: user/user123');
      
    } else {
      users.forEach(user => {
        console.log(`  - ${user.username} (${user.email}) - Role: ${user.role} - Points: ${user.points}`);
      });
    }

    // Check if OfferLog collection exists
    const offerLogSchema = new mongoose.Schema({
      userId: mongoose.Schema.Types.ObjectId,
      username: String,
      offerName: String,
      status: String,
      rewardAmount: Number,
      clickedAt: Date,
      completedAt: Date
    });

    const OfferLog = mongoose.model('OfferLog', offerLogSchema);
    const offerLogs = await OfferLog.find({}).limit(5);
    
    console.log('\n📊 Existing offer logs:');
    if (offerLogs.length === 0) {
      console.log('  No offer logs found yet');
    } else {
      offerLogs.forEach(log => {
        console.log(`  - ${log.username}: ${log.offerName} (${log.status}) - $${log.rewardAmount}`);
      });
    }

    console.log('\n✅ Database check complete');

  } catch (error) {
    console.error('❌ Database check failed:', error);
  } finally {
    await mongoose.disconnect();
  }
}

checkDatabase();
