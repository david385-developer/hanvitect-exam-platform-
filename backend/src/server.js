require('dotenv').config();
const connectDB = require('./config/database');
const app = require('./app');
const config = require('./config');

connectDB();

const server = app.listen(config.port, () => {
  console.log(`[SERVER] Server running on port ${config.port} (env=${config.nodeEnv})`);
});

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});
