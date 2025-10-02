"use client";
import React, { useState } from "react";

const API_URL = "http://localhost:5000";

export default function Coinflip() {
  const [session, setSession] = useState<null | {
    hashedServerSeed: string;
    clientSeedForSession: string;
  }>(null);
  const [flipResult, setFlipResult] = useState<any>(null);
  const [playerChoice, setPlayerChoice] = useState<"heads" | "tails">("heads");
  const [sessionEnded, setSessionEnded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startSession() {
    setLoading(true);
    setError(null);
    setFlipResult(null);
    setSessionEnded(false);
    try {
      const res = await fetch(`${API_URL}/start_session`, { method: "POST" });
      const data = await res.json();
      setSession({
        hashedServerSeed: data.hashedServerSeed,
        clientSeedForSession: data.clientSeedForSession,
      });
    } catch (err) {
      setError("Failed to start session.");
    }
    setLoading(false);
  }

  async function flipCoin() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/flip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerChoice }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setFlipResult(data);
      }
    } catch (err) {
      setError("Failed to flip coin.");
    }
    setLoading(false);
  }

  async function endSession() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/change_session`, { method: "POST" });
      const data = await res.json();
      setSessionEnded(true);
      setSession(null);
      setFlipResult(null);
      setError(null);
      alert(
        `Session ended!\nServer Seed: ${data.revealedServerSeed}\nClient Seed: ${data.revealedClientSeed}\nFinal Nonce: ${data.finalNonce}`
      );
    } catch (err) {
      setError("Failed to end session.");
    }
    setLoading(false);
  }

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white text-black rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Provable Coinflip</h2>
      {!session && !sessionEnded && (
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded"
          onClick={startSession}
          disabled={loading}
        >
          {loading ? "Starting..." : "Start Session"}
        </button>
      )}

      {session && (
        <div>
          <div className="mb-2">
            <strong>Hashed Server Seed:</strong> {session.hashedServerSeed}
          </div>
          <div className="mb-2">
            <strong>Client Seed:</strong> {session.clientSeedForSession}
          </div>
          <div className="mb-4">
            <label className="mr-2">Your Choice:</label>
            <select
              value={playerChoice}
              onChange={e =>
                setPlayerChoice(e.target.value as "heads" | "tails")
              }
              className="border px-2 py-1 rounded"
            >
              <option value="heads">Heads</option>
              <option value="tails">Tails</option>
            </select>
            <button
              className="ml-4 bg-green-600 text-white px-4 py-2 rounded"
              onClick={flipCoin}
              disabled={loading}
            >
              {loading ? "Flipping..." : "Flip"}
            </button>
          </div>
          {flipResult && (
            <div className="mb-4">
              <div>
                <strong>Outcome:</strong> {flipResult.outcome}
              </div>
              <div>
                <strong>You {flipResult.win ? "Win!" : "Lose!"}</strong>
              </div>
              <div>
                <strong>Nonce:</strong> {flipResult.currentNonce}
              </div>
              <div>
                <strong>Hash:</strong> {flipResult.flipHash}
              </div>
            </div>
          )}
          <button
            className="bg-red-600 text-white px-4 py-2 rounded"
            onClick={endSession}
            disabled={loading}
          >
            {loading ? "Ending..." : "End Session"}
          </button>
        </div>
      )}

      {error && <div className="text-red-600 mt-4">{error}</div>}
      {sessionEnded && (
        <div className="mt-4 text-green-700 font-bold">
          Session ended. Start a new session to play again.
        </div>
      )}
    </div>
  );
}