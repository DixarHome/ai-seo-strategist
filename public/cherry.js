document.addEventListener("DOMContentLoaded", () => {
    fetch('cherry.html')
        .then(response => response.text())
        .then(data => {
            document.getElementById('cherry-placeholder').innerHTML = data;

            const cherryLogo = document.getElementById('cherry-logo');
            const cherryModal = document.getElementById('cherry-modal');
            const cherryMessage = document.getElementById('cherry-message');
            const cherryClose = document.getElementsByClassName('cherry-close')[0];
            let conversationIndex = 0;

            const messages = [
                `Hello,<br><br><b>Welcome to Softcoin!</b><br><br>Will you like a tour?<br><br>`,
                `Alright.<br><br>If you need assistance with anything, simply click on the logo at the top left corner of the screen, we will be ready to assist in any way we can.<br><br>Happy mining!<br><br>`,
                `Great! Let's begin.<br><br><b>What is Softcoin?</b><br><br>Softcoin is an innovative crypto airdrop project dedicated to improving the lives of all participants. Our primary focus is on achieving listings on leading exchange platforms at favorable rates, ensuring accessibility and growth opportunities for our community.<br><br>We are committed to fostering a supportive ecosystem where every participant contributes meaningfully to our collective success. By participating in our programs, you not only contribute to the project's development but also benefit from potential rewards and advancements in the crypto space. <br><br>As we navigate this journey, your engagement and support play a crucial role in establishing Softcoin as a reliable and impactful presence within the cryptocurrency community. Together, we aim to create sustainable value and opportunities that enrich the experiences of our participants and stakeholders alike. Join us as we embark on this transformative endeavor, shaping the future of crypto airdrops with innovation and integrity.<br><br>`,
                `<b>How To Mine Softcoin</b><br><br>Mining Softcoin is a straightforward process. To begin, simply click the 'Start Mining' button to initiate a mining session that lasts for 2 hours at level 1. Each session rewards you with 15,000 SFT.<br><br> Once a session concludes, you can immediately start a new one by clicking the same button again. This allows for continuous accumulation of Softcoin through successive mining sessions. The process is designed to be user-friendly, ensuring that participants can easily engage in mining activities without complexity.<br><br>`,
                `<b>Level Upgrades</b><br><br>To maximize your mining capabilities, consider upgrading your mining level within the Softcoin system. By paying a token from your existing SFT balance, you can progress smoothly to the subsequent level. As you ascend through the levels, your rewards grow in proportion to your increased mining proficiency. Additionally, each advancement unlocks longer durations for your mining sessions, allowing for more significant accumulations of Softcoin over time.<br><br>This structured approach encourages strategic progression within the mining ecosystem. It underscores the platform's commitment to rewarding users based on their commitment and contribution, fostering a dynamic environment conducive to both individual growth and collective prosperity in cryptocurrency mining.<br><br>`,
                `<b>Friends and Referral Bonuses</b><br><br>Inviting friends to join Softcoin using your unique referral link, and for every successful referral, you will receive 50,000 SFT. Your friend, upon registering through your referral link, will also receive 50,000 SFT.<br><br>Moreover, you get a passive 20% share from your friends' earnings.<br><br>To view your referral activities and obtain your referral link, please navigate to the 'Friends' section located in the menu below.<br>`,
                `<b>Tasks</b><br><br>Additional earnings can be acquired through task completion. Upon successful completion of a task, you will be rewarded with SFT. Rewards can be claimed and subsequently added to your total earnings.<br><br>Furthermore, you receive additional rewards for daily check-ins, with incremental increases for maintaining consecutive check-in streaks."<br><br>`,
                `<b>Softie</b><br><br>Softies are esteemed premium participants, akin to stakeholders who play a pivotal role in our ecosystem. <br><br>To become a softie, you are required to make a commitment, and you receive a predetermined percentage of your commitment deposited into your account daily.<br><br>Benefits of becoming a Softie include:<ul><li>You recieve daily payouts in USDT, providing a reliable income stream.</li><li>Flexibility to withdraw your payout at any time.</li><li>Accumulation of SFT tokens alongside daily returns, enhancing overall portfolio value.</li></ul>Softies are poised to receive a higher percentage of their earnings following the Token Generation Event (TGE), granting them preferential treatment over regular users.<br><br>`,
                `<b>Earn More</b><br><br>Softcoin offers a wealth of activities designed for both earning rewards and entertainment. Whether you're looking to boost your earnings or simply have fun, we provides a variety of engaging options.<br><br>By tapping on 'More' below the screen, you can explore additional ways to accumulate Softcoin effortlessly.<br><br>Discover a diverse range of activities, each offering opportunities to earn rewards. we ensures flexibility and convenience by allowing users to choose activities that best suit their preferences and schedule.<br><br>Whether you're aiming to build up your Softcoin balance or simply seeking to enjoy interactive experiences, the platform caters to diverse interests and goals. Take advantage of the diverse opportunities available and start maximizing your earning potential.<br><br>`,
                `Thank You for taking the tour.<br><br>You can read extensively about the core value, mission statement, and tokenomics of the project in our <a href="#">white paper</a>.<br><br>If you need assistance with anything, simply click on the logo at the top left corner of the screen, and we will be ready to assist in any way I can.<br><br>Happy mining!<br><br>`
            ];

            const buttons = [
                `<button id="no-thanks">No, thank you!</button><button id="yes-please">Yes, please.</button>`,
                `<button id="start">Start</button>`,
                `<button id="end-tour">End Tour</button><button id="continue">Continue</button>`,
                `<button id="end-tour">End Tour</button><button id="continue">Continue</button>`,
                `<button id="end-tour">End Tour</button><button id="continue">Continue</button>`,
                `<button id="end-tour">End Tour</button><button id="continue">Continue</button>`,
                `<button id="end-tour">End Tour</button><button id="continue">Continue</button>`,
                `<button id="end-tour">End Tour</button><button id="continue">Continue</button>`,
                `<button id="end-tour">End Tour</button><button id="continue">Continue</button>`,
                `<button id="start">Start</button>`
            ];

            const openModal = (index) => {
                cherryMessage.innerHTML = messages[index];
                const buttonsContainer = document.createElement('div');
                buttonsContainer.innerHTML = buttons[index];
                cherryMessage.appendChild(buttonsContainer);
                cherryModal.style.display = 'flex';

                if (index === 0) {
                    document.getElementById('no-thanks').addEventListener('click', () => {
                        openModal(1);
                    });

                    document.getElementById('yes-please').addEventListener('click', () => {
                        openModal(2);
                    });
                } else if (index === 1 || index === 9) {
                    document.getElementById('start').addEventListener('click', () => {
                        cherryModal.style.display = 'none';
                    });
                } else {
                    document.getElementById('continue').addEventListener('click', () => {
                        openModal(index + 1);
                    });

                    document.getElementById('end-tour').addEventListener('click', () => {
                        openModal(1);
                    });
                }
            };

            const startIntroduction = () => {
                openModal(0);
            };

            cherryClose.addEventListener('click', () => {
                cherryModal.style.display = 'none';
            });

            window.addEventListener('click', (event) => {
                if (event.target === cherryModal) {
                    cherryModal.style.display = 'none';
                }
            });

            // Check if the user is coming from the login page
            if (document.referrer.includes('/login')) {
                // Start introduction and mark it as started
                startIntroduction();
                sessionStorage.setItem('introductionStarted', 'true');
            }

            cherryLogo.addEventListener('click', () => {
                cherryMessage.innerHTML = `
                    <p></p>
                    <button id="learn-more">Learn more</button>
                    <button id="read-whitepaper">Whitepaper</button>
                    <button id="report-issue">Report an issue</button>
                    <button id="whats-new">What's new?</button>
                    <button id="community">Community</button>
                `;
                cherryModal.style.display = 'flex';

                document.getElementById('learn-more').addEventListener('click', () => {
                    window.location.href = "#";
                });

                document.getElementById('read-whitepaper').addEventListener('click', () => {
                    window.location.href = "#";
                });

                document.getElementById('report-issue').addEventListener('click', () => {
                    window.location.href = "mailto:support@softcoin.world";
                });

                document.getElementById('whats-new').addEventListener('click', () => {
                    window.location.href = "https://twitter.com/softcoin__";
                });

                document.getElementById('community').addEventListener('click', () => {
                    window.location.href = "https://t.me/softcoinupdates";
                });
            });
        });
});
