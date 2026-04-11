import {
  PRESTIGE_MAX_PLAYS_FOR_SIGNAL,
  UNDERGROUND_MAX_POPULARITY,
  UNDERGROUND_MIN_PLAYS,
} from "./constants";
import { classifyArtist } from "./classifyArtist";
import {
  clamp,
  countArtistInTopTracksShort,
  countInRecentlyPlayed,
  getCallout,
  getDominantSignal,
  getTenureScore,
  isPrestigeArtist,
} from "./helpers";
import type { Artist, ScoredArtist, SignalBreakdown, UserData } from "./types";

export function scoreArtist(
  artist: Artist,
  userData: UserData,
  allArtists: Artist[],
  maxRecentPlays: number,
): ScoredArtist {
  const classification = classifyArtist(artist, userData, allArtists);
  const recentPlays = countInRecentlyPlayed(artist.id, userData.recentlyPlayed);
  const playlistCount = userData.playlistTrackMap[artist.id] || 0;
  const tenureScore = getTenureScore(artist.id, userData);
  const authenticityScore = Math.min(
    100,
    Math.round(tenureScore * classification.authenticityWeight),
  );
  const inShort = userData.topArtistsShort.some((candidate) => candidate.id === artist.id);
  const inLong = userData.topArtistsLong.some((candidate) => candidate.id === artist.id);
  const shortTrackCount = countArtistInTopTracksShort(artist.id, userData);

  const neverPlayed =
    recentPlays === 0 && !inShort && shortTrackCount === 0 ? 40 : 0;

  const normalizedPop = artist.popularity / 100;
  const normalizedFreq = recentPlays / Math.max(maxRecentPlays, 1);
  const popularityGap = Math.round(
    Math.max(0, normalizedPop - normalizedFreq) * 30,
  );

  const curationRatio = playlistCount / (recentPlays + 1);
  const curationRatioScore = Math.min(Math.round(curationRatio * 6), 20);

  const prestige =
    isPrestigeArtist(artist, allArtists) &&
    recentPlays < PRESTIGE_MAX_PLAYS_FOR_SIGNAL
      ? 15
      : 0;

  const abandoned = inLong && !inShort ? 15 : 0;

  const authenticityDiscount =
    artist.popularity < UNDERGROUND_MAX_POPULARITY &&
    recentPlays >= UNDERGROUND_MIN_PLAYS
      ? -25
      : 0;

  const rawScore =
    neverPlayed +
    popularityGap +
    curationRatioScore +
    prestige +
    abandoned +
    authenticityDiscount;

  const clampedScore = clamp(rawScore, 0, 100);
  const weightedScore = clampedScore * classification.performativeWeight;
  const culturalMonumentBonus =
    classification.isCulturalMonument && recentPlays === 0 ? 20 : 0;
  const culturalMonumentDiscount =
    classification.isCulturalMonument && recentPlays >= 4 ? -20 : 0;
  const score = clamp(
    Math.round(
      weightedScore + culturalMonumentBonus + culturalMonumentDiscount,
    ),
    0,
    100,
  );

  const signalBreakdown: SignalBreakdown = {
    neverPlayed,
    popularityGap,
    curationRatio: curationRatioScore,
    prestige,
    abandoned,
    authenticityDiscount,
    culturalMonumentBonus,
    culturalMonumentDiscount,
  };

  const dominantSignal = getDominantSignal(signalBreakdown);
  const scoredArtist: ScoredArtist = {
    artist,
    score,
    rawScore,
    clampedScore,
    classification,
    recentPlays,
    playlistCount,
    tenureScore,
    authenticityScore,
    dominantSignal,
    signalBreakdown,
    callout: "",
  };

  return {
    ...scoredArtist,
    callout: getCallout(scoredArtist),
  };
}
