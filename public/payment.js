document.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('username');
  //  if (!username) {
    //    window.location.href = '/login';
 //   } 

    const cryptoOptions = document.querySelectorAll('.crypto-option');
    const walletInput = document.getElementById('wallet');
    const usdAmountInput = document.getElementById('usd-amount');
    const transactionIdInput = document.getElementById('transaction-id');
    const selectedCryptoSpan = document.getElementById('selected-crypto');
    const cryptoAmountSpan = document.getElementById('crypto-amount');
    const cryptoNameHeading = document.getElementById('crypto-name');
    const copyWalletBtn = document.getElementById('copy-wallet-btn');
    const customAlert = document.getElementById('custom-alert');
    const historyItems = document.getElementById('history-items');

    let selectedCrypto = '';
    let cryptoPrices = {};

    async function fetchCryptoPrices() {
        try {
            const response = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=tether,binancecoin,bitcoin,ethereum&vs_currencies=usd');
            const data = await response.json();
            cryptoPrices = {
                USDT: data.tether.usd,
                BNB: data.binancecoin.usd,
                BTC: data.bitcoin.usd,
                ETH: data.ethereum.usd
            };
        } catch (error) {
            console.error('Error fetching cryptocurrency prices:', error);
        }
    }

    function updateCryptoAmount() {
        const usdAmount = parseFloat(usdAmountInput.value) || 0;
        let cryptoAmount = 0;

        if (selectedCrypto && cryptoPrices[selectedCrypto]) {
            cryptoAmount = usdAmount / cryptoPrices[selectedCrypto];
        }

        cryptoAmountSpan.textContent = cryptoAmount.toFixed(8);
    }

    cryptoOptions.forEach(option => {
        option.addEventListener('click', () => {
            cryptoOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');

            selectedCrypto = option.getAttribute('data-crypto');
            walletInput.value = option.getAttribute('data-wallet');
            selectedCryptoSpan.textContent = selectedCrypto;
            cryptoNameHeading.textContent = selectedCrypto;

            updateCryptoAmount();
        });
    });

    usdAmountInput.addEventListener('input', updateCryptoAmount);

    fetchCryptoPrices();

    copyWalletBtn.addEventListener('click', () => {
        walletInput.select();
        document.execCommand('copy');
        showAlert('Wallet address copied to clipboard', 'success');
    });

    function showAlert(message, type) {
        customAlert.textContent = message;
        customAlert.className = `custom-alert ${type}`;
        customAlert.style.display = 'block';
        setTimeout(() => {
            customAlert.style.display = 'none';
        }, 4000); // Display alert for 4 seconds
    }

    function showLoading() {
        customAlert.innerHTML = '<div class="loading-spinner"></div> Processing payment...';
        customAlert.className = 'custom-alert loading';
        customAlert.style.display = 'block';
    }

    document.querySelector('.submit-btn').addEventListener('click', async () => {
        const amount = parseFloat(usdAmountInput.value);
        const transactionId = transactionIdInput.value.trim();

        if (!amount || isNaN(amount) || !transactionId) {
            showAlert('Amount and Transaction ID fields are required', 'error');
            return;
        }

        if (amount < 5) {
            showAlert('The minimum deposit amount is $5', 'error');
            return;
        }

        showLoading();

        try {
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, amount, transactionId, cryptoType: selectedCrypto })
            });

            const data = await response.json();
            console.log('Server response:', data); // Log the response

            if (response.ok) {
                showAlert('Payment submitted successfully. You will receive an email confirmation shortly.', 'success');
                addTransactionToHistory(data.transaction);

                // Redirect to /softie after 4 seconds
                setTimeout(() => {
                    window.location.href = '/softie';
                }, 4000);
            } else {
                showAlert(`Error: ${data.message}`, 'error');
            }
        } catch (error) {
            console.error('Error submitting deposit:', error);
            showAlert('An error occurred while submitting your payment. Please try again later.', 'error');
        }
    });

    async function fetchTransactionHistory() {
        try {
            const response = await fetch(`/api/users/${username}/transactions`);
            const transactions = await response.json();
            transactions.forEach(transaction => {
                addTransactionToHistory(transaction);
            });
        } catch (error) {
            console.error('Error fetching transaction history:', error);
        }
    }

    function addTransactionToHistory(transaction) {
        const transactionItem = document.createElement('div');
        transactionItem.className = 'history-item';
        transactionItem.innerHTML = `
            <div>${transaction.amount} USD</div>
            <div>${transaction.cryptoType}</div>
            <div>${new Date(transaction.createdAt).toLocaleString()}</div>
            <div>${transaction.status}</div>
        `;
        historyItems.insertBefore(transactionItem, historyItems.firstChild);
    }

    fetchTransactionHistory();
});
