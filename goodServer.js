const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const connectToDatabase = require('../utils/db');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const authRoutes = require('../routes/auth');
const Notification = require('../models/Notification');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

connectToDatabase().then(() => console.log('MongoDB connected'));

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/api/auth', authRoutes);

const sendEmail = require('../utils/mailer');  // Adjust the path as needed

app.get('/ping', (req, res) => {
  res.send('OK');
});

app.post('/api/withdraw', async (req, res) => {
    const { username, amount, method, walletAddress } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        if (amount > user.earningBalance || amount < 10) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        user.earningBalance -= amount;
        await user.save();

        // Send email to support
        const supportEmailContent = `
            Username: ${user.username}
            Full Name: ${user.fullName}
            Email: ${user.email}
            Amount: ${amount}
            Method: ${method}
            Wallet Address: ${walletAddress}
        `;
        await sendEmail('support@softcoin.world', 'Withdrawal Request', supportEmailContent);

        // Send email to user
        const userEmailContent = `
            Dear ${user.fullName},

            Your withdrawal request of ${amount} USD is being processed. Your wallet will be credited within 2 to 24 hours.

            Best regards,
            Softcoin Team
        `;
        await sendEmail(user.email, 'Withdrawal Request Received', userEmailContent);

        res.json({ success: true });
    } catch (error) {
        console.error('Error processing withdrawal request:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const cron = require('node-cron');
const calculateAndUpdateReturns = require('../utils/returns');

// Schedule the job to run at 12am GMT every day
cron.schedule('0 0 * * *', async () => {
    console.log('Calculating and updating returns...');
    await calculateAndUpdateReturns();
}, {
    scheduled: true,
    timezone: "Etc/GMT"
});


app.get('/api/users/:username/commitmentBalance', async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username: username }, 'commitmentBalance');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ commitmentBalance: user.commitmentBalance });
    } catch (error) {
        console.error('Error fetching commitment balance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/users/:username/earningBalance', async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username: username }, 'earningBalance');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ earningBalance: user.earningBalance });
    } catch (error) {
        console.error('Error fetching earning balance:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.get('/api/users/:username/transactions', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username }).populate('transactions').exec();
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user.transactions);
    } catch (error) {
        console.error('Error fetching transaction history:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Endpoint to fetch notifications
app.get('/api/notifications/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username }).populate('notifications');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const notifications = user.notifications.map(notification => ({
            id: notification._id,
            title: notification.title,
            message: notification.message,
            read: notification.read,
            date: notification.date
        }));

        res.status(200).json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        res.status(500).json({ message: 'Error fetching notifications' });
    }
});

// Endpoint to mark notification as read
app.post('/api/notifications/markRead', async (req, res) => {
    const { notificationId } = req.body;

    try {
        const notification = await Notification.findById(notificationId);
        if (!notification) return res.status(404).json({ message: 'Notification not found' });

        notification.read = true;
        await notification.save();

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error marking notification as read:', error);
        res.status(500).json({ message: 'Error marking notification as read' });
    }
});

// server.js

app.get('/api/referrals/:username', async (req, res) => {
    const { username } = req.params;

    try {
        console.log('Fetching referrals for:', username);
        const user = await User.findOne({ username }).populate('referrals');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const referrals = user.referrals.map(ref => ({
            username: ref.username,
            coinBalance: ref.coinBalance,
            commitmentBalance: ref.commitmentBalance
        }));

        const totalEarnings = user.totalReferralBonus; // Only totalReferralBonus

        const response = { referrals, totalEarnings };
        res.status(200).json(response);
    } catch (error) {
        console.error('Error fetching referrals:', error);
        res.status(500).json({ message: 'Error fetching referrals' });
    }
});

app.post('/api/startMining', async (req, res) => {
    const { username } = req.body;
    try {
        const user = await User.findOne({ username }).populate('referrals');
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (user.isMining) return res.status(400).json({ message: 'Mining already in progress' });

        user.isMining = true;
        user.miningStartTime = new Date();
        await user.save();

        // Don't add referral bonuses to coinBalance
        res.status(200).json({
            miningStartTime: user.miningStartTime,
            coinBalance: user.coinBalance,
            level: user.level,
            miningSessionCount: user.miningSessionCount || 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Error starting mining' });
    }
});

app.post('/api/miningStatus', async (req, res) => {
    const { username } = req.body;
    try {
        const user = await User.findOne({ username }).populate('referrals');
        if (!user) return res.status(404).json({ message: 'User not found' });

        const currentTime = Date.now();
        const rewardIntervals = [2 * 60 * 60 * 1000, 3 * 60 * 60 * 1000, 4 * 60 * 60 * 1000, 5 * 60 * 60 * 1000, 6 * 60 * 60 * 1000];
        const rewards = [15000, 30000, 60000, 120000, 240000];
        const miningEndTime = new Date(user.miningStartTime).getTime() + rewardIntervals[user.level - 1];

        if (user.isMining && currentTime >= miningEndTime) {
            const minedAmount = rewards[user.level - 1];
            user.coinBalance += minedAmount;
            user.isMining = false;
            user.miningStartTime = null;
            user.miningSessionCount = (user.miningSessionCount || 0) + 1;

            // Handle referral bonus
            if (user.referredBy) {
                const referrer = await User.findById(user.referredBy);
                if (referrer) {
                    const referralBonus = minedAmount * 0.2;
                    referrer.coinBalance += referralBonus;
                    referrer.totalReferralBonus = (referredBy.totalReferralBonus || 0) + referralBonus;
                    await referrer.save();
                }
            }

            await user.save();
        }

        res.status(200).json({
            miningStartTime: user.miningStartTime,
            coinBalance: user.coinBalance,
            level: user.level,
            miningSessionCount: user.miningSessionCount || 0,
            miningComplete: !user.isMining
        });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving mining status' });
    }
});

app.post('/api/upgradeLevel', async (req, res) => {
    const { username, level } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });
        if (level !== user.level + 1) return res.status(400).json({ message: 'Cannot skip levels' });

        const upgradeCosts = [0, 100000, 500000, 2000000, 10000000];
        if (user.coinBalance < upgradeCosts[level - 1]) return res.status(400).json({ message: 'Insufficient balance' });

        user.coinBalance -= upgradeCosts[level - 1]; // Only reduce coinBalance, not totalReferralBonus
        user.level = level;
        await user.save();

        res.status(200).json({ success: true, level: user.level, coinBalance: user.coinBalance });
    } catch (error) {
        res.status(500).json({ message: 'Error upgrading level' });
    }
});

// Endpoint to update the user's balance
app.post('/api/updateBalance', async (req, res) => {
    const { username, reward } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });
        user.coinBalance += reward;
        await user.save();
        res.status(200).json({ message: 'Balance updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating balance' });
    }
});

// Endpoint to claim a task reward
// Endpoint to claim a task reward
app.post('/api/claimTask', async (req, res) => {
    const { username, taskId, reward } = req.body;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const claimedTasks = user.claimedTasks || [];
        if (claimedTasks.includes(taskId)) {
            return res.status(400).json({ success: false, message: 'Task already claimed' });
        }

        user.coinBalance += reward;
        claimedTasks.push(taskId);
        user.claimedTasks = claimedTasks;
        await user.save();

        res.status(200).json({ success: true, message: 'Task claimed successfully' });
    } catch (error) {
        console.error('Error claiming task:', error);
        res.status(500).json({ success: false, message: 'Error claiming task' });
    }
});

// Endpoint to check the status of a task
app.get('/api/taskStatus/:username/:taskId', async (req, res) => {
    const { username, taskId } = req.params;
    try {
        const user = await User.findOne({ username });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const claimedTasks = user.claimedTasks || [];
        const claimed = claimedTasks.includes(taskId);

        res.status(200).json({ success: true, claimed });
    } catch (error) {
        console.error('Error checking task status:', error);
        res.status(500).json({ success: false, message: 'Error checking task status' });
    }
});

app.get('/api/miningSessionCount/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username });

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({ miningSessionCount: user.miningSessionCount });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching mining session count' });
    }
});

app.get('/api/referralCount/:username', async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username });

        if (!user) return res.status(404).json({ message: 'User not found' });

        res.status(200).json({ referralCount: user.referralCount });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching referral count' });
    }
});

app.use((err, req, res, next) => {
    console.error('Global error handler:', err);
    res.status(500).json({ message: 'Internal server error.' });
});

['friends', 'tasks', 'softie', 'more', 'upgrades', 'login', 'register', 'reset-password', 'verification', 'home', 'payment','whitepaper', 'withdraw', 'learn-more', 'market' ].forEach(file => {
    app.get(`/${file}`, (req, res) => {
        res.sendFile(path.join(__dirname, '../public', `${file}.html`));
    });
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../public', 'index.html'));
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});

module.exports = app;