document.addEventListener('DOMContentLoaded', async () => {
    try {
        // Retrieve the username from localStorage
        const username = localStorage.getItem('username');

        if (!username) {
            console.error('Username not found in localStorage.');
            return;
        }

        // Fetch user data by username
        const response = await fetch(`/api/users/${username}/spin-info`);
        const data = await response.json();

        // Display spin tickets and other info
        document.getElementById('spin-tickets').textContent = `${data.spinTickets}`;
    } catch (error) {
        console.error('Error fetching tickets:', error);
    }
});

document.getElementById('spin-button').addEventListener('click', spinWheel);
document.getElementById('ok-button').addEventListener('click', closePrizeDisplay);

async function spinWheel() {
    const wheel = document.getElementById('wheel');
    const spinButton = document.getElementById('spin-button');
    const prizeDisplay = document.getElementById('prize-display');
    const prizeText = document.getElementById('prize-text');

    // Fetch spin ticket count from DOM
    const spinTicketsElement = document.getElementById('spin-tickets');
    let spinTickets = parseInt(spinTicketsElement.textContent, 10);

    // Check if the user has enough spin tickets
    if (spinTickets <= 0) {
        prizeText.textContent = 'You have no spin tickets left!';
        prizeDisplay.style.display = 'block';
        return;
    }

    // Proceed with spinning
    spinTickets -= 1; // Deduct 1 ticket for the spin
    spinTicketsElement.textContent = spinTickets;

    // Hide the prize display before spinning
    prizeDisplay.style.display = 'none';

    // Disable the button while the wheel is spinning
    spinButton.disabled = true;
    // Retrieve probability progress from localStorage
    let probabilityProgress = JSON.parse(localStorage.getItem('probabilityProgress')) || {
        ranges: [
            { min: 162, max: 197, probability: 0.3},
            { min: 90, max: 125, probability: 0.3 },
            { min: 54, max: 90, probability: 0.25 },
            { min: 18, max: 54, probability: 0.02 },
            { min: 306, max: 342, probability: 0.06 },
            { min: 235, max: 270, probability: 0.06 },
            { min: 0, max: 18, probability: 0.007 },
            { min: 270, max: 306, probability: 0.003 }
        ]
    };

    // Generate a random number to determine the range
    const random = Math.random();

    let cumulativeProbability = 0;
    let chosenRange;

    for (const range of probabilityProgress.ranges) {
        cumulativeProbability += range.probability;
        if (random < cumulativeProbability) {
            chosenRange = range;
            break;
        }
    }

    // Randomly select a degree within the chosen range
    const finalDegree = Math.floor(Math.random() * (chosenRange.max - chosenRange.min + 1)) + chosenRange.min;
    const randomDegree = finalDegree + 360 * 5; // Ensure at least 5 full spins

    // Reset wheel rotation by applying no rotation, then immediately start the new spin
    wheel.style.transition = 'none';  // Remove transition for the reset
    wheel.style.transform = 'rotate(0deg)';

    // Force reflow/repaint before starting the spin
    wheel.offsetWidth; // This forces the browser to reflow, applying the previous line instantly
    
    // Now apply the actual spin with an even more dramatic cubic-bezier transition for a much slower end
    wheel.style.transition = 'transform 8s cubic-bezier(0.1, 0.9, 0.1, 1)';  // Custom easing function for a very slow finish
    wheel.style.transform = `rotate(${randomDegree}deg)`;  // Spin the wheel

    // Determine the prize after the spin ends
    setTimeout(() => {
        determinePrize(finalDegree);
        // Save the updated probability progress to localStorage
        localStorage.setItem('probabilityProgress', JSON.stringify(probabilityProgress));
    }, 8000); // Same as transition duration
        // Update the server to deduct 1 spin ticket
    const username = localStorage.getItem('username');
    fetch('/api/updateSpinTickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, spinTickets: -1 }) // Deduct 1 ticket
    }).then(response => response.json())
      .then(data => {
          if (!data.success) {
              console.error('Failed to update spin tickets');
          }
      }).catch(error => {
          console.error('Error updating spin tickets:', error);
      });
}

function determinePrize(degree) {
    let prize, rewardType;

    if (degree >= 0 && degree < 18) {
        prize = 0.10;
        rewardType = 'usd';
    } else if (degree >= 18 && degree < 54) {
        prize = 10000;
        rewardType = 'sft';
    } else if (degree >= 54 && degree < 90) {
        prize = 2;
        rewardType = 'tickets';
    } else if (degree >= 90 && degree < 126) {
        prize = 5000;
        rewardType = 'sft';
    } else if (degree >= 126 && degree < 162) {
        prize = 10;
        rewardType = 'usd';
    } else if (degree >= 162 && degree < 198) {
        prize = 2000;
        rewardType = 'sft';
    } else if (degree >= 198 && degree < 234) {
        prize = 2;
        rewardType = 'usd';
    } else if (degree >= 234 && degree < 270) {
        prize = 5;
        rewardType = 'tickets';
    } else if (degree >= 270 && degree < 306) {
        prize = 0.50;
        rewardType = 'usd';
    } else if (degree >= 306 && degree < 342) {
        prize = 50000;
        rewardType = 'sft';
    } else {
        prize = 0.10;
        rewardType = 'usd';
    }

    // Display the prize in the center of the screen
    const prizeDisplay = document.getElementById('prize-display');
    const prizeText = document.getElementById('prize-text');
    prizeText.textContent = `You won ${prize} ${rewardType === 'tickets' ? 'Spin Tickets' : rewardType.toUpperCase()}!`;
    prizeDisplay.style.display = 'block';

    // Send the prize details to the server to update the user's balance
    const username = localStorage.getItem('username');
    fetch('/api/updatePrize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, prize, rewardType })
    }).then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Prize successfully added to user account');
        } else {
            console.error('Error updating prize:', data.error);
        }
    }).catch(error => {
        console.error('Error updating prize:', error);
    });
}

function resetWheel() {
    const wheel = document.getElementById('wheel');
    
    // Apply a transition to smoothly reset the wheel to the initial position
    wheel.style.transition = 'transform 1s ease-out';
    wheel.style.transform = 'rotate(0deg)';
}

function closePrizeDisplay() {
    const prizeDisplay = document.getElementById('prize-display');
    const spinButton = document.getElementById('spin-button');

    // Hide the prize display
    prizeDisplay.style.display = 'none';
    
    // Reset the wheel when the prize display is closed
    resetWheel();
    
    // Re-enable the spin button
    spinButton.disabled = false;
}
