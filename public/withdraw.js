document.addEventListener('DOMContentLoaded', function() {
    const username = localStorage.getItem('username');
    const alertBox = document.getElementById('alert-box');

    function showAlert(message, type = 'error', loading = false) {
        alertBox.innerHTML = message;
        alertBox.className = `alert-box ${type}`;
        
        if (loading) {
            const spinner = document.createElement('div');
            spinner.className = 'spinner';
            alertBox.appendChild(spinner);
        }

        alertBox.style.display = 'block';
    }

    function hideAlert() {
        alertBox.style.display = 'none';
    }

    function redirectAfterDelay(url, delay = 5000) {
        setTimeout(() => {
            window.location.href = url;
        }, delay);
    }

    if (!username) {
        showAlert('No user logged in');
        return;
    }

    // Fetch earning balance
    fetch(`/api/users/${username}/earningBalance`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showAlert('Error fetching earning balance');
            } else {
                document.getElementById('earning-balance').innerText = `${data.earningBalance.toFixed(2)} USD`;
                document.getElementById('amount').setAttribute('max', data.earningBalance);
            }
        })
        .catch(error => {
            console.error('Error fetching earning balance:', error);
            showAlert('Error fetching earning balance');
        });

    // Fetch withdrawals and totalWithdrawal
    fetch(`/api/users/${username}/withdrawals`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                showAlert('Error fetching withdrawals');
            } else {
                // Display total withdrawal
                const totalWithdrawal = data.totalWithdrawal || 0;
                document.getElementById('total-withdrawal').innerText = `${totalWithdrawal.toFixed(2)} USD`;

                // Display withdrawals
                const withdrawalList = document.getElementById('withdrawal-list');
                withdrawalList.innerHTML = ''; // Clear any existing entries

                data.withdrawals.forEach(withdrawal => {
                    const formattedDate = new Date(withdrawal.createdAt).toLocaleDateString();
                    const withdrawalItem = document.createElement('div');
                    withdrawalItem.className = 'withdrawal-item';
                    withdrawalItem.innerHTML = `
                        <div>${formattedDate}</div>
                        <div>${withdrawal.amount} USD</div>
                        <div>${withdrawal.currency}</div>
                        <div>${withdrawal.status}</div>
                    `;
                    // Prepend the most recent withdrawal at the top
                    withdrawalList.prepend(withdrawalItem);
                });
            }
        })
        .catch(error => {
            console.error('Error fetching withdrawals:', error);
            showAlert('Error fetching withdrawals');
        });

    // Handle form submission
    document.getElementById('withdrawal-form').addEventListener('submit', function(event) {
        event.preventDefault();
        hideAlert();

        const amount = parseFloat(document.getElementById('amount').value);
        const method = document.getElementById('method').value;
        const walletAddress = document.getElementById('wallet-address').value.trim();

        // Validate input fields
        if (amount < 10) {
            showAlert('Minimum Withdrawal is 10 USD.');
            return;
        }

        if (walletAddress === '') {
            showAlert('The wallet address cannot be empty.');
            return;
        }

        // Display loading alert
        showAlert('Processing your request...', 'loading', true);

        // Fetch both earning balance and commitment balance
        Promise.all([
            fetch(`/api/users/${username}/earningBalance`).then(response => response.json()),
            fetch(`/api/users/${username}/commitmentBalance`).then(response => response.json())
        ])
        .then(([earningData, commitmentData]) => {
            if (earningData.error || commitmentData.error) {
                showAlert('Error fetching balances.');
                return;
            }

            if (amount > earningData.earningBalance) {
                showAlert('The amount exceeds your earning balance.');
            } else if (commitmentData.commitmentBalance <= 0) {
                showAlert('Your commitment balance must be greater than 0 to withdraw.');
            } else {
                // Submit withdrawal request
                fetch('/api/withdraw', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, amount, method, walletAddress })
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        showAlert('Withdrawal request submitted successfully.', 'success');
                        redirectAfterDelay('/softie'); // Redirect after 5 seconds
                    } else {
                        showAlert('Failed to submit withdrawal request.');
                    }
                })
                .catch(error => {
                    console.error('Error submitting withdrawal request:', error);
                    showAlert('Failed to submit withdrawal request.');
                });
            }
        })
        .catch(error => {
            console.error('Error fetching balances:', error);
            showAlert('Error fetching balances.');
        });
    });
});
