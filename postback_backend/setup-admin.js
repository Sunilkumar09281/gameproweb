// Setup script to create initial admin user
const { connectDB, GameProUser } = require('./database');
const bcrypt = require('bcrypt');

async function setupAdmin() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await GameProUser.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('⚠️ Admin user already exists:', existingAdmin.username);
      process.exit(0);
    }

    // Create admin user
    const adminData = {
      username: 'admin',
      email: 'admin@gamepro.com',
      password: await bcrypt.hash('admin123', 10),
      fullName: 'GamePro Administrator',
      role: 'admin',
      profilePicture: 'https://ui-avatars.com/api/?name=Admin&background=FF6B6B&color=fff&size=100'
    };

    const adminUser = new GameProUser(adminData);
    await adminUser.save();

    console.log('✅ Admin user created successfully!');
    console.log('📋 Login credentials:');
    console.log('   Username: admin');
    console.log('   Password: admin123');
    console.log('   Role: admin');

    // Create a simple user for testing
    const userData = {
      username: 'user',
      email: 'user@gamepro.com',
      password: await bcrypt.hash('user123', 10),
      fullName: 'Test User',
      role: 'simpleuser',
      profilePicture: 'https://ui-avatars.com/api/?name=User&background=4CAF50&color=fff&size=100'
    };

    const testUser = new GameProUser(userData);
    await testUser.save();

    console.log('✅ Test user created successfully!');
    console.log('📋 Login credentials:');
    console.log('   Username: user');
    console.log('   Password: user123');
    console.log('   Role: simpleuser');

    process.exit(0);

  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

// Run setup
setupAdmin();
