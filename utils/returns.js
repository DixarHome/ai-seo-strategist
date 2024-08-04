// utils/returns.js
const User = require('../models/User');
const sendEmail = require('../utils/mailer');

async function calculateAndUpdateReturns() {
    const users = await User.find({ commitmentBalance: { $gt: 0 } });

    users.forEach(async (user) => {
        const commitmentBalance = user.commitmentBalance;
        let dailyReturn = 0;
        let softieLevel = '';

        if (commitmentBalance >= 5 && commitmentBalance <= 30) {
            dailyReturn = commitmentBalance * 0.03;
            softieLevel = 'Amateur';
        } else if (commitmentBalance >= 31 && commitmentBalance <= 100) {
            dailyReturn = commitmentBalance * 0.04;
            softieLevel = 'Junior';
        } else if (commitmentBalance >= 101 && commitmentBalance <= 500) {
            dailyReturn = commitmentBalance * 0.05;
            softieLevel = 'Pro';
        } else if (commitmentBalance >= 501 && commitmentBalance <= 2000) {
            dailyReturn = commitmentBalance * 0.06;
            softieLevel = 'Expert';
        } else if (commitmentBalance >= 2001 && commitmentBalance <= 5000) {
            dailyReturn = commitmentBalance * 0.07;
            softieLevel = 'Master';
        } else if (commitmentBalance >= 5001) {
            dailyReturn = commitmentBalance * 0.08;
            softieLevel = 'Legend';
        }

        user.earningBalance += dailyReturn;
        user.lastReturnUpdate = new Date();
        await user.save();

        // Send email notification
        const emailSubject = 'Your Daily Return Update';
        const emailText = `Dear ${user.fullName},\n\nYour daily return of ${dailyReturn} USD has been added to your earnings.\n\nBest regards,\nSoftcoin Team`;
        await sendEmail(user.email, emailSubject, emailText);
    });
}

module.exports = calculateAndUpdateReturns;
