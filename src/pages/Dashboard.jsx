import { useEffect, useState } from "react";
import axios from "axios";

export default function Dashboard() {
  const [topArtists, setTopArtists] = useState([]);

  useEffect(() => {
    async function fetchTopArtists() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        console.log("No token found — redirecting to login");
        window.location = "/";
        return;
      }

      try {
        const res = await axios.get(
          "https://api.spotify.com/v1/me/top/artists?limit=10",
          {
            headers: { Authorization: "Bearer " + token }
          }
        );

        setTopArtists(res.data.items);

      } catch (err) {
        console.log("SPOTIFY ERROR STATUS:", err.response?.status);
  console.log("SPOTIFY ERROR DATA:", err.response?.data);
   console.log("FULL ERROR OBJECT:", err);
    }
  }
    fetchTopArtists();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Your Top Artists</h1>
      {topArtists.map((artist) => (
        <div key={artist.id}>{artist.name}</div>
      ))}
    </div>
  );
}
