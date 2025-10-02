// Required dependencies
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

// Initialize Express application
const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Global variables (for demo only; use sessions/db in production)
let currentServerSeed = null;
let currentHashedServerSeed = null;
let currentClientSeed = null;
let currentNonce = 0;

// Helper: generate random hex seed
function generateRandomSeed(length = 32) {
  return crypto.randomBytes(length).toString('hex');
}

// Helper: SHA256 hash
function sha256Hash(data) {
  return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
}

// Helper: derive coin outcome
function deriveDiceRoll(hash) {
  // Use first 13 characters (~52 bits) to get high precision roll
  const hexSlice = hash.slice(0, 13);
  const decimalValue = parseInt(hexSlice, 16);
  const maxHex = Math.pow(16, hexSlice.length);

  // Convert to float between 0 and 100 (non-inclusive upper bound)
  const roll = (decimalValue / maxHex) * 100;

  // Return rounded roll between 1 and 100
  return Math.floor(roll) + 1;
}


// Start session
app.post('/start_session', (req, res) => {
  currentServerSeed = generateRandomSeed();
  currentHashedServerSeed = sha256Hash(currentServerSeed);
  currentClientSeed = generateRandomSeed();
  currentNonce = 0;

  console.log("New session started.");
  console.log("  Server seed (hidden):", currentServerSeed);
  console.log("  Hashed server seed (revealed):", currentHashedServerSeed);
  console.log("  Client seed (revealed):", currentClientSeed);

  res.json({
    hashedServerSeed: currentHashedServerSeed,
    clientSeedForSession: currentClientSeed,
    message: "New coinflip session started. Use the provided 'clientSeedForSession' for all flips!"
  });
});

// Coin flip
app.post('/flip', (req, res) => {
  if (!currentServerSeed || !currentClientSeed) {
    return res.status(400).json({
      error: "No active session. Please call /start_session first to begin a new game."
    });
  }

  const playerChoice = parseInt(req.body.playerChoice); // 2–98 expected

  if (isNaN(playerChoice) || playerChoice < 2 || playerChoice > 98) {
    return res.status(400).json({ error: "Invalid 'playerChoice'. Must be an integer between 2 and 98." });
  }

  currentNonce += 1;

  const combinedString = `${currentServerSeed}-${currentClientSeed}-${currentNonce}`;
  const flipHash = sha256Hash(combinedString);
  const roll = deriveDiceRoll(flipHash);
  const win = roll < playerChoice;

  // Optional: payout multiplier
  const multiplier = +(99 / (playerChoice)).toFixed(2);  // Standard formula

  console.log(`Roll ${currentNonce}: Player chose under ${playerChoice}, Rolled: ${roll}, Win: ${win}`);

  res.json({
    roll,
    playerChoice,
    win,
    currentNonce,
    flipHash,
    clientSeedUsed: currentClientSeed,
    multiplier,
    message: "Dice roll complete."
  });
});


// Change session
app.post('/change_session', (req, res) => {
  if (!currentServerSeed) {
    return res.status(400).json({ error: "No active session to change." });
  }

  const revealedServerSeed = currentServerSeed;
  const revealedClientSeed = currentClientSeed;
  const finalNonce = currentNonce;

  currentServerSeed = null;
  currentHashedServerSeed = null;
  currentClientSeed = null;
  currentNonce = 0;

  console.log(`Session changed. Revealed server seed: ${revealedServerSeed}, Revealed client seed: ${revealedClientSeed}, Final nonce: ${finalNonce}`);

  res.json({
    revealedServerSeed,
    revealedClientSeed,
    finalNonce,
    message: "Server and Client seeds revealed. Session ended. You can now verify all past flips."
  });
});

// Start server
app.listen(port, () => {
  console.log(`Coinflip backend listening on http://localhost:${port}`);
});