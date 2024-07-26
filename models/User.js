const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    fullName: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    coinBalance: { type: Number, default: 0 },
    isMining: { type: Boolean, default: false },
    miningStartTime: { type: Date, default: null },
    referralUsername: { type: String, default: '' },
    referrals: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    referredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    level: { type: Number, default: 1 },
    miningSessionCount: { type: Number, default: 0 },
    referralCount: { type: Number, default: 0 },
    lastCheckIn: { type: Date, default: null },
    // Other fields as necessary

    claimedTasks: { type: [String], default: [] }, // Add this line
    verificationToken: { type: String },
    isVerified: { type: Boolean, default: false },
    resetToken: {
        token: String,
        expires: Date
    }
});

const User = mongoose.model('User', userSchema);

module.exports = User;