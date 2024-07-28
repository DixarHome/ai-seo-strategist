require('dotenv').config();
const connectToDatabase = require('./utils/db');

(async () => {
  try {
    await connectToDatabase();
    console.log('Database connection successful!');
  } catch (error) {
    console.error('Database connection failed:', error);
  }
})();
