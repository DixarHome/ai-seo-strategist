const gameContainer = document.getElementById('game-container');
        const scoreElement = document.getElementById('score');
        const levelElement = document.getElementById('level');
        const spinCardCountElement = document.getElementById('spin-card-count');
        const gameOverElement = document.getElementById('game-over');
        const startButton = document.getElementById('start-button');
        const restartButton = document.getElementById('restart-button');
        const exitButton = document.getElementById('exit-button');
        const loadingScreen = document.getElementById('loading-screen');
        let score = 0;
        let spinCardCount = 0;
        let gameOver = false;
        let coinInterval;
        let levelInterval;
        let level = 1;
        let dropSpeed = 2;
        let levelUpTime = 20000; // 20 seconds per level

        const backgrounds = {
            initial: 'url("game/start.png")',
            inGame: 'url("game/game.png")',
            gameOver: 'url("game/game-over.png")'
        };

        function setGameBackground(type) {
            gameContainer.style.backgroundImage = backgrounds[type];
        }

        function createCoin() {
            if (gameOver) return;

            const coin = document.createElement('div');
            coin.className = 'coin';
            coin.style.left = `${Math.random() * (window.innerWidth - 50)}px`;
            coin.style.top = '-50px';

            const coinType = getCoinType();
            coin.classList.add(coinType.class);
            coin.style.backgroundImage = `url('${coinType.image}')`;

            gameContainer.appendChild(coin);

            function dropCoin() {
                if (parseInt(coin.style.top) + 50 < window.innerHeight) {
                    coin.style.top = `${parseInt(coin.style.top) + dropSpeed}px`;
                    requestAnimationFrame(dropCoin);
                } else {
                    gameContainer.removeChild(coin);
                    endGame();
                }
            }

            coin.addEventListener('click', () => {
                if (coinType.name === "Spin Card") {
                    spinCardCount++;
                    spinCardCountElement.textContent = `Spin Cards: ${spinCardCount}`;
                } else {
                    score += coinType.value;
                    scoreElement.textContent = `Softcoin: ${score}`;
                }
                showScorePopup(coin, coinType.value);
                gameContainer.removeChild(coin);
            });

            dropCoin();
        }

        function showScorePopup(coin, value) {
            const popup = document.createElement('div');
            popup.className = 'score-popup';
            popup.textContent = `+${value}`;
            popup.style.left = `${coin.style.left}`;
            popup.style.top = `${coin.style.top}`;
            gameContainer.appendChild(popup);

            setTimeout(() => {
                gameContainer.removeChild(popup);
            }, 1000);
        }

        function getCoinType() {
            const randomNum = Math.random();
            if (level >= 5 && randomNum < 0.1) {
                return { name: "Spin Card", value: 0, class: "spin-card", image: 'game/spin-card.png' };
            } else if (level >= 4 && randomNum < 0.3) {
                return { name: "Monster Coin", value: 10, class: "monster-coin", image: 'game/monster-coin.png' };
            } else if (level >= 3 && randomNum < 0.5) {
                return { name: "Super-Duper Coin", value: 5, class: "super-duper-coin", image: 'game/super-duper-coin.png' };
            } else if (level >= 2 && randomNum < 0.7) {
                return { name: "Super Coin", value: 2, class: "super-coin", image: 'game/super-coin.png' };
            } else {
                return { name: "Normal Coin", value: 1, class: "normal-coin", image: 'game/coin.png' };
            }
        }

        function endGame() {
            gameOver = true;
            gameOverElement.style.display = 'block';
            restartButton.style.display = 'block';
            exitButton.style.display = 'block';
            clearInterval(coinInterval);
            clearInterval(levelInterval);

            // Remove all remaining coins
            const remainingCoins = document.querySelectorAll('.coin');
            remainingCoins.forEach(coin => gameContainer.removeChild(coin));

            setGameBackground('gameOver');
            hideGameUI();
        }

        function restartGame() {
            score = 0;
            spinCardCount = 0;
            level = 1;
            dropSpeed = 2;
            gameOver = false;
            levelUpTime = 20000; // Reset to 20 seconds
            scoreElement.textContent = `Softcoin: ${score}`;
            spinCardCountElement.textContent = `Spin Cards: ${spinCardCount}`;
            levelElement.textContent = `Level: ${level}`;
            gameOverElement.style.display = 'none';
            restartButton.style.display = 'none';
            exitButton.style.display = 'none';

            setGameBackground('inGame');

            loadingScreen.style.display = 'block';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
                startGame();
            }, 2000);
        }

        function startGame() {
            setGameBackground('inGame');
            showGameUI();
            coinInterval = setInterval(createCoin, 500); // Create a new coin every half second
            levelInterval = setInterval(() => {
                if (level < 5) {
                    level++;
                    dropSpeed += 1; // Increase drop speed with each level
                    levelElement.textContent = `Level: ${level}`;
                }
            }, levelUpTime); // Level up every 20 seconds
        }

        startButton.addEventListener('click', () => {
            startButton.style.display = 'none';
            restartGame();
        });

        restartButton.addEventListener('click', restartGame);

        exitButton.addEventListener('click', () => {
window.location.href = '/more';
});
    function hideGameUI() {
        scoreElement.style.display = 'none';
        levelElement.style.display = 'none';
        spinCardCountElement.style.display = 'none';
    }

    function showGameUI() {
        scoreElement.style.display = 'block';
        levelElement.style.display = 'block';
        spinCardCountElement.style.display = 'block';
    }

    setGameBackground('initial');
    startButton.style.display = 'block';