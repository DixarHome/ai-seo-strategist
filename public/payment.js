document.addEventListener('DOMContentLoaded', () => {
    const cryptoOptions = document.querySelectorAll('.crypto-option');
    const walletInput = document.getElementById('wallet');
    const usdAmountInput = document.getElementById('usd-amount');
    const transactionIdInput = document.getElementById('transaction-id');
    const selectedCryptoSpan = document.getElementById('selected-crypto');
    const cryptoAmountSpan = document.getElementById('crypto-amount');
    const cryptoNameHeading = document.getElementById('crypto-name');
    const copyWalletBtn = document.getElementById('copy-wallet-btn');

    let selectedCrypto = '';
    let cryptoPrices = {};

    // Fetch real-time cryptocurrency prices
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

    // Update the equivalent crypto amount
    function updateCryptoAmount() {
        const usdAmount = parseFloat(usdAmountInput.value) || 0;
        let cryptoAmount = 0;

        if (selectedCrypto && cryptoPrices[selectedCrypto]) {
            cryptoAmount = usdAmount / cryptoPrices[selectedCrypto];
        }

        cryptoAmountSpan.textContent = cryptoAmount.toFixed(8);
    }

    // Handle cryptocurrency selection
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

    fetchCryptoPrices(); // Fetch prices on load

    // Copy wallet address to clipboard
    copyWalletBtn.addEventListener('click', () => {
        walletInput.select();
        document.execCommand('copy');
        alert('Wallet address copied to clipboard');
    });

    document.querySelector('.submit-btn').addEventListener('click', async () => {
        const username = ''; // Add logic to fetch the username from the logged-in user
        const amount = usdAmountInput.value;
        const transactionId = transactionIdInput.value;

        if (!amount || !transactionId) {
            alert('Amount and Transaction ID fields are required');
            return;
        }

        try {
            const response = await fetch('/api/deposit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, amount, transactionId })
            });

            const data = await response.json();
            if (response.ok) {
                alert(data.message);
            } else {
                alert(data.message);
            }
        } catch (error) {
            console.error('Error submitting deposit:', error);
            alert('Error submitting deposit');
        }
    });
});
