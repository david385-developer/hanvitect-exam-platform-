require('dotenv').config();
const connectDB = require('./config/database');
const app = require('./app');
const config = require('./config');
const User = require('./modules/auth/user.model');

const seedUsers = async () => {
  const sampleUsers = [
    { name: 'Admin User', email: 'admin@example.com', password: 'Password123!', role: 'admin', isVerified: true },
    { name: 'User One', email: 'user1@example.com', password: 'Password123!', role: 'user', isVerified: true },
    { name: 'User Two', email: 'user2@example.com', password: 'Password123!', role: 'user', isVerified: true },
  ];

  for (const u of sampleUsers) {
    const existing = await User.findOne({ email: u.email }).select('+password');
    if (!existing) {
      await User.create(u);
      console.log(`[SEED] Created account: ${u.email} (${u.role})`);
    } else {
      if (existing.role !== u.role || !existing.isVerified) {
        existing.role = u.role;
        existing.isVerified = true;
        existing.isBlocked = false;
        await existing.save();
        console.log(`[SEED] Ensured account settings for: ${u.email}`);
      }
    }
  }
};

connectDB().then(async () => {
  try {
    await seedUsers();
  } catch (err) {
    console.error('[SEED] Error creating seed accounts:', err);
  }

  const server = app.listen(config.port, () => {
    console.log(`[SERVER] Server running on port ${config.port} (env=${config.nodeEnv})`);
  });

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled Rejection:', err);
    server.close(() => process.exit(1));
  });
}).catch((err) => {
  console.error('[SERVER] Database connection error:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
