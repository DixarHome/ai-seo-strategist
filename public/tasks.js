document.addEventListener("DOMContentLoaded", async () => {
    const username = localStorage.getItem('username');
    if (!username) return window.location.href = '/register';

    const taskDetails = {
        "follow-btn": { name: "Follow Softcoin on X", target: 1, reward: 30000 },
        "join-btn": { name: "Join Softcoin telegram channel", target: 1, reward: 30000 },
        "refer2-btn": { name: "Invite 2 friends", target: 2, reward: 30000 },
        "refer5-btn": { name: "Invite 5 friends", target: 5, reward: 50000 },
        "refer10-btn": { name: "Invite 10 friends", target: 10, reward: 100000 },
        "mine2-btn": { name: "Complete 2 mining sessions", target: 2, reward: 10000 },
        "mine20-btn": { name: "Complete 20 mining sessions", target: 20, reward: 100000 },
        "mine100-btn": { name: "Complete 100 mining sessions", target: 100, reward: 1000000 }
    };

    // Function to fetch user referral count
    async function fetchReferralCount() {
        try {
            const response = await fetch(`/api/referrals/${username}`);
            const data = await response.json();
            return data.referrals.length || 0;
        } catch (error) {
            console.error('Error fetching referral count:', error);
            return 0;
        }
    }

    // Function to fetch user mining session count
    async function fetchMiningSessionCount() {
        try {
            const response = await fetch(`/api/miningSessionCount/${username}`);
            const data = await response.json();
            return data.miningSessionCount || 0;
        } catch (error) {
            console.error('Error fetching mining session count:', error);
            return 0;
        }
    }

    // Function to update the user's SFT balance and mark task as claimed
    async function claimTask(taskId, reward) {
        try {
            const response = await fetch(`/api/claimTask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, taskId, reward })
            });

            // The server should return { success: true } on successful claim
            const data = await response.json();

            if (response.ok && data.success) {
                return true;
            } else {
                console.error(data.message || 'Failed to claim reward');
                return false;
            }
        } catch (error) {
            console.error('Error claiming task:', error);
            return false;
        }
    }

    // Function to fetch the task status to check if it has been claimed
    async function fetchTaskStatus(taskId) {
        try {
            const response = await fetch(`/api/taskStatus/${username}/${taskId}`);
            const data = await response.json();
            return data.claimed;
        } catch (error) {
            console.error('Error fetching task status:', error);
            return false;
        }
    }

    // Function to update the task button based on the user's progress
    async function updateTaskButton(taskId, target, reward, fetchProgress) {
        const button = document.getElementById(taskId);
        const progressCount = await fetchProgress();
        button.textContent = `${progressCount}/${target}`;

        if (await fetchTaskStatus(taskId)) {
            button.disabled = true;
            button.innerHTML = "&#10003;"; // Checked sign
        } else if (progressCount >= target) {
            button.disabled = false;
            button.textContent = "Claim";
            button.addEventListener('click', async () => {
                const success = await claimTask(taskId, reward);
                if (success) {
                    button.disabled = true;
                    button.innerHTML = "&#10003;"; // Checked sign
                    showCustomAlert('Reward claimed successfully!');
                    moveTaskToCompleted(taskId);
                } else {
                    showCustomAlert('Failed to claim reward. Please try again.');
                }
            });
        } else {
            button.disabled = true;
        }
    }

    // Function to handle social media tasks
    function handleSocialMediaTask(taskId, url) {
        const button = document.getElementById(taskId);
        button.addEventListener('click', (event) => {
            if (button.textContent === "Claim") {
                claimSocialMediaTask(taskId);
            } else {
                localStorage.setItem(taskId + '-initiated', 'true');
                window.open(url, '_blank');
            }
        });
    }

    // Function to claim social media task
    async function claimSocialMediaTask(taskId) {
        const button = document.getElementById(taskId);
        const success = await claimTask(taskId, 30000); // Assuming reward is 30000 for both tasks
        if (success) {
            button.disabled = true;
            button.innerHTML = "&#10003;"; // Checked sign
            showCustomAlert('Reward claimed successfully!');
            localStorage.removeItem(taskId + '-initiated');
            moveTaskToCompleted(taskId);
        } else {
            showCustomAlert('Reward claimed successfully!');
        }
    }

    // Function to check if social media tasks were initiated and enable claim if true
    async function checkSocialMediaTask(taskId) {
        const button = document.getElementById(taskId);
        if (localStorage.getItem(taskId + '-initiated') === 'true' && !(await fetchTaskStatus(taskId))) {
            button.disabled = false;
            button.textContent = "Claim";
            button.addEventListener('click', async () => {
                await claimSocialMediaTask(taskId);
            });
        } else if (await fetchTaskStatus(taskId)) {
            button.disabled = true;
            button.innerHTML = "&#10003;"; // Checked sign
        }
    }

    // Function to move a completed task to the "Completed" section
    function moveTaskToCompleted(taskId) {
        const taskElement = document.getElementById(taskId).parentElement;
        const completedTasksContainer = document.getElementById('completed-tasks');
        completedTasksContainer.appendChild(taskElement);
    }

    // Function to show the custom alert
    function showCustomAlert(message) {
        const customAlert = document.getElementById('custom-alert');
        const customAlertMessage = document.getElementById('custom-alert-message');
        customAlertMessage.textContent = message;
        customAlert.style.display = 'block';
    }

    // Function to close the custom alert
    window.closeCustomAlert = function() {
        const customAlert = document.getElementById('custom-alert');
        customAlert.style.display = 'none';
    }

    // Function to create a task element
    function createTaskElement(taskId, taskDetails) {
        const taskElement = document.createElement('div');
        taskElement.classList.add('task');
        taskElement.innerHTML = `
            <span>${taskDetails.name}</span>
            <p class="reward">Reward: ${taskDetails.reward} SFT</p>
            <button id="${taskId}">0/${taskDetails.target}</button>
        `;
        return taskElement;
    }

    // Update all task buttons
    const activeTasksContainer = document.getElementById('active-tasks');
    const completedTasksContainer = document.getElementById('completed-tasks');

    for (const [taskId, details] of Object.entries(taskDetails)) {
        const taskElement = createTaskElement(taskId, details);

        if (await fetchTaskStatus(taskId)) {
            completedTasksContainer.appendChild(taskElement);
        } else {
            activeTasksContainer.appendChild(taskElement);
        }

        const fetchProgress = taskId.startsWith('refer') ? fetchReferralCount : fetchMiningSessionCount;
        if (taskId === 'follow-btn' || taskId === 'join-btn') {
            const url = taskId === 'follow-btn' ? 'https://twitter.com/softcoin__' : 'https://t.me/softcoinupdates';
            handleSocialMediaTask(taskId, url);
            checkSocialMediaTask(taskId);
        } else {
            updateTaskButton(taskId, details.target, details.reward, fetchProgress);
        }
    }
});
