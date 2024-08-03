document.addEventListener('DOMContentLoaded', function() {
    const username = localStorage.getItem('username');
    if (!username) {
        document.getElementById('earning-balance').innerText = 'No user logged in';
        return;
    }

    fetch(`/api/users/${username}/earningBalance`)
        .then(response => response.json())
        .then(data => {
            if (data.error) {
                document.getElementById('earning-balance').innerText = 'Error fetching earning balance';
            } else {
                document.getElementById('earning-balance').innerText = `${data.earningBalance} USD`;
                document.getElementById('amount').setAttribute('max', data.earningBalance);
            }
        })
        .catch(error => {
            console.error('Error fetching earning balance:', error);
            document.getElementById('earning-balance').innerText = 'Error fetching earning balance';
        });

    document.getElementById('withdrawal-form').addEventListener('submit', function(event) {
        event.preventDefault();

        const amount = parseFloat(document.getElementById('amount').value);
        const method = document.getElementById('method').value;
        const walletAddress = document.getElementById('wallet-address').value;

        if (amount < 10) {
            alert('The amount must be at least 10 USD.');
            return;
        }

        fetch(`/api/users/${username}/earningBalance`)
            .then(response => response.json())
            .then(data => {
                if (amount > data.earningBalance) {
                    alert('The amount exceeds your earning balance.');
                } else {
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
                            alert('Withdrawal request submitted successfully.');
                        } else {
                            alert('Failed to submit withdrawal request.');
                        }
                    })
                    .catch(error => {
                        console.error('Error submitting withdrawal request:', error);
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching earning balance:', error);
            });
    });
});
