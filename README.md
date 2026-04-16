# How Performative Am I?

A Spotify-powered web app that playfully audits how much of your music taste is active listening and how much is carefully curated persona.

The app connects to a user's Spotify account, analyzes top artists, recently played tracks, followed artists, and playlist data, then generates a performative listening score with artist-level breakdowns and shareable results.

## Live Site

[howperformativeami.com](https://howperformativeami.com)

## What It Does

- Authenticates users with Spotify OAuth using PKCE.
- Pulls Spotify listening signals across short, medium, and long-term listening windows.
- Scores artists with a custom TypeScript model that looks at popularity, recent plays, playlist curation, artist tenure, followed artists, and genre/archetype signals.
- Produces an overall "performativity" score with profile labels, top performative artists, genre distribution, and detailed artist breakdowns.
- Includes retry handling, session caching, and graceful Spotify API error states.
- Presents results in a polished React interface with motion-based animations and share actions.

## Tech Stack

- React
- React Router
- TypeScript scoring modules
- Spotify Web API
- Spotify OAuth PKCE flow
- Motion
- Axios
- Vercel Analytics

## Project Structure

```text
src/
  components/       Reusable UI pieces for login, results, and footer
  pages/            OAuth callback and dashboard screens
  scoring/          Artist classification and performativity scoring logic
  spotify/          Spotify API fetching, normalization, caching, and retries
  spotifyConfig.js  OAuth token handling and Spotify session utilities
```

## Scoring Model

The score is built from several listening-behavior signals:

- Never-played artists that appear in profile data but not recent listening.
- Popularity gaps between an artist's public popularity and the user's actual play frequency.
- Playlist curation patterns compared with recent listening.
- Prestige or culturally recognizable artists with low engagement.
- Long-term favorites that no longer appear in short-term listening.
- Authenticity discounts for lower-popularity artists with meaningful recent play counts.

Those signals are weighted by artist classification and combined into an overall profile score from 0 to 100.

## Getting Started

Install dependencies:

```bash
npm install
```

Create a Spotify application in the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard), then add these redirect URIs:

```text
http://127.0.0.1:3000/callback
https://howperformativeami.com/callback
```

Create a local `.env` file if you want to use your own Spotify client ID:

```bash
REACT_APP_SPOTIFY_CLIENT_ID=your_spotify_client_id
```

Run the app locally:

```bash
npm start
```

Build for production:

```bash
npm run build
```

## Available Scripts

- `npm start` starts the local development server.
- `npm run build` creates a production build.
- `npm test` runs the React test runner.

## Notes

Spotify apps in development mode can only read data for users added under the app's **Users and Access** settings. If login succeeds but the dashboard cannot read Spotify data, check that the Spotify account has been added there.

## Collaboration

This project was built collaboratively, with work spanning product concept, Spotify integration, scoring logic, error handling, and front-end presentation.
