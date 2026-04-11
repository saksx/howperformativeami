import axios from "axios";

export const SPOTIFY_CLIENT_ID =
  process.env.REACT_APP_SPOTIFY_CLIENT_ID || "cf12d9a2f6ac4dc59d21774ce4fdb3cb";
export const SPOTIFY_SCOPES = [
  "user-top-read",
  "user-read-recently-played",
  "user-follow-read",
  "playlist-read-private",
  "playlist-read-collaborative",
];

const ACCESS_TOKEN_KEY = "spotify_access_token";
const REFRESH_TOKEN_KEY = "spotify_refresh_token";
const EXPIRES_AT_KEY = "spotify_expires_at";
const CODE_VERIFIER_KEY = "spotify_code_verifier";
const STATE_KEY = "spotify_auth_state";

export function getSpotifyRedirectUri() {
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return "http://127.0.0.1:3000/callback";
  }

  return "https://howperformativeami.com/callback";
}

function generateRandomString(length) {
  const charset =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const values = new Uint8Array(length);
  window.crypto.getRandomValues(values);

  return Array.from(values, (value) => charset[value % charset.length]).join("");
}

async function sha256(value) {
  const encoder = new TextEncoder();
  const data = encoder.encode(value);
  return window.crypto.subtle.digest("SHA-256", data);
}

function base64UrlEncode(buffer) {
  const bytes = new Uint8Array(buffer);
  let string = "";

  bytes.forEach((byte) => {
    string += String.fromCharCode(byte);
  });

  return window
    .btoa(string)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function storeTokenData(tokenData) {
  const expiresAt = Date.now() + tokenData.expires_in * 1000;
  localStorage.setItem(ACCESS_TOKEN_KEY, tokenData.access_token);
  localStorage.setItem(EXPIRES_AT_KEY, String(expiresAt));

  if (tokenData.refresh_token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, tokenData.refresh_token);
  }
}

export function clearSpotifySession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(EXPIRES_AT_KEY);
  localStorage.removeItem(CODE_VERIFIER_KEY);
  localStorage.removeItem(STATE_KEY);
}

export async function beginSpotifyLogin() {
  const codeVerifier = generateRandomString(64);
  const codeChallenge = base64UrlEncode(await sha256(codeVerifier));
  const state = generateRandomString(16);
  const redirectUri = getSpotifyRedirectUri();

  localStorage.setItem(CODE_VERIFIER_KEY, codeVerifier);
  localStorage.setItem(STATE_KEY, state);

  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri,
    scope: SPOTIFY_SCOPES.join(" "),
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    state,
  });

  window.location.assign(`https://accounts.spotify.com/authorize?${params}`);
}

export async function exchangeSpotifyCode(code, returnedState) {
  const storedState = localStorage.getItem(STATE_KEY);
  const codeVerifier = localStorage.getItem(CODE_VERIFIER_KEY);

  if (!code || !storedState || !codeVerifier || returnedState !== storedState) {
    throw new Error("Spotify login validation failed.");
  }

  const body = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: "authorization_code",
    code,
    redirect_uri: getSpotifyRedirectUri(),
    code_verifier: codeVerifier,
  });

  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    body,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  storeTokenData(response.data);
  localStorage.removeItem(CODE_VERIFIER_KEY);
  localStorage.removeItem(STATE_KEY);
}

export async function refreshSpotifyAccessToken() {
  const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);

  if (!refreshToken) {
    return null;
  }

  const body = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    grant_type: "refresh_token",
    refresh_token: refreshToken,
  });

  const response = await axios.post(
    "https://accounts.spotify.com/api/token",
    body,
    {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    }
  );

  storeTokenData({
    ...response.data,
    refresh_token: response.data.refresh_token || refreshToken,
  });

  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export async function getSpotifyAccessToken() {
  const accessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
  const expiresAt = Number(localStorage.getItem(EXPIRES_AT_KEY) || "0");

  if (!accessToken) {
    return null;
  }

  if (Date.now() < expiresAt - 60_000) {
    return accessToken;
  }

  return refreshSpotifyAccessToken();
}
