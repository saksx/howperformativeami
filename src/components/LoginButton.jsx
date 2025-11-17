export default function LoginButton() {
  const CLIENT_ID = "cf12d9a2f6ac4dc59d21774ce4fdb3cb";
const REDIRECT_URI = "http://127.0.0.1:3000/callback";
  const SCOPES = [
    "user-top-read",
    "user-read-recently-played"
  ];

  const login = () => {
    const authUrl =
      "https://accounts.spotify.com/authorize" +
      "?response_type=code" +
      "&client_id=" + CLIENT_ID +
      "&scope=" + encodeURIComponent(SCOPES.join(" ")) +
      "&redirect_uri=" + encodeURIComponent(REDIRECT_URI);

    window.location = authUrl;
  };

  return (
    
    <div style={{ textAlign: "center", marginTop: "100px" }}>
  
  <button
    onClick={login}
    style={{
      fontSize: "18px",
      fontWeight: "regular",
      padding: "12px 30px",
      borderRadius: "15px",
      border: "none",
      background: "linear-gradient(90deg, #1DB954, #18b54fff)",
      color: "#fff",
      cursor: "pointer",
      transition: "all 0.3s ease",
    }}
    
  >
    Log in with Spotify
  </button>
</div>
  );
}