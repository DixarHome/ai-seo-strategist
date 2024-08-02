document.addEventListener('DOMContentLoaded', () => {
    const username = 'user'; // Replace with actual username or get it dynamically

    // Fetch and display commitment balance
    async function fetchCommitmentBalance() {
        try {
            const response = await fetch(`/api/commitmentBalance/${username}`);
            const data = await response.json();
            if (response.ok) {
                document.getElementById('commitment-balance').textContent = `${data.commitmentBalance.toFixed(2)} USD`;
            } else {
                console.error('Failed to fetch commitment balance');
            }
        } catch (error) {
            console.error('Error fetching commitment balance:', error);
        }
    }

    fetchCommitmentBalance();
});
