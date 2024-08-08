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
async function sendEmail(to, subject, text, html) {
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
        text,
        html // Add the HTML content here
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
    const htmlMessage = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2>Welcome to the future, ${fullName}!</h2>
        <img src="https://softcoin.world/iconns/welcome.png" alt="Welcome Image" style="width: 300px; height: 150px;">
      
        <p>We're excited to have you on board and we promise you, this is going to be a very rewarding experience.</p>
        <p>You have been given a welcome bonus of 50,000 SFT to start you up on this exciting journey, and there are lots more where that came from.</p>
        
        <p>If you haven't already, Kindly verify your email address and log into your account to start earning Softcoins and secure your place at the forefront of the biggest innovation to hit the crypto-sphere.</p>
        <p>The Softcoin project is packed with a lot of activities to keep you engaged, and a lot of ways to help you earn.</p>
        <h3>Become a Softcoin Shareholder (Softie)</h3>
        <img src="https://softcoin.world/iconns/shareholder.png" alt="Shareholder Image" style="width: 300px; height: 150px;">
        <p>We are giving you a rare opportunity to become a shareholder in this project. Unlike your regular crypto airdrop project, the Softcoin team have decided to give our participant the chance to be shareholders in the project.</p>
        <p>As a shareholder, you will not have to wait till TGE and Mainnet Launch before you start earning instantly withdrawable income. And this income can be as high as $500 daily, depending on your level of commitment. You can become a Softcoin Shareholder with as little as $5.</p>
        <img src="https://softcoin.world/okay/vision.png" alt="Welcome Image" style="width: 300px; height: 150px;">
        <p>Keep up with the progress of the project by following Softcoin on Twitter. You can also join our Update Channel on telegram to get up to date information about the project.</p>
        <p>
            <a href="https://twitter.com/softcoin__"><img src="https://softcoin.world/okay/twitter.png" alt="Twitter" style="width: 150px; height: 150px;"></a>
            <a href="https://t.me/softcoinupdate"><img src="https://softcoin.world/okay/telegram.png" alt="Telegram" style="width: 150px; height: 150px;"></a>
        </p>
        <p>If you have any questions or need assistance, feel free to reach out to our <a href="malito:support@softcoin.world">Support Team</a>.</p>
        <p>Thank you for joining us. Together, let's make the future of cryptocurrency brighter!</p>
        <p>Best Regards,<br>Softcoin Team</p>
    </div>`;

    const textMessage = `Welcomed to the future, $(fullname)!

We are glad to have you on board and we promise you, this is going to be a very rewarding experience.

You have been given a welcome bonus of 50,000 SFT to start you up on this exciting journey, and there are lots more where that came from.

If you haven't, Kindly verify your email address and log into your account to start earning Softcoins and secure your place at the forefront of the biggest innovation to hit the crypto-sphere.

The Softcoin project is packed with a lot of activities to keep you engaged, and a lot of ways to help you earn and achieve the financial freedom you've been looking for.

We are giving you a rare opportunity to become a shareholder in this project. Yes, you read that right. Unlike your usual crypto airdrop project, the Softcoin team have decided to give our participant the chance to be shareholders in the project. 

As a shareholder, you will not have to wait till mainnet launch before you start making money. We will be sharing the profit of the project as we go in form of a daily return. This return can be as high as $500 daily, even higher depending on your level of commitment.

The most exciting part of this is that you can become a Softcoin Shareholder (Softie) with as little as $5, and your earning begins immediately.

Keep up with the progress of the project by following Softcoin on Twitter (https://twitter.com/softcoin__). You can also join our Update Channel on Telegram (https://t.me/softcoinupdate) to get up to date information concerning this project.

Thank you for joining us. Together, let's make the future of cryptocurrency brighter!

Best regards,
Softcoin Team.
`;

    await sendEmail(email, 'Welcome to Softcoin', textMessage, htmlMessage);
}

// Registration endpoint
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
            coinBalance: 0, // Initial balance is 0; bonus is given after verification
            verificationToken, // Save the verification token
            isVerified: false, // Set the user as unverified initially
        });

        await newUser.save();

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
        user.coinBalance = 50000; // Credit the user with their bonus after verification
        await user.save();

        // Send a notification to the user about the bonus
        const welcomeNotification = new Notification({
            user: user._id,
            title: 'Welcome to Softcoin!',
            message: 'Your email has been verified, and you have received a welcome bonus of 50,000 SFT.'
        });
        await welcomeNotification.save();

        user.notifications.push(welcomeNotification._id);
        await user.save();

        // Handle referral bonus if the user was referred
        if (user.referredBy) {
            const referrer = await User.findById(user.referredBy);
            if (referrer) {
                const referralBonus = 50000; // Bonus for the referrer
                referrer.coinBalance += referralBonus;
                referrer.totalReferralBonus += referralBonus; // Increment the totalReferralBonus
                
                // Increment referral count and add new user to referrer's referrals array
                referrer.referralCount += 1;
                referrer.referrals.push(user._id);
                
                await referrer.save();

                const referrerNotification = new Notification({
                    user: referrer._id,
                    title: 'Referral Verified!',
                    message: `${user.username} has verified their email, and you have been rewarded with 50,000 SFT.`
                });

                await referrerNotification.save();

                referrer.notifications.push(referrerNotification._id);
                await referrer.save();
            }
        }

        res.status(200).json({ message: 'Email verified successfully. You can now <a href="https://app.softcoin.world/login">Log In</a>.' });
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
