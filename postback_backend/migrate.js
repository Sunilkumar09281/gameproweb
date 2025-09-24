const fs = require('fs').promises;
const path = require('path');
const { connectDB, User, Postback, Partner } = require('./database');

// Migration script to move data from JSON files to MongoDB
async function migrateData() {
  try {
    console.log('🚀 Starting data migration...');
    
    // Connect to MongoDB
    await connectDB();
    
    // Clear existing data (optional - remove if you want to keep existing data)
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Postback.deleteMany({});
    await Partner.deleteMany({});
    
    // Migrate Postbacks
    await migratePostbacks();
    
    // Migrate Leaderboard (Users)
    await migrateLeaderboard();
    
    // Migrate Partners
    await migratePartners();
    
    console.log('✅ Migration completed successfully!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Migrate postbacks from postbacks.json
async function migratePostbacks() {
  try {
    const postbacksFile = path.join(__dirname, 'postbacks.json');
    const data = await fs.readFile(postbacksFile, 'utf8');
    const postbacks = JSON.parse(data);
    
    console.log(`📄 Migrating ${postbacks.length} postbacks...`);
    
    for (const postback of postbacks) {
      await Postback.create({
        postbackId: postback.id,
        method: postback.method,
        partnerId: postback.partnerId,
        partnerName: postback.partnerName,
        userData: postback.userData,
        query: postback.query,
        body: postback.body,
        headers: postback.headers,
        ip: postback.ip,
        receivedAt: new Date(postback.receivedAt)
      });
    }
    
    console.log('✅ Postbacks migrated successfully!');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('📄 No postbacks.json file found, skipping...');
    } else {
      console.error('❌ Error migrating postbacks:', error);
    }
  }
}

// Migrate leaderboard from leaderboard.json
async function migrateLeaderboard() {
  try {
    const leaderboardFile = path.join(__dirname, 'leaderboard.json');
    const data = await fs.readFile(leaderboardFile, 'utf8');
    const users = JSON.parse(data);
    
    console.log(`👥 Migrating ${users.length} users...`);
    
    for (const user of users) {
      await User.create({
        userId: user.userId,
        userName: user.userName,
        userEmail: user.userEmail,
        platform: user.platform,
        points: user.points,
        totalEarnings: user.totalEarnings,
        completedTasks: user.completedTasks,
        level: user.level,
        profilePicture: user.profilePicture,
        country: user.country,
        rank: user.rank,
        joinedAt: new Date(user.joinedAt),
        lastActivity: new Date(user.lastActivity)
      });
    }
    
    console.log('✅ Users migrated successfully!');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('👥 No leaderboard.json file found, skipping...');
    } else {
      console.error('❌ Error migrating users:', error);
    }
  }
}

// Migrate partners from partners.json
async function migratePartners() {
  try {
    const partnersFile = path.join(__dirname, 'partners.json');
    const data = await fs.readFile(partnersFile, 'utf8');
    const partners = JSON.parse(data);
    
    console.log(`🤝 Migrating ${partners.length} partners...`);
    
    for (const partner of partners) {
      await Partner.create({
        partnerId: partner.id,
        name: partner.name,
        postbackUrl: partner.postbackUrl,
        totalPostbacks: partner.totalPostbacks,
        lastPostbackAt: partner.lastPostbackAt ? new Date(partner.lastPostbackAt) : null,
        isActive: true,
        createdAt: new Date(partner.createdAt || Date.now())
      });
    }
    
    console.log('✅ Partners migrated successfully!');
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log('🤝 No partners.json file found, skipping...');
    } else {
      console.error('❌ Error migrating partners:', error);
    }
  }
}

// Run migration
migrateData();
