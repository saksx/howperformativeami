import {
  AESTHETIC_SCORE_THRESHOLD,
  MEGASTAR_THRESHOLD,
  ONE_SONG_UNIQUE_TRACK_LIMIT,
  PRESTIGE_INDEX_THRESHOLD,
} from "./constants";
import {
  countUniqueTracksPlayedByArtist,
  getAestheticScore,
  getGenreMatches,
  getObscurityMultipliers,
  getPrestigeIndex,
  isArtistFollowed,
  isCulturalMonument,
} from "./helpers";
import { AESTHETIC_IDENTITY_GENRES } from "./genres";
import type { Artist, ArtistClassification, UserData } from "./types";

export function classifyArtist(
  artist: Artist,
  userData: UserData,
  allArtists: Artist[],
): ArtistClassification {
  const isMonument = isCulturalMonument(artist);
  const aestheticScore = getAestheticScore(artist.popularity);
  const prestigeIndex = getPrestigeIndex(artist, allArtists);
  const aestheticMatches = getGenreMatches(artist.genres, AESTHETIC_IDENTITY_GENRES);
  const uniqueRecentTracks = countUniqueTracksPlayedByArtist(
    artist.id,
    userData.recentlyPlayed,
  );
  const isFollowed = isArtistFollowed(artist.id, userData);

  if (artist.popularity >= MEGASTAR_THRESHOLD) {
    return {
      archetype: "MEGASTAR",
      performativeWeight: 0.5,
      authenticityWeight: 0.5,
      prestigeIndex,
      aestheticScore,
      isCulturalMonument: isMonument,
    };
  }

  if (
    artist.popularity >= 50 &&
    artist.popularity <= 87 &&
    prestigeIndex >= PRESTIGE_INDEX_THRESHOLD
  ) {
    return {
      archetype: "PRESTIGE_TROPHY",
      performativeWeight: 1.8,
      authenticityWeight: 1.2,
      prestigeIndex,
      aestheticScore,
      isCulturalMonument: isMonument,
    };
  }

  if (
    aestheticScore >= AESTHETIC_SCORE_THRESHOLD &&
    isFollowed &&
    uniqueRecentTracks <= ONE_SONG_UNIQUE_TRACK_LIMIT
  ) {
    return {
      archetype: "TIKTOK_PIPELINE",
      performativeWeight: 2.0,
      authenticityWeight: 1.2,
      prestigeIndex,
      aestheticScore,
      isCulturalMonument: isMonument,
    };
  }

  if (
    aestheticScore >= AESTHETIC_SCORE_THRESHOLD &&
    aestheticMatches.length > 0
  ) {
    return {
      archetype: "AESTHETIC_MARKER",
      performativeWeight: 1.9,
      authenticityWeight: 1.2,
      prestigeIndex,
      aestheticScore,
      isCulturalMonument: isMonument,
    };
  }

  if (artist.popularity >= 20 && artist.popularity <= 49) {
    return {
      archetype: "CULT",
      performativeWeight: 1.5,
      authenticityWeight: 1.8,
      prestigeIndex,
      aestheticScore,
      isCulturalMonument: isMonument,
    };
  }

  if (artist.popularity < 20) {
    return {
      archetype: "UNDERGROUND",
      performativeWeight: 0.8,
      authenticityWeight: 2.0,
      prestigeIndex,
      aestheticScore,
      isCulturalMonument: isMonument,
    };
  }

  const mainstreamWeights =
    artist.popularity >= 66 && artist.popularity <= 85
      ? { performativeWeight: 1.5, authenticityWeight: 0.8 }
      : getObscurityMultipliers(artist.popularity);

  return {
    archetype: "MAINSTREAM",
    performativeWeight: mainstreamWeights.performativeWeight,
    authenticityWeight: mainstreamWeights.authenticityWeight,
    prestigeIndex,
    aestheticScore,
    isCulturalMonument: isMonument,
  };
}
