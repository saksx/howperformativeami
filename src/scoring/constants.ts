import type { DominantSignalKey, ProfileLabel } from "./types";

export const MEGASTAR_THRESHOLD = 88;
export const PRESTIGE_INDEX_THRESHOLD = 15;
export const AESTHETIC_SCORE_THRESHOLD = 25;
export const BELL_CURVE_CENTER = 60;
export const BELL_CURVE_SPREAD = 25;
export const MONUMENT_RATIO_MIN = 1.5;
export const MONUMENT_RATIO_MAX = 6.0;
export const POPULARITY_NORMALIZATION_CEILING = 100000000;
export const PLAYLIST_FETCH_LIMIT = 10;
export const PRESTIGE_MAX_PLAYS_FOR_SIGNAL = 3;
export const UNDERGROUND_MAX_POPULARITY = 25;
export const UNDERGROUND_MIN_PLAYS = 4;
export const ONE_SONG_UNIQUE_TRACK_LIMIT = 1;
export const POPULARITY_WEIGHT_SCALE = 200;

export const PROFILE_LABELS: Array<{
  min: number;
  max: number;
  profile: ProfileLabel;
}> = [
  {
    min: 0,
    max: 15,
    profile: {
      label: "PURE LISTENER",
      subtitle: "You don't care what anyone thinks. Genuinely rare.",
      color: "#46d98a",
    },
  },
  {
    min: 16,
    max: 30,
    profile: {
      label: "LOW KEY AUTHENTIC",
      subtitle: "A little self-aware, but mostly just vibing.",
      color: "#7adf93",
    },
  },
  {
    min: 31,
    max: 45,
    profile: {
      label: "CASUALLY CURATED",
      subtitle: "Your library has opinions. So do you, mostly.",
      color: "#c8dc69",
    },
  },
  {
    min: 46,
    max: 60,
    profile: {
      label: "THE VIBE ARCHITECT",
      subtitle: "Your Spotify is a mood board, not a music player.",
      color: "#f0c85c",
    },
  },
  {
    min: 61,
    max: 75,
    profile: {
      label: "CHRONICALLY ONLINE",
      subtitle: "Your library is your personality. Seek help.",
      color: "#f09b54",
    },
  },
  {
    min: 76,
    max: 90,
    profile: {
      label: "THE TROPHY HUNTER",
      subtitle: "You collect artists the way others collect vinyl.",
      color: "#e15a55",
    },
  },
  {
    min: 91,
    max: 100,
    profile: {
      label: "THE MUSEUM CURATOR",
      subtitle: "Your library is a monument. Nobody visits.",
      color: "#ca3f4d",
    },
  },
];

export const DOMINANT_SIGNAL_CALLOUTS: Record<DominantSignalKey, string> = {
  neverPlayed: "You follow them. You've never actually played them.",
  popularityGap: "Global superstar. Barely touches your speakers.",
  curationRatio: "Lives in your playlists. Never in your ears.",
  prestige: "Classic trophy artist. We see you.",
  abandoned: "You used to listen. Now they're just on the shelf.",
};
