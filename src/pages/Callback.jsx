import axios from "axios";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    async function getToken() {
      const code = new URLSearchParams(window.location.search).get("code");

      const clientId = "cf12d9a2f6ac4dc59d21774ce4fdb3cb";
      const clientSecret = "81754d4124f74556904447840ee729f9";

      const body = new URLSearchParams({
        grant_type: "authorization_code",
        code: code,
        redirect_uri: "http://127.0.0.1:3000/callback"
      });

      try {
        const response = await axios.post(
          "https://accounts.spotify.com/api/token",
          body,
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
              "Authorization": "Basic " + btoa(clientId + ":" + clientSecret)
            }
          }
        );

        localStorage.setItem("access_token", response.data.access_token);
        navigate("/dashboard");

      } catch (err) {
        console.log("ERROR DATA:", err.response?.data);
        console.log("ERROR STATUS:", err.response?.status);
      }
    }

    getToken();
  }, [navigate]);

  return <div>Loading...</div>;
}
