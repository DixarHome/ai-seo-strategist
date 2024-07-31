document.addEventListener("DOMContentLoaded", function() {
    // Fetch and display user balances
    fetch('/api/user/balance', {
        method: 'GET',
        headers: {
            'Authorization': 'Bearer ' + localStorage.getItem('token') // Assuming token is stored in localStorage
        }
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById('commitment-balance').textContent = data.commitmentBalance.toFixed(2) + ' USD';
        document.getElementById('earning-balance').textContent = data.earningBalance.toFixed(2) + ' USD';
        document.getElementById('softie-level').textContent = data.level;
        document.getElementById('daily-profit').textContent = data.dailyProfit.toFixed(2) + ' USD';
    })
    .catch(error => {
        console.error('Error fetching balances:', error);
    });
});

function deposit() {
    window.location.href = '/payment.html';
}
