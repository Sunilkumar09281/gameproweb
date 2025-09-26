// Deployment verification script for Render
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://gamepro_db_user:PwNiJGMwNyX9L1Aw@gamepro.jhvzauc.mongodb.net/gamepro_db?retryWrites=true&w=majority';

async function verifyDeployment() {
  console.log('🔍 Verifying deployment...');
  console.log('📍 Environment:', process.env.NODE_ENV);
  console.log('🌐 Port:', process.env.PORT);
  
  try {
    // Test MongoDB connection
    console.log('🔗 Testing MongoDB connection...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected successfully!');
    
    // Test collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📊 Available collections:', collections.map(c => c.name));
    
    await mongoose.disconnect();
    console.log('✅ Deployment verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Deployment verification failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  verifyDeployment();
}

module.exports = verifyDeployment;
