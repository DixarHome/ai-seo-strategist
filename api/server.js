const express = require('express');
const path = require('path');
const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const connectToDatabase = require('../utils/db');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Withdrawal = require('../models/Withdrawal');
const nodemailer = require('nodemailer');
const authRoutes = require('../routes/auth');
const Notification = require('../models/Notification');
const router = express.Router();
require('dotenv').config();


const app = express();
const port = process.env.PORT || 10000;

const adminEmail = 'support@softcoin.world';

const transporter = nodemailer.createTransport({
    service: 'Zoho',
    auth: {
        user: process.env.EMAIL,
        pass: process.env.PASSWORD
    }
});

// Use helmet to set the HSTS header
app.use(helmet.hsts({
  maxAge: 63072000, // 2 years in seconds
  includeSubDomains: true, // Applies to all subdomains as well
  preload: true // Preload into the HSTS preload list
}));

connectToDatabase().then(() => console.log('MongoDB connected'));

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, '../public')));
app.use('/api/auth', authRoutes);

const sendEmail = require('../utils/mailer');  // Adjust the path as needed

app.get('/ping', (req, res) => {
  res.send('OK');
});

// Endpoint to get the user's trybeEarnings
app.get('/api/users/:username/trybeEarnings', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username });
        if (!user) return res.status(404).send('User not found');
        res.json({ trybeEarnings: user.trybeEarnings });
    } catch (error) {
        res.status(500).send('Server error');
    }
});

// Helper function to count referrals by level recursively
async function countReferralsByLevel(user, level) {
    if (level === 1) {
        // Direct referrals (Level 1)
        return user.referrals.filter(referral => referral.commitmentBalance > 0).length;
    } else {
        // For Level 2 and beyond
        let previousLevelReferrals = await getReferralsByLevel(user, level - 1);
        let currentLevelCount = 0;

        for (let referral of previousLevelReferrals) {
            let fullReferral = await User.findById(referral).populate('referrals');
            currentLevelCount += fullReferral.referrals.filter(ref => ref.commitmentBalance > 0).length;
        }

        return currentLevelCount;
    }
}

// Endpoint to count total referrals with commitmentBalance > 0
app.get('/api/users/:username/total-referrals', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).populate('referrals');
        if (!user) return res.status(404).send('User not found');

        const level1Count = await countReferralsByLevel(user, 1);
        const level2Count = await countReferralsByLevel(user, 2);
        const level3Count = await countReferralsByLevel(user, 3);

        const totalCount = level1Count + level2Count + level3Count;

        res.json({ totalCount });
    } catch (error) {
        res.status(500).send('Server error');
    }
});

// Helper function to fetch referrals by level
async function getReferralsByLevel(user, level) {
    if (level === 1) {
        // Direct referrals (Level 1)
        return user.referrals;
    } else {
        // For Level 2 and beyond
        let previousLevelReferrals = await getReferralsByLevel(user, level - 1);
        let currentLevelReferrals = [];
        
        for (let referral of previousLevelReferrals) {
            let fullReferral = await User.findById(referral).populate('referrals');
            currentLevelReferrals = currentLevelReferrals.concat(fullReferral.referrals);
        }
        
        return currentLevelReferrals;
    }
}

// Endpoint to get user's referrals by level and criteria
app.get('/api/users/:username/referrals/:level', async (req, res) => {
    try {
        const user = await User.findOne({ username: req.params.username }).populate('referrals');
        if (!user) return res.status(404).send('User not found');

        const level = parseInt(req.params.level);
        let referrals = await getReferralsByLevel(user, level);

        referrals = referrals.filter(referral => referral.commitmentBalance > 0);

        const formattedReferrals = referrals.map(referral => ({
            username: referral.username,
            commitmentBalance: referral.commitmentBalance,
            earningBalance: referral.earningBalance
        }));

        res.json(formattedReferrals);
    } catch (error) {
        res.status(500).send('Server error');
    }
});

app.post('/api/save-subscription', async (req, res) => {
  try {
    const subscription = req.body;
    const username = req.body.username; // You should send the username along with the subscription

    const user = await User.findOneAndUpdate(
      { username: username },
      { pushSubscription: subscription }
    );

    res.status(201).json({ message: 'Subscription saved.' });
  } catch (error) {
    console.error('Error saving subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription.' });
  }
});

app.get('/api/users/:username/withdrawals', async (req, res) => {
    const { username } = req.params;

    try {
        const user = await User.findOne({ username }).populate('withdrawals').exec();
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const withdrawals = user.withdrawals.sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by most recent
        const totalWithdrawal = user.totalWithdrawal || 0;

        res.status(200).json({ withdrawals, totalWithdrawal });
    } catch (error) {
        console.error('Error fetching withdrawals:', error);
        res.status(500).json({ error: 'Failed to fetch withdrawals' });
    }
});

app.get('/api/leaderboard/:username', async (req, res) => {
    const { username } = req.params;

    try {
        // Fetch all users with a commitmentBalance greater than 0
        const users = await User.find({ commitmentBalance: { $gt: 0 } })
            .sort({ commitmentBalance: -1 })  // Sort by commitmentBalance in descending order
            .select('username commitmentBalance earningBalance totalWithdrawal');  // Select only the needed fields

        if (!users || users.length === 0) {
            return res.status(404).json({ message: 'No users found for the leaderboard' });
        }

        // Find the rank of the user requesting the leaderboard
        const userIndex = users.findIndex(user => user.username === username);
        const userRank = userIndex >= 0 ? userIndex + 1 : null;  // Rank starts at 1

        // Respond with the top 10 users and the rank of the requested user
        res.status(200).json({
            leaders: users.slice(0, 10),  // Top 10 users
            userRank: userRank ? userRank : 'Not Ranked'  // Show rank or 'Not Ranked' if user isn't in the leaderboard
        });
    } catch (error) {
        console.error('Error fetching leaderboard:', error);
        res.status(500).json({ message: 'Error fetching leaderboard' });
    }
});

app.post('/api/updateSpinTickets', async (req, res) => {
    const { username, spinTickets } = req.body; // `spinTickets` will be -1 for deduction

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Check if the user has enough spin tickets
        if (user.spinTickets + spinTickets < 0) {
            return res.status(400).json({ error: 'Not enough spin tickets' });
        }

        // Update the user's spin ticket count
        user.spinTickets += spinTickets;
        await user.save();

        res.status(200).json({ success: true, spinTickets: user.spinTickets });
    } catch (error) {
        console.error('Error updating spin tickets:', error);
        res.status(500).json({ error: 'Failed to update spin tickets' });
    }
});

app.post('/api/updatePrize', async (req, res) => {
    const { username, prize, rewardType } = req.body;

    try {
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update user balance based on the rewardType
        switch (rewardType) {
            case 'usd':
                user.earningBalance += prize;
                break;
            case 'sft':
                user.coinBalance += prize;
                break;
            case 'tickets':
                user.spinTickets += prize;
                break;
            default:
                return res.status(400).json({ error: 'Invalid reward type' });
        }

        await user.save();
        res.status(200).json({ success: true, message: 'Prize successfully added' });
    } catch (error) {
        console.error('Error updating prize:', error);
        res.status(500).json({ error: 'Failed to update prize' });
    }
});

// Adjust the spin-info route to accept the username from the request
app.get('/api/users/:username/spin-info', async (req, res) => {
    try {
        const { username } = req.params;
        const user = await User.findOne({ username }).select('spinTickets coinBalance earningBalance');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ spinTickets: user.spinTickets, coinBalance: user.coinBalance, earningBalance: user.earningBalance });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch spin info.' });
    }
});

// server.js

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

        // Create a new withdrawal document
        const withdrawal = new Withdrawal({
            username: user.username,
            amount,
            walletAddress,
            currency: method // Assuming 'method' refers to currency
        });

        await withdrawal.save();

        // Add withdrawal reference to the user's withdrawals array
        user.withdrawals.push(withdrawal._id);
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

app.post('/api/payments', async (req, res) => {
    try {
        const { username, amount, transactionId, cryptoType } = req.body;

        if (!username || !amount || !transactionId || !cryptoType) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const newTransaction = new Transaction({
            username,
            amount,
            transactionId,
            cryptoType
        });

        await newTransaction.save();

        user.transactions.push(newTransaction._id);
        await user.save();

        const userMailOptions = {
            from: process.env.EMAIL,
            to: user.email,
            subject: 'Transaction Received',
            text: `Dear ${user.fullName},\n\nYour deposit is being processed. You will receive a status message within 2 to 24 hours.\n\nThank you,\nSoftcoin Team`
        };

        transporter.sendMail(userMailOptions, (error, info) => {
            if (error) {
                console.error('Error sending email to user:', error);
                return res.status(500).json({ message: 'Internal server error' });
            }
            console.log('Email sent to user:', info.response);

            // Send email to admin
            const adminMailOptions = {
                from: process.env.EMAIL,
                to: adminEmail,
                subject: 'New Transaction Submitted',
                text: `A new transaction has been submitted by ${username}.\n\nAmount: ${amount} USD\nTransaction ID: ${transactionId}\nCrypto Type: ${cryptoType}\n\nPlease review the transaction.\n\nThank you,\nSoftcoin Team`
            };

            transporter.sendMail(adminMailOptions, (error, info) => {
                if (error) {
                    console.error('Error sending email to admin:', error);
                    return res.status(500).json({ message: 'Internal server error' });
                }
                console.log('Email sent to admin:', info.response);
                res.status(201).json({ message: 'Payment data received and stored', transaction: newTransaction });
            });
        });

    } catch (error) {
        console.error('Error saving payment data:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
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

        // Define rewards based on the user's level
        const rewards = [5000, 10000, 20000, 40000, 80000]; // These should correspond to your levels
        const minedAmount = rewards[user.level - 1]; // Calculate the reward based on the current level

        // Handle referral bonus immediately when mining starts
        if (user.referredBy) {
            const referrer = await User.findById(user.referredBy);
            if (referrer) {
                const referralBonus = minedAmount * 0.2; // 20% of the mined amount
                referrer.coinBalance += referralBonus;
                referrer.totalReferralBonus = (referrer.totalReferralBonus || 0) + referralBonus;
                await referrer.save();
            }
        }
        
        // Determine spin tickets based on user level
        const spinTicketsByLevel = [1, 2, 4, 8, 16]; // Tickets for levels 1 to 5
        const spinTickets = spinTicketsByLevel[user.level - 1] || 0; // Default to 0 if level is outside range

        // Reward the user with spin tickets
        user.spinTickets += spinTickets;

        await user.save();

        res.status(200).json({
    miningStartTime: user.miningStartTime,
    coinBalance: user.coinBalance,
    level: user.level,
    miningSessionCount: user.miningSessionCount || 0,
    spinTickets: user.spinTickets // Include spinTickets in the response
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
        const rewards = [5000, 10000, 20000, 40000, 80000];
        const miningEndTime = new Date(user.miningStartTime).getTime() + rewardIntervals[user.level - 1];

        if (user.isMining && currentTime >= miningEndTime) {
            const minedAmount = rewards[user.level - 1];
            user.coinBalance += minedAmount;
            user.isMining = false;
            user.miningStartTime = null;
            user.miningSessionCount = (user.miningSessionCount || 0) + 1;

            await user.save();
        }

        res.status(200).json({
            miningStartTime: user.miningStartTime,
            coinBalance: user.coinBalance,
            level: user.level,
            miningSessionCount: user.miningSessionCount || 0,
            miningComplete: !user.isMining,
            spinTickets: user.spinTickets
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

['friends', 'tasks', 'tasksv2', 'trybe', 'softie', 'more', 'upgrades', 'login', 'register', 'reset-password', 'verification', 'home', 'payment','whitepaper', 'withdraw', 'learn-more', 'market', 'wheelv2', 'game-info' ].forEach(file => {
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