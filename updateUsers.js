const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();
const mongoUri = process.env.MONGODB_URI;

async function updateUsers() {
    try {
        await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });

        const result = await User.updateMany(
            { $or: [{ earningBalance: { $exists: false } }, { softieLevel: { $exists: false } }, { dailyProfit: { $exists: false } }] },
            {
                $set: {
                    earningBalance: 0,
                    softieLevel: 'Amateur',
                    dailyProfit: 0
                }
            }
        );

        console.log(`Updated ${result.modifiedCount} users.`);
        await mongoose.disconnect();
    } catch (error) {
        console.error('Error updating users:', error);
        process.exit(1);
    }
}

updateUsers();
