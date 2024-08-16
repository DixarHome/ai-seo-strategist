// ticker.js

// Array of 100 different usernames
const usernames = [
    "AliceW", "BobC", "CharlieM", "DianeH", "EvanP", "FayT", "GeorgeR", "moham24",
    "IanK", "JasmineV", "KyleL", "LunaM", "MasonJ", "NinaD", "OscarF", "PaulaS",
    "QuincyZ", "RachelY", "SteveX", "TinaG", "UmaN", "VictorA", "WendyE", "XanderO",
    "YaraQ", "Olabb", "AlexB", "BrookeW", "CodyK", "DerekP", "ElenaJ", "FelixC",
    "GinaM", "HenryL", "IslaV", "JakeN", "KaraR", "LiamF", "moses2140", "NoahS",
    "OliviaT", "ParkerJ", "QuinnH", "RubyV", "SamC", "TessaB", "UlyssesL", "VeraD",
    "WillowS", "XenaZ", "YvonneP", "ZackW", "AmberK", "BlakeR", "ChloeN", "DylanT",
    "EllaG", "FinnB", "GraceO", "HarryM", "IsabelE", "JordanQ", "KelseyV", "LoganZ",
    "MorganL", "NatalieA", "OwenX", "PiperS", "QuentinF", "RileyJ", "SophiaK", "TylerP",
    "UrsulaY", "VincentW", "WillM", "XiomaraG", "YvetteD", "ZacharyC", "AidenN", "BriannaS",
    "ColeH", "DaisyM", "ElliotV", "FionaP", "GavinQ", "HazelJ", "IsaacB", "JadeT",
    "KadenL", "LeahC", "MicahW", "NicoR", "OrianaG", "PhoenixZ", "ReedX", "SierraY",
    "TheoE", "UmaF", "VioletK", "WestonA"
];

// Array of random prizes
const prizes = [
    "0.10 USD", "50,000 SFT", "2 Spin Tickets", "5,000 SFT", "10 USD", "2,000 SFT",
    "2 USD", "5 Spin Tickets", "0.50 USD"
];

// Function to generate a random ticker text
function getRandomTickerText() {
    const randomUser = usernames[Math.floor(Math.random() * usernames.length)];
    const randomPrize = prizes[Math.floor(Math.random() * prizes.length)];
    return `${randomUser} just won ${randomPrize}!`;
}

// Function to update the ticker text continuously
function updateTickerText() {
    const tickerText = document.querySelector('.ticker-text');
    tickerText.textContent = getRandomTickerText();

    // Random delay between 2 to 5 seconds
    setTimeout(updateTickerText, Math.random() * 0 + 10000 );
}

// Start the ticker
updateTickerText();
