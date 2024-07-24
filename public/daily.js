document.addEventListener("DOMContentLoaded", async () => {
    const username = localStorage.getItem('username');
    if (!username) return window.location.href = '/register';

    const dailyCheckInButton = document.getElementById('daily-check-in-btn');
    const dailyCheckInMessage = document.getElementById('daily-check-in-message');

    // Function to fetch daily check-in status from the server
    async function fetchDailyCheckInStatus() {
        try {
            const response = await fetch(`/api/dailyCheckInStatus/${username}`);
            const data = await response.json();
            return data.claimed;
        } catch (error) {
            console.error('Error fetching daily check-in status:', error);
            return false;
        }
    }

    // Function to claim daily check-in reward
    async function claimDailyCheckInReward() {
        try {
            const response = await fetch(`/api/claimDailyCheckIn`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, reward: 20000 })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to claim reward');
            return true;
        } catch (error) {
            console.error('Error claiming daily check-in reward:', error);
            return false;
        }
    }

    // Function to update the daily check-in button and message
    async function updateDailyCheckInButton() {
        const claimed = await fetchDailyCheckInStatus();
        if (claimed) {
            dailyCheckInButton.disabled = true;
            dailyCheckInButton.innerHTML = "&#10003;"; // Checked sign
            dailyCheckInMessage.textContent = "Come back tomorrow for more rewards!";
        } else {
            dailyCheckInButton.disabled = false;
            dailyCheckInButton.textContent = "Claim";
            dailyCheckInMessage.textContent = "";
        }
    }

    // Add event listener to the daily check-in button
    dailyCheckInButton.addEventListener('click', async () => {
        const success = await claimDailyCheckInReward();
        if (success) {
            dailyCheckInButton.disabled = true;
            dailyCheckInButton.innerHTML = "&#10003;"; // Checked sign
            dailyCheckInMessage.textContent = "Come back tomorrow for more rewards!";
        } else {
            alert('Failed to claim reward. Please try again.');
        }
    });

    // Update the button on page load
    updateDailyCheckInButton();
});
