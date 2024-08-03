document.addEventListener('DOMContentLoaded', function() {
    const username = localStorage.getItem('username');
    if (!username) {
        document.getElementById('commitment-balance').innerText = 'No user logged in';
        document.getElementById('earning-balance').innerText = 'No user logged in';
        return;
    }

    fetch(`/api/users/${username}/commitmentBalance`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.getElementById('commitment-balance').innerText = 'Error fetching commitment balance';
            } else {
                const commitmentBalance = data.commitmentBalance;
                document.getElementById('commitment-balance').innerText = `${commitmentBalance} USD`;

                let dailyProfit = 0;
                let softieLevel = '';

                if (commitmentBalance >= 5 && commitmentBalance <= 30) {
                    dailyProfit = commitmentBalance * 0.03;
                    softieLevel = 'Amateur';
                } else if (commitmentBalance >= 31 && commitmentBalance <= 100) {
                    dailyProfit = commitmentBalance * 0.04;
                    softieLevel = 'Junior';
                } else if (commitmentBalance >= 101 && commitmentBalance <= 500) {
                    dailyProfit = commitmentBalance * 0.05;
                    softieLevel = 'Pro';
                } else if (commitmentBalance >= 501 && commitmentBalance <= 2000) {
                    dailyProfit = commitmentBalance * 0.06;
                    softieLevel = 'Expert';
                } else if (commitmentBalance >= 2001 && commitmentBalance <= 5000) {
                    dailyProfit = commitmentBalance * 0.07;
                    softieLevel = 'Master';
                } else if (commitmentBalance >= 5001) {
                    dailyProfit = commitmentBalance * 0.08;
                    softieLevel = 'Legend';
                }

                document.getElementById('softie-level').innerText = softieLevel;
                document.getElementById('daily-profit').innerText = `${dailyProfit.toFixed(2)} USD`;

                // Show countdown timer if commitmentBalance is greater than zero
                if (commitmentBalance > 0) {
                    document.getElementById('countdown-timer').style.display = 'block';
                    startCountdown();
                }
            }
        })
        .catch(error => {
            console.error('Error fetching commitment balance:', error);
            document.getElementById('commitment-balance').innerText = 'Error fetching commitment balance';
        });

    // Fetch and display the earning balance
    fetch(`/api/users/${username}/earningBalance`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.getElementById('earning-balance').innerText = 'Error fetching earning balance';
            } else {
                document.getElementById('earning-balance').innerText = `${data.earningBalance} USD`;
            }
        })
        .catch(error => {
            console.error('Error fetching earning balance:', error);
            document.getElementById('earning-balance').innerText = 'Error fetching earning balance';
        });
});

function startCountdown() {
    const countdownElement = document.getElementById('countdown');

    function updateCountdown() {
        const now = new Date();
        const gmtMidnight = new Date();
        gmtMidnight.setUTCHours(24, 0, 0, 0); // Set to 12 AM GMT

        const timeRemaining = gmtMidnight - now;
        const hours = Math.floor((timeRemaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((timeRemaining % (1000 * 60)) / 1000);

        countdownElement.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        if (timeRemaining > 0) {
            setTimeout(updateCountdown, 1000);
        } else {
            // Reload the page at midnight to reset the countdown
            location.reload();
        }
    }

    updateCountdown();
}
