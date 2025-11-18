import { useEffect, useState } from "react";
import axios from "axios";
import artistScores from "../data/artists.json";

export default function Dashboard() {
  const [topArtists, setTopArtists] = useState([]);
  const [performativeSum, setPerformativeSum] = useState(0);
  const [performativeCount, setPerformativeCount] = useState(0);
  const [nonPerformativeCount, setNonPerformativeCount] = useState(0);
  const [performativePercent, setPerformativePercent] = useState(0);

  const timeRange = "medium_term"; // ~past 6 months, closest to 1 year in Spotify API
  const limit = 50; // top 50 artists

  // Logistic mapping function
  function mapPerformativePercent(x) {
    const L = 114.1606;
    const U = 2.092112e-15; // essentially 0
    const x0 = 77.96815;
    const k = 1.122249;

    const y = L + (U - L) / (1 + Math.pow(x / x0, k));
    // Scale to 0-100
    const scaled = (y / L) * 100;
    return Math.min(scaled, 100).toFixed(1);
  }

  useEffect(() => {
    async function fetchTopArtists() {
      const token = localStorage.getItem("access_token");

      if (!token) {
        window.location = "/";
        return;
      }

      try {
        const res = await axios.get(
          `https://api.spotify.com/v1/me/top/artists?limit=${limit}&time_range=${timeRange}`,
          {
            headers: { Authorization: "Bearer " + token },
          }
        );

        const artists = res.data.items;
        setTopArtists(artists);

        // Calculate performative score stats
        let sum = 0;
        let performative = 0;
        let nonPerformative = 0;

        artists.forEach((artist) => {
          const score = artistScores[artist.name.toLowerCase()];
          if (score) {
            sum += score;
            performative += 1;
          } else {
            nonPerformative += 1;
          }
        });

        setPerformativeSum(sum);
        setPerformativeCount(performative);
        setNonPerformativeCount(nonPerformative);

        // Calculate performative percent
        setPerformativePercent(mapPerformativePercent(sum));
      } catch (err) {
        console.log("SPOTIFY ERROR:", err);
      }
    }

    fetchTopArtists();
  }, []);

  return (
    <div style={{ padding: "20px" }}>
      <h1>Your Top 50 Artists (Past Year)</h1>

      <div style={{ marginBottom: "20px" }}>
        <p>
          Performative artists: {performativeCount} | Non-performative:{" "}
          {nonPerformativeCount}
        </p>
      </div>

      <div>
        {topArtists.map((artist) => {
          const score = artistScores[artist.name.toLowerCase()] || "No score";
          return (
            <div key={artist.id}>
              {artist.name} — {score}
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "20px", fontWeight: "bold" }}>
        Performative Score: {performativeSum}
      </div>

      <div style={{ marginTop: "10px", fontWeight: "bold", color: "green" }}>
        Performative Percent: {performativePercent}%
      </div>
    </div>
  );
}
