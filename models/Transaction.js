const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    username: { type: String, required: true },
    amount: { type: Number, required: true },
    transactionId: { type: String, required: true },
    cryptoType: { type: String, required: true }, // Add if you are tracking the type of cryptocurrency
    status: { type: String, default: 'pending' }, // Set default status to 'pending'
    createdAt: { type: Date, default: Date.now }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;