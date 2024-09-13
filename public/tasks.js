document.addEventListener("DOMContentLoaded", async () => {
    const username = localStorage.getItem('username');
  //  if (!username) return window.location.href = '/login';
    
    const tasksContainer = document.getElementById('tasks-container');
    const loadingSpinner = document.getElementById('loading-spinner');

    // Show loading spinner
    loadingSpinner.style.display = 'none';
    tasksContainer.style.display = 'block';

    const taskDetails = {
        "hamster": { name: "Become a CEO on HamsterKombat", target: 1, reward: 10000, action: "Go" },
        "sealsend": { name: "Join SealSend", target: 1, reward: 10000, action: "Start" },
        "memelab": { name: "Start Earning on MemeLab", target: 1, reward: 10000, action: "Start" },
        "memefi": { name: "Earn some MemeFi", target: 1, reward: 10000, action: "Earn" },
        "litecoin": { name: "Start Earning Free Litecoins", target: 1, reward: 10000, action: "Start" },
        "followw-btn": { name: "Follow Softcoin on X", target: 1, reward: 10000, action: "Follow" },
        "join-btn": { name: "Join Softcoin Telegram Channel", target: 1, reward: 10000, action: "Join" },
        "refer2-btn": { name: "Invite 2 friends", target: 2, reward: 30000 },
        "refer5-btn": { name: "Invite 5 friends", target: 5, reward: 50000 },
        "refer10-btn": { name: "Invite 10 friends", target: 10, reward: 100000 },
        "freebitcoin": { name: "Start Earning Free Bitcoin", target: 1, reward: 10000, action: "Start" },
        "mine2-btn": { name: "Complete 2 mining sessions", target: 2, reward: 10000 },
        "mine20-btn": { name: "Complete 20 mining sessions", target: 20, reward: 100000 },
        "coinpayu": { name: "Start Earning On Coinpayu", target: 1, reward: 10000, action: "Start" },
        "mine100-btn": { name: "Complete 100 mining sessions", target: 100, reward: 1000000 },
         "post-btn": { name: "Make a post on X", target: 1, reward: 10000, action: "Post" },
        "cats": { name: "Join the CatsGang", target: 1, reward: 10000, action: "Join" },
        "sauce": { name: "Get some Sauce", target: 1, reward: 10000, action: "Go" },
        "satoshi": { name: "Join Satoshi", target: 1, reward: 10000, action: "Join" },
        "truecoin": { name: "Start Mining Truecoin", target: 1, reward: 10000, action: "Start" },
        "athene": { name: "Start Mining Athene", target: 1, reward: 10000, action: "Start" },
        "simple": { name: "Join Simple Tap", target: 1, reward: 10000, action: "Join" },
        "cex": { name: "Start Mining CEX", target: 1, reward: 10000, action: "Start" },
        "match-quest": { name: "Join MatchQuest", target: 1, reward: 10000, action: "Join" },
        "blum": { name: "Start Farming BLUM", target: 1, reward: 10000, action: "Start" },
        "seed-btn": { name: "Start farming Seeds", target: 1, reward: 10000, action: "Start" },
        "farm-btn": { name: "Farm $TOMATO", target: 1, reward: 10000, action: "Farm" },
        "sunwave": { name: "Join SUNWAVES", target: 1, reward: 10000, action: "Go" },
        "call": { name: "Join CALL", target: 1, reward: 10000, action: "Join" },
        "lost-dog": { name: "Join the Lost Dogs", target: 1, reward: 10000, action: "Join" },
        "major": { name: "Become A Major", target: 1, reward: 10000, action: "Go" },
        "money-dog": { name: "Start Farming Money-Dog", target: 1, reward: 10000, action: "Start" },
        "mozoai": { name: "Join MozoAI", target: 1, reward: 10000, action: "Join" },
        "nomiz": { name: "Start Mining Nomis", target: 1, reward: 10000, action: "Start" },
        "time-farm": { name: "Start Farming Time", target: 1, reward: 10000, action: "Start" },
        "vertus": { name: "Join Vertus", target: 1, reward: 10000, action: "Join" },
        "hot": { name: "Start Farming HOT", target: 1, reward: 10000, action: "Start" },
        "wonton": { name: "Earn some $WONTON", target: 1, reward: 10000, action: "Earn" },
        "sidefan": { name: "Join SideFan", target: 1, reward: 10000, action: "Join" },
        "agent": { name: "Join Agent301", target: 1, reward: 10000, action: "Join" },
        "earnbitmoon": { name: "Join EarnBitMoon", target: 1, reward: 10000, action: "Join" },
        "pocket": { name: "Join PocketFi", target: 1, reward: 10000, action: "Join" },

    };

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

    async function claimTask(taskId, reward) {
        try {
            const response = await fetch(`/api/claimTask`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, taskId, reward })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                return true;
            } else {
                console.error(data.message || 'Reward claimed successfully!');
                return false;
            }
        } catch (error) {
            console.error('Error claiming task:', error);
            return false;
        }
    }

    async function fetchTaskStatus(taskId) {
        try {
            const response = await fetch(`/api/taskStatus/${username}/${taskId}`);
            const data = await response.json();
            return data.success && data.claimed;
        } catch (error) {
            console.error('Error fetching task status:', error);
            return false;
        }
    }

    async function updateTaskButton(taskId, target, reward, fetchProgress) {
        const button = document.getElementById(taskId);
        const progressCount = await fetchProgress();

        if (await fetchTaskStatus(taskId)) {
            button.disabled = true;
            button.classList.add('claimed');
            button.innerHTML = "&#10003;"; // Checked sign
        } else if (progressCount >= target) {
            button.disabled = false;
            button.classList.remove('in-motion');
            button.classList.add('ready-to-claim');
            button.textContent = "Claim";
            button.addEventListener('click', async () => {
                const success = await claimTask(taskId, reward);
                if (success) {
                    button.disabled = true;
                    button.classList.remove('ready-to-claim');
                    button.classList.add('claimed');
                    button.innerHTML = "&#10003;"; // Checked sign
                    showCustomAlert('Reward claimed successfully!');
                    moveTaskToCompleted(taskId);
                } else {
                    showCustomAlert('Reward claimed successfully!');
                }
            });
        } else {
            button.disabled = true;
            button.classList.add('in-motion');
            button.textContent = `${progressCount}/${target}`;
        }
    }

    function handleSocialMediaTask(taskId, url) {
        const button = document.getElementById(taskId);
        const actionText = taskDetails[taskId].action;
        button.textContent = actionText;

        button.addEventListener('click', (event) => {
            if (button.textContent === "Claim") {
                claimSocialMediaTask(taskId);
            } else {
                localStorage.setItem(taskId + '-initiated', 'true');
                window.open(url, '_blank');
            }
        });
    }

    async function claimSocialMediaTask(taskId) {
        const button = document.getElementById(taskId);
        const success = await claimTask(taskId, 10000); // Assuming reward is 30000 for both tasks
        if (success) {
            button.disabled = true;
            button.classList.remove('ready-to-claim');
            button.classList.add('claimed');
            button.innerHTML = "&#10003;"; // Checked sign
            showCustomAlert('Reward claimed successfully!');
            localStorage.removeItem(taskId + '-initiated');
            moveTaskToCompleted(taskId);
        } else {
            showCustomAlert('Reward claimed successfully!');
        }
    }

    async function checkSocialMediaTask(taskId) {
        const button = document.getElementById(taskId);
        const actionText = taskDetails[taskId].action;

        if (localStorage.getItem(taskId + '-initiated') === 'true' && !(await fetchTaskStatus(taskId))) {
            button.disabled = false;
            button.classList.remove('in-motion');
            button.classList.add('ready-to-claim');
            button.textContent = "Claim";
            button.addEventListener('click', async () => {
                await claimSocialMediaTask(taskId);
            });
        } else if (await fetchTaskStatus(taskId)) {
            button.disabled = true;
            button.classList.add('claimed');
            button.innerHTML = "&#10003;"; // Checked sign
        } else {
            button.textContent = actionText;
        }
    }

    function moveTaskToCompleted(taskId) {
        const taskElement = document.getElementById(taskId).parentElement.parentElement;
        const completedTasksContainer = document.getElementById('completed-tasks');
        completedTasksContainer.appendChild(taskElement);
    }

    function showCustomAlert(message) {
        const customAlert = document.getElementById('custom-alert');
        const customAlertMessage = document.getElementById('custom-alert-message');
        customAlertMessage.textContent = message;
        customAlert.style.display = 'block';
    }

    window.closeCustomAlert = function() {
        const customAlert = document.getElementById('custom-alert');
        customAlert.style.display = 'none';
    }

    function createTaskElement(taskId, taskDetails) {
        const taskElement = document.createElement('div');
        taskElement.classList.add('task');
        taskElement.innerHTML = `
            <div id="main-div">
                <div id="task-item-div">
                    <span>${taskDetails.name}</span>
                    <p class="reward">Reward: <span>${taskDetails.reward} </span>SFT</p>
                </div>
                <div id="action-div">
                    <button id="${taskId}">0/${taskDetails.target}</button>
                </div>
            </div>
        `;
        return taskElement;
    }

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
        if (taskId === 'followw-btn' || taskId === 'join-btn' || taskId === 'post-btn'  || taskId === 'farm-btn' || taskId === 'seed-btn' || taskId === 'sunwave' || taskId === 'call' || taskId === 'lost-dog' || taskId === 'major' || taskId === 'money-dog' || taskId === 'mozoai' || taskId === 'nomiz' || taskId === 'time-farm' || taskId === 'vertus' || taskId === 'hot' || taskId === 'athene' || taskId === 'simple' || taskId === 'cex' || taskId === 'match-quest' || taskId === 'blum' || taskId === 'earnbitmoon' || taskId === 'truecoin' || taskId === 'satoshi' || taskId === 'sauce' || taskId === 'cats' || taskId === 'pocket' || taskId === 'freebitcoin' || taskId === 'coinpayu' || taskId === 'wonton' || taskId === 'sidefan' || taskId === 'agent' || taskId === 'hamster' || taskId === 'sealsend' || taskId === 'memelab' || taskId === 'memefi' || taskId === 'litecoin') {
            const url = {
                'followw-btn': 'https://twitter.com/softcoinproject',
                'litecoin': 'https://free-litecoin.com/login?referer=1639438',
                'memefi': 'https://t.me/memefi_coin_bot?start=r_c77f1b1767',
                'memelab': 'https://t.me/MemesLabBot?start=B77UIR',
                'sealsend': 'https://sealsend.email/@davidnelson',
                'hamster': 'https://t.me/hamster_kombat_boT/start?startapp=kentId1170015722',
                'freebitcoin': 'https://freebitco.in/?r=41656831',
                'coinpayu': 'https://www.coinpayu.com/?r=Davidnelson',
                'join-btn': 'https://t.me/softcoinupdates',
                'sidefan': 'https://t.me/sidekick_fans_bot?start=1170015722',
        'wonton': 'https://t.me/WontonOrgBot/gameapp?startapp=referralCode=ZQU4FUL6',
        'pocket': 'https://t.me/pocketfi_bot/Mining?startapp=1731371837',
                'sauce': 'https://sauces.world/@davidnelson',
                'cats': 'https://t.me/catsgang_bot/join?startapp=rLwerPH0TY6fTsuSKrikC',
                'satoshi': 'https://invite.satoshiapp.xyz/7j5qq',
                'truecoin': 'https://t.me/true_coin_bot?start=1170015722',
                'earnbitmoon': 'https://earnbitmoon.club/?ref=125258',
                'match-quest': 'https://t.me/MatchQuestBot/start?startapp=b0e03025b2ca2160315e2ebcacf4da52',
                'blum': 'https://t.me/BlumCryptoBot/app?startapp=ref_f1LDj4pzs5',
                'cex': 'https://t.me/cexio_tap_bot?start=1716270247236481',
                'simple': 'https://t.me/Simple_Tap_Bot/app?startapp=1716360435372',
                'athene': 'https://t.me/athene_official_bot/app?startapp=7575c96cae4c',
                'farm-btn': 'https://t.me/Tomarket_ai_bot/app?startapp=00001S56',
                'major': 'https://t.me/major/start?startapp=1170015722',
                'lost-dog': 'https://t.me/lost_dogs_bot/lodoapp?startapp=ref-u_1170015722__s_578244',
                'seed-btn': 'https://t.me/seed_coin_bot/app?startapp=1170015722',
                'sunwave': 'https://sunwavestoken.com/@davidnelson',
                'call': 'https://callfluent.io/@1170015722',
                'money-dog': 'https://t.me/money_dogs_bot/money_dogs?startapp=ou7n7ZHh',
                'mozoai': 'https://t.me/MozoAI_bot?start=1RE6BtMt',
                'nomiz': 'https://t.me/NomisAppBot/app?startapp=ref_Lw3iG-VUpB',
                'time-farm': 'https://t.me/TimeFarmCryptoBot?start=52dNTEOsZ344hdH9',
                'vertus': 'https://t.me/vertus_app_bot/app?startapp=1170015722',
                'hot': 'https://t.me/herewalletbot/app?startapp=1496880-village-27134',
                'post-btn': `https://twitter.com/intent/tweet?text=%F0%9F%93%88%20Ready%20to%20maximize%20your%20crypto%20potential%3F%0A%0ASoftcoin%20offers%20unparalleled%20opportunities%20with%20our%20referral%20and%20mining%20rewards.%0A%0AJoin%20us%20at%20softcoin.world%20and%20start%20earning%20today!%0A%0A%23CryptoLife%20%23CryptoRewards%20%23SoftCoin`,
                'agent': 'https://t.me/Agent301Bot/app?startapp=onetime1170015722',
            }[taskId];
            handleSocialMediaTask(taskId, url);
            checkSocialMediaTask(taskId);
        } else {
            updateTaskButton(taskId, details.target, details.reward, fetchProgress);
        }
    }
    // Hide loading spinner and show tasks
    loadingSpinner.style.display = 'none';
    tasksContainer.style.display = 'block';
});
