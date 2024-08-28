const mongoose = require('mongoose');

const withdrawalSchema = new mongoose.Schema({
    username: { type: String, required: true },
    amount: { type: Number, default: 0 },
    walletAddress: { type: String, required: true },
    currency: { type: String, required: true },
    status: { type: String, default: 'pending' },
    createdAt: { type: Date, default: Date.now }
});

const Withdrawal = mongoose.model('Withdrawal', withdrawalSchema);

module.exports = Withdrawal;
