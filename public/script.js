// script.js

document.addEventListener("DOMContentLoaded", () => {
    let coinBalance = 0;
    let currentLevel = 1;
    let miningSessionCount = 0;
    const rewardIntervals = [2 * 60 * 60 * 1000, 3 * 60 * 60 * 1000, 4 * 60 * 60 * 1000, 5 * 60 * 60 * 1000, 6 * 60 * 60 * 1000];
    const rewards = [15000, 30000, 60000, 120000, 240000];
    let timerInterval;

    const username = localStorage.getItem('username');
    if (!username) return window.location.href = '/register';

    const mineBtn = document.getElementById('mine-btn');
    const coinBalanceEl = document.getElementById('coin-balance');
    const statusMessageEl = document.getElementById('status-message');
    const timerEl = document.getElementById('timer');
    const miningLevelEl = document.getElementById('mining-level');
    const miningSessionCountEl = document.getElementById('mining-session-count');
    const bars = document.querySelectorAll('.bar');

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
                updateCoinBalance();
                updateMiningLevel();
                updateMiningSessionCount();
            } else {
                updateStatusMessage(data.message || "Error starting mining");
            }
        } catch (error) {
            updateStatusMessage("Failed to start mining");
        }
    }

    function updateCoinBalance() {
        coinBalanceEl.textContent = `${coinBalance.toLocaleString()} SFT`;
    }

    function updateMiningLevel() {
        miningLevelEl.textContent = currentLevel;
    }

    function updateMiningSessionCount() {
        miningSessionCountEl.textContent = `Sessions Completed: ${miningSessionCount}`;
    }

    function updateStatusMessage(message) {
        statusMessageEl.textContent = message;
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
                updateCoinBalanceWithReferralEarnings();
                miningSessionCount += 1;
                updateMiningSessionCount();
            } else {
                const hours = Math.floor((remainingTime / (1000 * 60 * 60)) % 24);
                const minutes = Math.floor((remainingTime / (1000 * 60)) % 60);
                const seconds = Math.floor((remainingTime / 1000) % 60);
                timerEl.textContent = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

                const elapsedTime = rewardIntervals[level - 1] - remainingTime;
                const coinsMined = Math.floor((elapsedTime / rewardIntervals[level - 1]) * rewards[level - 1]);
                coinBalanceEl.textContent = `${(coinBalance + coinsMined).toLocaleString()} SFT`;
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
                updateCoinBalance();
                updateMiningLevel();
                updateMiningSessionCount();
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
                updateCoinBalanceWithReferralEarnings();
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

    async function updateCoinBalanceWithReferralEarnings() {
        try {
            const response = await fetch(`/api/referrals/${username}`);
            const data = await response.json();
            if (data && data.referrals) {
                const referralBonus = data.referrals.reduce((acc, ref) => acc + ref.coinBalance * 0.2, 0);
                const totalCoinBalance = coinBalance + referralBonus;
                coinBalanceEl.textContent = `${totalCoinBalance.toLocaleString()} SFT`;
            }
        } catch (error) {
            console.error("Error fetching referral earnings:", error);
        }
    }

    mineBtn.addEventListener('click', startMining);

    // Update the mining status and coin balance on page load
    updateMiningStatus();
    
    
});

document.addEventListener("DOMContentLoaded", () => {
    const username = localStorage.getItem('username');
    if (!username) {
        window.location.href = '/register';
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

async function fetchNotifications(username) {
    try {
        const response = await fetch(`/api/notifications/${username}`);
        const notifications = await response.json();

        let unreadCount = 0;
        notificationList.innerHTML = notifications.map(notification => {
            if (!notification.read) unreadCount++;
            const formattedDate = new Date(notification.date).toLocaleString();
            return `
                <div class="notification-item" data-id="${notification.id}">
                    <div class="notification-title">${notification.title}</div>
                    <div class="notification-timestamp">${formattedDate}</div>
                    <div class="notification-message">${notification.message}</div>
                </div>
            `;
        }).join('');

        notificationCount.textContent = unreadCount;
        notificationCount.style.display = unreadCount > 0 ? 'inline' : 'none';

        document.querySelectorAll('.notification-item').forEach(item => {
            item.addEventListener('click', () => {
                const messageElement = item.querySelector('.notification-message');
                messageElement.style.display = messageElement.style.display === 'none' ? 'block' : 'none';

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
