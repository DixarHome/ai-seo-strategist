// returns.js

const User = require('../models/User');
const sendEmail = require('../utils/mailer');

async function calculateAndUpdateReturns() {
    const users = await User.find({ commitmentBalance: { $gt: 0 } }).populate('referredBy');

    users.forEach(async (user) => {
        const commitmentBalance = user.commitmentBalance;
        let dailyReturn = 0;
        let softieLevel = '';

        if (commitmentBalance >= 5 && commitmentBalance <= 30) {
            dailyReturn = commitmentBalance * 0.015;
            softieLevel = 'Amateur';
        } else if (commitmentBalance >= 31 && commitmentBalance <= 100) {
            dailyReturn = commitmentBalance * 0.02;
            softieLevel = 'Junior';
        } else if (commitmentBalance >= 101 && commitmentBalance <= 500) {
            dailyReturn = commitmentBalance * 0.025;
            softieLevel = 'Pro';
        } else if (commitmentBalance >= 501 && commitmentBalance <= 2000) {
            dailyReturn = commitmentBalance * 0.03;
            softieLevel = 'Expert';
        } else if (commitmentBalance >= 2001 && commitmentBalance <= 5000) {
            dailyReturn = commitmentBalance * 0.035;
            softieLevel = 'Master';
        } else if (commitmentBalance >= 5001) {
            dailyReturn = commitmentBalance * 0.04;
            softieLevel = 'Legend';
        }

        user.earningBalance += dailyReturn;
        user.lastReturnUpdate = new Date();
        await user.save();

        // Referral bonus distribution
        let referrer = user.referredBy;
        if (referrer) {
            // 10% to referrer
            const referrerBonus = dailyReturn * 0.10;
            referrer.earningBalance += referrerBonus;
            referrer.trybeEarnings += referrerBonus;  // Increment trybeEarnings instead of totalReferralBonus
            await referrer.save();

            // Check for referrer's referrer
            if (referrer.referredBy) {
                const referrerReferrer = await User.findById(referrer.referredBy);
                if (referrerReferrer) {
                    // 5% to referrer's referrer
                    const referrerReferrerBonus = dailyReturn * 0.05;
                    referrerReferrer.earningBalance += referrerReferrerBonus;
                    referrerReferrer.trybeEarnings += referrerReferrerBonus;  // Increment trybeEarnings
                    await referrerReferrer.save();

                    // Check for next level referrer
                    if (referrerReferrer.referredBy) {
                        const nextLevelReferrer = await User.findById(referrerReferrer.referredBy);
                        if (nextLevelReferrer) {
                            // 2% to next level referrer
                            const nextLevelBonus = dailyReturn * 0.02;
                            nextLevelReferrer.earningBalance += nextLevelBonus;
                            nextLevelReferrer.trybeEarnings += nextLevelBonus;  // Increment trybeEarnings
                            await nextLevelReferrer.save();
                        }
                    }
                }
            }
        }

        // Send email notification to the user
        const emailSubject = 'Your Daily Return Update';
        const emailText = `Dear ${user.fullName},\n\nYour daily return of ${dailyReturn} USD has been added to your earnings.\n\nBest regards,\nSoftcoin Team`;
        await sendEmail(user.email, emailSubject, emailText);
    });
}

module.exports = calculateAndUpdateReturns;
