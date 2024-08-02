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
    claimedTasks: { type: [String], default: [] },
    verificationToken: { type: String },
    isVerified: { type: Boolean, default: false },
    resetToken: {
        token: String,
        expires: Date
    },
    notifications: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Notification' }],
    transactions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' }], // Add this line
    commitmentBalance: { type: Number, default: 0 },
    earningBalance: { type: Number, default: 0 }
});

// Method to calculate daily returns and update the earning balance
userSchema.methods.calculateDailyReturns = async function () {
    if (this.commitmentBalance > 0) {
        const dailyRates = [
            { min: 5, max: 30, rate: 0.03 },
            { min: 31, max: 100, rate: 0.04 },
            { min: 101, max: 500, rate: 0.05 },
            { min: 501, max: 2000, rate: 0.06 },
            { min: 2001, max: 5000, rate: 0.07 },
            { min: 5001, max: Infinity, rate: 0.08 }
        ];

        const dailyRate = dailyRates.find(rate => this.commitmentBalance >= rate.min && this.commitmentBalance <= rate.max);
        if (dailyRate) {
            const dailyReturn = this.commitmentBalance * dailyRate.rate;
            this.earningBalance += dailyReturn;
            await this.save();
            return dailyReturn;
        }
    }
    return 0;
};

const User = mongoose.model('User', userSchema);

module.exports = User;
