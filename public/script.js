// script.js

document.addEventListener("DOMContentLoaded", async () => {
    let coinBalance = 0;
    let currentLevel = 1;
    let miningSessionCount = 0;
    const rewardIntervals = [2 * 60 * 60 * 1000, 3 * 60 * 60 * 1000, 4 * 60 * 60 * 1000, 5 * 60 * 60 * 1000, 6 * 60 * 60 * 1000];
    const rewards = [15000, 30000, 60000, 120000, 240000];
    let timerInterval;
    let referralBonus = 0;
    let spinTickets = 0; // Track the user's spin tickets

    const username = localStorage.getItem('username');
    if (!username) return window.location.href = '/login';

    const mineBtn = document.getElementById('mine-btn');
    const coinBalanceEl = document.getElementById('coin-balance');
    const statusMessageEl = document.getElementById('status-message');
    const timerEl = document.getElementById('timer');
    const miningLevelEl = document.getElementById('mining-level');
    const miningSessionCountEl = document.getElementById('mining-session-count');
    const bars = document.querySelectorAll('.bar');

    async function fetchReferralBonus() {
        try {
            const response = await fetch(`/api/referrals/${username}`);
            const data = await response.json();
            if (data && data.referrals) {
                referralBonus = data.referrals.reduce((acc, ref) => acc + ref.coinBalance * 0.2, 0);
            }
        } catch (error) {
            console.error("Error fetching referral earnings:", error);
        }
    }

    async function startMining() {
        try {
            const response = await fetch('/api/startMining', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            const data = await response.json();
            if (data.miningStartTime) {
                startTimer(data.miningStartTime, data.level);
                mineBtn.disabled = true;
                toggleBarsAnimation(true);
                updateStatusMessage("Mining in progress...");
                coinBalance = data.coinBalance;
                currentLevel = data.level;
                miningSessionCount = data.miningSessionCount;
                // Update spin tickets
                spinTickets = data.spinTickets;
                await fetchReferralBonus(); // Fetch referral bonus when mining starts
                updateCoinBalance();
                updateMiningLevel();
                updateMiningSessionCount();
                updateSpinTicketsDisplay();

            } else {
                updateStatusMessage(data.message || "Error starting mining");
            }
        } catch (error) {
            updateStatusMessage("Failed to start mining");
        }
    }

    function updateCoinBalance() {
    coinBalanceEl.textContent = `${coinBalance.toLocaleString()}`;
}


    function updateMiningLevel() {
        miningLevelEl.textContent = currentLevel;
    }

    function updateMiningSessionCount() {
        miningSessionCountEl.textContent = `${miningSessionCount}`;
    }

    function updateStatusMessage(message) {
        statusMessageEl.textContent = message;
    }
    
    function updateSpinTicketsDisplay() {
        const spinTicketsEl = document.getElementById('spin-tickets');
        spinTicketsEl.textContent = `${spinTickets}`;
    }

    function startTimer(miningStartTime, level) {
    const endTime = new Date(miningStartTime).getTime() + rewardIntervals[level - 1];

    function updateTimer() {
        const remainingTime = endTime - Date.now();
        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            timerEl.textContent = "00:00:00";
            updateStatusMessage("Mining complete!");
            toggleBarsAnimation(false);
            mineBtn.disabled = false;

            coinBalance += rewards[level - 1];
            updateCoinBalance();
            miningSessionCount += 1;
            updateMiningSessionCount();
        } else {
            const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);
            const minutes = Math.floor((remainingTime / (1000 * 60)) % 60);
            const seconds = Math.floor((remainingTime / 1000) % 60);
            timerEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

            const elapsedTime = rewardIntervals[level - 1] - remainingTime;
            const coinsMined = Math.floor((elapsedTime / rewardIntervals[level - 1]) * rewards[level - 1]);
            coinBalanceEl.textContent = `${(coinBalance + coinsMined).toLocaleString()}`;
        }
    }

    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

    async function updateMiningStatus() {
        try {
            const response = await fetch('/api/miningStatus', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            const data = await response.json();
            if (data.miningStartTime) {
                startTimer(data.miningStartTime, data.level);
                coinBalance = data.coinBalance;
                currentLevel = data.level;
                miningSessionCount = data.miningSessionCount;
                spinTickets = data.spinTickets;
                await fetchReferralBonus(); // Fetch referral bonus when checking mining status
                updateCoinBalance();
                updateMiningLevel();
                updateMiningSessionCount();
                updateSpinTicketsDisplay();
                mineBtn.disabled = true;
                toggleBarsAnimation(true);
                updateStatusMessage("Mining in progress...");
            } else if (data.miningComplete) {
                coinBalance = data.coinBalance;
                currentLevel = data.level;
                miningSessionCount = data.miningSessionCount;
                updateCoinBalance();
                updateMiningLevel();
                updateMiningSessionCount();
                updateStatusMessage("Mining complete!");
                mineBtn.disabled = false;
                toggleBarsAnimation(false);
            } else {
                updateStatusMessage("Mining not started");
                mineBtn.disabled = false;
                toggleBarsAnimation(false);
            }
        } catch (error) {
            updateStatusMessage("Failed to retrieve mining status");
        }
    }

    function toggleBarsAnimation(active) {
        bars.forEach(bar => {
            bar.style.animationPlayState = active ? 'running' : 'paused';
        });
    }

    mineBtn.addEventListener('click', startMining);

    // Update the mining status and coin balance on page load
    await fetchReferralBonus(); // Fetch referral bonus on page load
    updateMiningStatus();
});

document.addEventListener("DOMContentLoaded", () => {
    const username = localStorage.getItem('username');
    if (!username) {
        window.location.href = '/login';
    } else {
        document.getElementById('user-name').textContent = username;
        fetchNotifications(username);
    }
});

const notificationIcon = document.getElementById('notification-icon');
const notificationModal = document.getElementById('notification-modal');
const notificationList = document.getElementById('notification-list');
const notificationCount = document.getElementById('notification-count');
const closeBtn = document.querySelector('.close');

notificationIcon.addEventListener('click', () => {
    notificationModal.style.display = "block";
});

closeBtn.addEventListener('click', () => {
    notificationModal.style.display = "none";
});

window.addEventListener('click', (event) => {
    if (event.target == notificationModal) {
        notificationModal.style.display = "none";
    }
});

let expandedNotification = null; // Track the currently expanded notification

async function fetchNotifications(username) {
    try {
        const response = await fetch(`/api/notifications/${username}`);
        let notifications = await response.json();

        // Sort notifications by date (most recent first)
        notifications.sort((a, b) => new Date(b.date) - new Date(a.date));

        let unreadCount = 0;
        notificationList.innerHTML = notifications.map(notification => {
            if (!notification.read) unreadCount++;
            const formattedDate = new Date(notification.date).toLocaleString();
            return `
                <div class="notification-item ${notification.read ? 'read' : 'unread'}" data-id="${notification.id}">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-timestamp">${formattedDate}</div>
                    <div class="notification-message" style="display: none;">${notification.message}</div>
                </div>
            `;
        }).join('');

        notificationCount.textContent = unreadCount;
        notificationCount.style.display = unreadCount > 0 ? 'inline' : 'none';

        document.querySelectorAll('.notification-item').forEach(item => {
            const timestamp = item.querySelector('.notification-timestamp');
            const messageElement = item.querySelector('.notification-message');

            item.addEventListener('click', () => {
                // If a different notification is clicked, collapse the previous one
                if (expandedNotification && expandedNotification !== item) {
                    expandedNotification.querySelector('.notification-message').style.display = 'none';
                    expandedNotification.querySelector('.notification-timestamp').style.display = 'none';
                }

                // Expand the current notification if it's not already expanded
                if (expandedNotification !== item) {
                    messageElement.style.display = 'block';
                    timestamp.style.display = 'block';
                    expandedNotification = item;
                }

                if (!item.classList.contains('read')) {
                    markNotificationAsRead(item.dataset.id);
                    item.classList.add('read');
                    unreadCount--;
                    notificationCount.textContent = unreadCount;
                    notificationCount.style.display = unreadCount > 0 ? 'inline' : 'none';
                }
            });
        });
    } catch (error) {
        console.error('Error fetching notifications:', error);
    }
}

async function markNotificationAsRead(notificationId) {
    try {
        await fetch('/api/notifications/markRead', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ notificationId })
        });
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}
