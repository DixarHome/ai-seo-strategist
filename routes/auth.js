const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust the path according to your project structure
const Notification = require('../models/Notification'); // Import the Notification model
const nodemailer = require('nodemailer');
const crypto = require('crypto');
require('dotenv').config(); // Add this line to load environment variables from the .env file

// Function to send emails
async function sendEmail(to, subject, text) {
    const transporter = nodemailer.createTransport({
        service: 'Zoho',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        }
    });

    const mailOptions = {
        from: process.env.EMAIL,
        to,
        subject,
        text
    };

    await transporter.sendMail(mailOptions);
}

// Send verification email
async function sendVerificationEmail(email, token) {
    const verificationLink = `http://www.softcoin.world/verification?token=${token}`;
    const message = `Please verify your email address by clicking the link: ${verificationLink}`;
    await sendEmail(email, 'Email Verification', message);
}

// Send welcome email
async function sendWelcomeEmail(email, fullName) {
    const message = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
            <h2>Welcome to Softcoin, ${fullName}!</h2>
            <p>We're excited to have you on board. Softcoin is a revolutionary cryptocurrency project that offers more than just traditional airdrops. As a member of our community, you'll enjoy a range of benefits and opportunities.</p>
            <p>Here's what you can expect:</p>
            <ul>
                <li>Exclusive access to our <a href="http://www.softcoin.world/investment-platform" style="color: blue;">investment platform</a></li>
                <li>Regular updates on our <a href="https://twitter.com/softcoin__" style="color: blue;">Twitter</a> and <a href="https://t.me/softcoinupdate" style="color: blue;">Telegram</a> channels</li>
                <li>Exciting referral rewards and bonuses</li>
                <li>And much more!</li>
            </ul>
            <p>Stay connected with us:</p>
            <p>
                <a href="https://twitter.com/softcoin__"><img src="https://via.placeholder.com/150x50?text=Twitter" alt="Twitter" style="width: 150px; height: 50px;"></a>
                <a href="https://t.me/softcoinupdate"><img src="https://via.placeholder.com/150x50?text=Telegram" alt="Telegram" style="width: 150px; height: 50px;"></a>
            </p>
            <p>If you have any questions or need assistance, feel free to reach out to our support team.</p>
            <p>Thank you for joining us. Together, let's make the future of cryptocurrency brighter!</p>
            <p>Best Regards,<br>Softcoin Team</p>
        </div>
    `;

    await sendEmail(email, 'Welcome to Softcoin', message);
}

// Registration endpoint
router.post('/register', async (req, res) => {
    const { fullName, username, email, password, referralUsername } = req.body;

    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email format' });
    }

    if (password.length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long' });
    }

    try {
        const existingUser = await User.findOne({ username });
        const existingEmail = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: 'Username already exists' });
        }

        if (existingEmail) {
            return res.status(400).json({ message: 'Email already registered' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        let referrer = null;
        if (referralUsername) {
            referrer = await User.findOne({ username: referralUsername });
        }

        const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const newUser = new User({
            fullName,
            username,
            email,
            password: hashedPassword,
            referralUsername,
            referredBy: referrer ? referrer._id : null,
            coinBalance: 50000, // Initial bonus for the referred friend
            verificationToken, // Save the verification token
            isVerified: false, // Set the user as unverified initially
        });

        await newUser.save();

        if (referrer) {
            referrer.referrals.push(newUser._id);
            const referralBonus = 50000; // Bonus for the referrer
            referrer.coinBalance += referralBonus;
            referrer.totalReferralBonus = (referrer.totalReferralBonus || 0) + referralBonus;
            await referrer.save();

            const notification = new Notification({
                user: referrer._id,
                title: 'New Referral Registered!',
                message: `${newUser.username} has registered using your referral link, and you have been rewarded with 50,000 SFT.`
            });

            await notification.save();

            referrer.notifications.push(notification._id);
            await referrer.save();
        }

        // Send verification email
        await sendVerificationEmail(email, verificationToken);

        // Send welcome email
        await sendWelcomeEmail(email, fullName);

        res.status(201).json({ message: 'User registered successfully. Please check your email to verify your account.' });
    } catch (error) {
        console.error('Error during registration:', error);
        res.status(500).json({ message: 'Error registering user' });
    }
});

// Email verification endpoint
router.get('/verify-email', async (req, res) => {
    const { token } = req.query;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findOne({ email: decoded.email, verificationToken: token });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired token' });
        }

        user.isVerified = true;
        user.verificationToken = null;
        await user.save();

        res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
        console.error('Error verifying email:', error);
        res.status(500).json({ message: 'Error verifying email' });
    }
});

// User login endpoint
router.post('/login', async (req, res) => {
    const { usernameEmail, password } = req.body;

    try {
        const user = await User.findOne({ $or: [{ username: usernameEmail }, { email: usernameEmail }] });

        if (!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(400).json({ message: 'Invalid username/email or password' });
        }

        if (!user.isVerified) {
            return res.status(400).json({ message: 'Please verify your email to log in', isVerified: false });
        }

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
        res.status(200).json({ message: 'Login successful', token, username: user.username, isVerified: true });
    } catch (error) {
        console.error('Error logging in user:', error);
        res.status(500).json({ message: 'Error logging in user' });
    }
});

// Endpoint to initiate password reset
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });

        const resetToken = crypto.randomBytes(32).toString('hex');
        user.resetToken = {
            token: resetToken,
            expires: Date.now() + 3600000 // 1 hour
        };
        await user.save();

        const resetLink = `http://www.softcoin.world/reset-password?token=${resetToken}`;
        await sendEmail(email, 'Password Reset', `Please use the following link to reset your password: ${resetLink}`);

        res.status(200).json({ message: 'Password reset link sent to your email.' });
    } catch (error) {
        console.error('Error initiating password reset:', error);
        res.status(500).json({ message: 'Error initiating password reset' });
    }
});

// Endpoint to handle password reset
router.post('/reset-password', async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const user = await User.findOne({ 'resetToken.token': token, 'resetToken.expires': { $gt: Date.now() } });
        if (!user) return res.status(400).json({ message: 'Invalid or expired token' });

        user.password = await bcrypt.hash(newPassword, 10);
        user.resetToken = undefined;
        await user.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({ message: 'Error resetting password' });
    }
});

// Route to resend the verification email
router.post('/resend-verification', async (req, res) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: 'User not found' });
        }

        if (user.isVerified) {
            return res.status(400).json({ message: 'Email is already verified' });
        }

        const verificationToken = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
        user.verificationToken = verificationToken;
        await user.save();

        await sendVerificationEmail(email, verificationToken);

        res.status(200).json({ message: 'Verification email sent. Please check your inbox.' });
    } catch (error) {
        console.error('Error resending verification email:', error);
        res.status(500).json({ message: 'Error resending verification email' });
    }
});

module.exports = router;
