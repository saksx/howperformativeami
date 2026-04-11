import {
  AESTHETIC_SCORE_THRESHOLD,
  BELL_CURVE_CENTER,
  BELL_CURVE_SPREAD,
  DOMINANT_SIGNAL_CALLOUTS,
  MEGASTAR_THRESHOLD,
  MONUMENT_RATIO_MAX,
  MONUMENT_RATIO_MIN,
  POPULARITY_NORMALIZATION_CEILING,
} from "./constants";
import {
  AESTHETIC_CALLOUT_PRIORITY,
  AESTHETIC_GENRE_CALLOUTS,
  AESTHETIC_IDENTITY_GENRES,
  PRESTIGE_GENRES,
} from "./genres";
import type {
  Artist,
  ArtistClassification,
  DominantSignalKey,
  ScoredArtist,
  SignalBreakdown,
  Track,
  UserData,
} from "./types";

function normalizeGenreName(value: string): string {
  return value.trim().toLowerCase();
}

function hasArtistReference(artistId: string, tracks: Track[]): boolean {
  return tracks.some((track) =>
    track.artists.some((artist) => artist.id === artistId),
  );
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function countInRecentlyPlayed(
  artistId: string,
  recentlyPlayed: Track[],
): number {
  return recentlyPlayed.filter((track) =>
    track.artists.some((artist) => artist.id === artistId),
  ).length;
}

export function countArtistInTopTracksShort(
  artistId: string,
  userData: UserData,
): number {
  return userData.topTracksShort.filter((track) =>
    track.artists.some((artist) => artist.id === artistId),
  ).length;
}

export function countUniqueTracksPlayedByArtist(
  artistId: string,
  recentlyPlayed: Track[],
): number {
  const uniqueTrackKeys = new Set<string>();

  recentlyPlayed.forEach((track, index) => {
    const performedByArtist = track.artists.some((artist) => artist.id === artistId);

    if (!performedByArtist) {
      return;
    }

    uniqueTrackKeys.add(track.id || `${track.name || "unknown-track"}:${index}`);
  });

  return uniqueTrackKeys.size;
}

export function getArtistPool(userData: UserData): Artist[] {
  const artistMap = new Map<string, Artist>();

  const mergeArtist = (existingArtist: Artist | undefined, nextArtist: Artist): Artist => {
    if (!existingArtist) {
      return nextArtist;
    }

    return {
      ...existingArtist,
      ...nextArtist,
      name: nextArtist.name || existingArtist.name,
      popularity: Math.max(existingArtist.popularity || 0, nextArtist.popularity || 0),
      genres:
        nextArtist.genres && nextArtist.genres.length > 0
          ? nextArtist.genres
          : existingArtist.genres,
      followers:
        (nextArtist.followers?.total || 0) >= (existingArtist.followers?.total || 0)
          ? nextArtist.followers
          : existingArtist.followers,
      images:
        nextArtist.images && nextArtist.images.length > 0
          ? nextArtist.images
          : existingArtist.images,
    };
  };

  const addArtists = (artists: Artist[]) => {
    artists.forEach((artist) => {
      if (artist?.id) {
        artistMap.set(artist.id, mergeArtist(artistMap.get(artist.id), artist));
      }
    });
  };

  addArtists(userData.topArtistsShort);
  addArtists(userData.topArtistsMedium);
  addArtists(userData.topArtistsLong);
  addArtists(userData.followedArtists);

  return Array.from(artistMap.values()).filter((artist) => {
    const hasBehaviorSignal =
      countInRecentlyPlayed(artist.id, userData.recentlyPlayed) > 0 ||
      userData.topArtistsShort.some((entry) => entry.id === artist.id) ||
      userData.topArtistsMedium.some((entry) => entry.id === artist.id) ||
      userData.topArtistsLong.some((entry) => entry.id === artist.id) ||
      countArtistInTopTracksShort(artist.id, userData) > 0 ||
      (userData.playlistTrackMap[artist.id] || 0) > 0;
    const hasUsableMetadata =
      artist.popularity > 0 ||
      artist.genres.length > 0 ||
      Boolean(artist.followers?.total) ||
      Boolean(artist.images?.length);

    return hasBehaviorSignal || hasUsableMetadata;
  });
}

export function getMaxRecentPlays(userData: UserData): number {
  const artistPool = getArtistPool(userData);

  if (artistPool.length === 0) {
    return 0;
  }

  return artistPool.reduce(
    (maxRecentPlays, artist) =>
      Math.max(
        maxRecentPlays,
        countInRecentlyPlayed(artist.id, userData.recentlyPlayed),
      ),
    0,
  );
}

export function getGenreMatches(
  genres: string[] | undefined,
  targetGenres: readonly string[],
): string[] {
  if (!genres?.length) {
    return [];
  }

  const normalizedGenres = new Set(genres.map(normalizeGenreName));

  return targetGenres.filter((genre) => normalizedGenres.has(normalizeGenreName(genre)));
}

export function getAveragePopularityInSameGenreCluster(
  artist: Artist,
  allArtists: Artist[],
): number | null {
  const artistGenres = artist.genres?.map(normalizeGenreName) || [];

  if (artistGenres.length === 0) {
    return null;
  }

  const comparableArtists = allArtists.filter((candidate) => {
    if (candidate.id === artist.id) {
      return false;
    }

    const candidateGenres = candidate.genres?.map(normalizeGenreName) || [];
    return candidateGenres.some((genre) => artistGenres.includes(genre));
  });

  if (comparableArtists.length === 0) {
    return null;
  }

  const totalPopularity = comparableArtists.reduce(
    (sum, candidate) => sum + candidate.popularity,
    0,
  );

  return totalPopularity / comparableArtists.length;
}

export function getPrestigeIndex(artist: Artist, allArtists: Artist[]): number {
  const averagePopularity = getAveragePopularityInSameGenreCluster(artist, allArtists);

  if (averagePopularity === null) {
    return 0;
  }

  return artist.popularity - averagePopularity;
}

export function getAestheticScore(popularity: number): number {
  const exponent =
    -Math.pow(popularity - BELL_CURVE_CENTER, 2) /
    (2 * Math.pow(BELL_CURVE_SPREAD, 2));

  return Math.round(100 * Math.exp(exponent));
}

export function isPrestigeArtist(artist: Artist, _allArtists: Artist[]): boolean {
  return getGenreMatches(artist.genres, PRESTIGE_GENRES).length > 0;
}

export function isCulturalMonument(artist: Artist): boolean {
  const followers = artist.followers?.total;

  if (!followers || artist.popularity <= 0) {
    return false;
  }

  const denominator = clamp(artist.popularity * 100000, 1, POPULARITY_NORMALIZATION_CEILING);
  const ratio = followers / denominator;

  return ratio >= MONUMENT_RATIO_MIN && ratio <= MONUMENT_RATIO_MAX;
}

export function getTenureScore(artistId: string, userData: UserData): number {
  const inShort = userData.topArtistsShort.some((artist) => artist.id === artistId);
  const inMedium = userData.topArtistsMedium.some((artist) => artist.id === artistId);
  const inLong = userData.topArtistsLong.some((artist) => artist.id === artistId);

  if (inShort && inMedium && inLong) {
    return 100;
  }

  if (!inShort && inMedium && inLong) {
    return 60;
  }

  if (inShort && inMedium && !inLong) {
    return 40;
  }

  if (!inShort && !inMedium && inLong) {
    return 20;
  }

  if (inShort && !inMedium && !inLong) {
    return 10;
  }

  return 0;
}

export function getObscurityMultipliers(popularity: number): {
  authenticityWeight: number;
  performativeWeight: number;
} {
  if (popularity <= 25) {
    return { authenticityWeight: 2.0, performativeWeight: 0.8 };
  }

  if (popularity <= 45) {
    return { authenticityWeight: 1.6, performativeWeight: 1.5 };
  }

  if (popularity <= 65) {
    return { authenticityWeight: 1.2, performativeWeight: 1.8 };
  }

  if (popularity <= 85) {
    return { authenticityWeight: 0.8, performativeWeight: 1.5 };
  }

  return { authenticityWeight: 0.5, performativeWeight: 0.5 };
}

export function isArtistFollowed(artistId: string, userData: UserData): boolean {
  return userData.followedArtists.some((artist) => artist.id === artistId);
}

export function qualifiesAsAestheticMarker(
  artist: Artist,
  classification: ArtistClassification,
): boolean {
  return (
    classification.archetype === "AESTHETIC_MARKER" &&
    (classification.aestheticScore || 0) >= AESTHETIC_SCORE_THRESHOLD &&
    getGenreMatches(artist.genres, AESTHETIC_IDENTITY_GENRES).length > 0
  );
}

export function getDominantSignal(
  signalBreakdown: SignalBreakdown,
): DominantSignalKey | null {
  const candidates: Array<[DominantSignalKey, number]> = [
    ["neverPlayed", signalBreakdown.neverPlayed],
    ["popularityGap", signalBreakdown.popularityGap],
    ["curationRatio", signalBreakdown.curationRatio],
    ["prestige", signalBreakdown.prestige],
    ["abandoned", signalBreakdown.abandoned],
  ];

  candidates.sort((left, right) => right[1] - left[1]);

  return candidates[0][1] > 0 ? candidates[0][0] : null;
}

export function getCallout(scoredArtist: ScoredArtist): string {
  if (scoredArtist.classification.archetype === "TIKTOK_PIPELINE") {
    return AESTHETIC_GENRE_CALLOUTS.tiktok_pipeline;
  }

  if (scoredArtist.classification.archetype === "AESTHETIC_MARKER") {
    const genreMatch = getGenreMatches(
      scoredArtist.artist.genres,
      AESTHETIC_CALLOUT_PRIORITY,
    )[0];

    if (genreMatch) {
      return AESTHETIC_GENRE_CALLOUTS[genreMatch];
    }
  }

  if (!scoredArtist.dominantSignal) {
    return "";
  }

  return DOMINANT_SIGNAL_CALLOUTS[scoredArtist.dominantSignal];
}

export function hasActualBehaviorSignal(artistId: string, userData: UserData): boolean {
  return (
    countInRecentlyPlayed(artistId, userData.recentlyPlayed) > 0 ||
    userData.topArtistsShort.some((artist) => artist.id === artistId) ||
    hasArtistReference(artistId, userData.topTracksShort)
  );
}

export function isMegastar(artist: Artist): boolean {
  return artist.popularity >= MEGASTAR_THRESHOLD;
}
