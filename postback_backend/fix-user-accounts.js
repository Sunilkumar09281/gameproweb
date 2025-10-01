// Fix user accounts by setting isActive to true
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://gamepro_db_user:PwNiJGMwNyX9L1Aw@gamepro.jhvzauc.mongodb.net/gamepro_db?retryWrites=true&w=majority';

const gameproUserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  fullName: { type: String, default: '' },
  role: { type: String, enum: ['admin', 'simpleuser'], default: 'simpleuser' },
  profilePicture: { type: String, default: '' },
  points: { type: Number, default: 0 },
  level: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  lastLogin: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const GameProUser = mongoose.model('GameProUser', gameproUserSchema);

async function fixUserAccounts() {
  try {
    console.log('🔧 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    console.log('🔍 Finding all users...');
    const users = await GameProUser.find({});
    console.log(`📋 Found ${users.length} users`);

    console.log('🔧 Updating users to set isActive = true...');
    const result = await GameProUser.updateMany(
      {},
      { $set: { isActive: true } }
    );

    console.log(`✅ Updated ${result.modifiedCount} users`);

    // Verify the fix
    console.log('🔍 Verifying users...');
    const activeUsers = await GameProUser.find({ isActive: true });
    console.log(`✅ Active users: ${activeUsers.length}`);

    activeUsers.forEach(user => {
      console.log(`   - ${user.username} (${user.role}) - Active: ${user.isActive}`);
    });

    console.log('🎉 User accounts fixed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing user accounts:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

fixUserAccounts();
