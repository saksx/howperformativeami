import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { clearSpotifySession, exchangeSpotifyCode } from "../spotifyConfig";

const LOADING_MESSAGES = [
  "Scanning your guilty pleasures...",
  "Checking if your indie picks are mainstream now...",
  "Counting how many prestige tracks got skipped...",
  "Auditing your public-listening persona...",
];

let activeExchangeCode = null;
let activeExchangePromise = null;

export default function Callback() {
  const navigate = useNavigate();
  const [messageIndex, setMessageIndex] = useState(0);
  const [callbackError, setCallbackError] = useState("");

  useEffect(() => {
    const messageInterval = setInterval(() => {
      setMessageIndex((current) => (current + 1) % LOADING_MESSAGES.length);
    }, 1800);

    return () => clearInterval(messageInterval);
  }, []);

  useEffect(() => {
    async function getToken() {
      const code = new URLSearchParams(window.location.search).get("code");
      const state = new URLSearchParams(window.location.search).get("state");

      if (!code) {
        navigate("/");
        return;
      }

      try {
        if (!activeExchangePromise || activeExchangeCode !== code) {
          activeExchangeCode = code;
          activeExchangePromise = exchangeSpotifyCode(code, state).finally(() => {
            activeExchangeCode = null;
            activeExchangePromise = null;
          });
        }

        await activeExchangePromise;
        navigate("/dashboard");
      } catch (err) {
        clearSpotifySession();
        console.log("ERROR DATA:", err.response?.data || err.message);
        console.log("ERROR STATUS:", err.response?.status);
        setCallbackError(
          err.response?.data?.error_description ||
            err.response?.data?.error ||
            err.message ||
            "Spotify login failed."
        );
      }
    }

    getToken();
  }, [navigate]);

  return (
    <section className="screen screen--loading">
      <div className="noise-overlay" />
      <div className="loading-layout">
        <div className="loading-ring">
          <div className="loading-ring__inner">
            <span>SYNC</span>
          </div>
        </div>

        <div className="loading-copy">
          <p className="loading-kicker">Analyzing your listening history</p>
          <h1>
            {callbackError ? "Spotify login could not be completed." : LOADING_MESSAGES[messageIndex]}
          </h1>
          {callbackError ? (
            <div className="auth-error-card">
              <p>{callbackError}</p>
              <button className="results-action results-action--secondary" onClick={() => navigate("/")}>
                Back Home
              </button>
            </div>
          ) : (
            <div className="loading-bar">
              <div className="loading-bar__fill" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
