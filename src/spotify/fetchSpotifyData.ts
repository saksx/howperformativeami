import { PLAYLIST_FETCH_LIMIT } from "../scoring/constants";
import type { PlaylistTrackItem, UserData } from "../scoring/types";
import {
  normalizeSpotifyData,
  type NormalizedSpotifyPayload,
} from "./normalizeSpotifyData";

const SPOTIFY_BASE_URL = "https://api.spotify.com/v1";
const SESSION_CACHE_PREFIX = "spotify-cache:v2:";
const PLAYLIST_DELAY_MS = 100;
const MAX_RETRIES = 5;

interface FetchSpotifyDataOptions {
  fetchImpl?: typeof fetch;
  cache?: boolean;
}

function getSessionStorage(): Storage | null {
  if (typeof sessionStorage === "undefined") {
    return null;
  }

  return sessionStorage;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function getCacheKey(endpoint: string): string {
  return `${SESSION_CACHE_PREFIX}${endpoint}`;
}

export function clearSpotifyFetchCache(): void {
  const storage = getSessionStorage();

  if (!storage) {
    return;
  }

  const keysToRemove: string[] = [];

  for (let index = 0; index < storage.length; index += 1) {
    const key = storage.key(index);

    if (key?.startsWith(SESSION_CACHE_PREFIX)) {
      keysToRemove.push(key);
    }
  }

  keysToRemove.forEach((key) => storage.removeItem(key));
}

async function fetchWithRetry<T>(
  endpoint: string,
  accessToken: string,
  fetchImpl: typeof fetch,
  cache: boolean,
  attempt = 0,
): Promise<T> {
  const storage = getSessionStorage();
  const cacheKey = getCacheKey(endpoint);

  if (cache) {
    const cachedValue = storage?.getItem(cacheKey);

    if (cachedValue) {
      return JSON.parse(cachedValue) as T;
    }
  }

  const response = await fetchImpl(`${SPOTIFY_BASE_URL}${endpoint}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (response.status === 429 && attempt < MAX_RETRIES) {
    const retryAfterSeconds = Number(response.headers.get("Retry-After") || "0");
    const backoffMs =
      retryAfterSeconds > 0 ? retryAfterSeconds * 1000 : Math.pow(2, attempt) * 500;

    await delay(backoffMs);
    return fetchWithRetry<T>(endpoint, accessToken, fetchImpl, cache, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(`Spotify API error: ${response.status} on ${endpoint}`);
  }

  const data = (await response.json()) as T;

  if (cache) {
    storage?.setItem(cacheKey, JSON.stringify(data));
  }

  return data;
}

async function fetchPlaylistTracks(
  playlistIds: string[],
  accessToken: string,
  fetchImpl: typeof fetch,
  cache: boolean,
): Promise<PlaylistTrackItem[][]> {
  const collectedTracks: PlaylistTrackItem[][] = [];

  for (const playlistId of playlistIds) {
    try {
      const playlistTrackResponse = await fetchWithRetry<{ items?: PlaylistTrackItem[] }>(
        `/playlists/${playlistId}/items?limit=50`,
        accessToken,
        fetchImpl,
        cache,
      );

      collectedTracks.push(playlistTrackResponse.items || []);
    } catch (_error) {
      collectedTracks.push([]);
    }

    await delay(PLAYLIST_DELAY_MS);
  }

  return collectedTracks;
}

export async function fetchSpotifyData(
  accessToken: string,
  options: FetchSpotifyDataOptions = {},
): Promise<UserData> {
  const fetchImpl = options.fetchImpl || fetch;
  const cache = options.cache ?? true;

  const [
    topArtistsShort,
    topArtistsMedium,
    topArtistsLong,
    topTracksShort,
    recentlyPlayed,
    followedArtists,
    playlists,
  ] = await Promise.all([
    fetchWithRetry<NormalizedSpotifyPayload["topArtistsShort"]>(
      "/me/top/artists?time_range=short_term&limit=50",
      accessToken,
      fetchImpl,
      cache,
    ),
    fetchWithRetry<NormalizedSpotifyPayload["topArtistsMedium"]>(
      "/me/top/artists?time_range=medium_term&limit=50",
      accessToken,
      fetchImpl,
      cache,
    ),
    fetchWithRetry<NormalizedSpotifyPayload["topArtistsLong"]>(
      "/me/top/artists?time_range=long_term&limit=50",
      accessToken,
      fetchImpl,
      cache,
    ),
    fetchWithRetry<NormalizedSpotifyPayload["topTracksShort"]>(
      "/me/top/tracks?time_range=short_term&limit=50",
      accessToken,
      fetchImpl,
      cache,
    ),
    fetchWithRetry<NormalizedSpotifyPayload["recentlyPlayed"]>(
      "/me/player/recently-played?limit=50",
      accessToken,
      fetchImpl,
      cache,
    ),
    fetchWithRetry<NormalizedSpotifyPayload["followedArtists"]>(
      "/me/following?type=artist&limit=50",
      accessToken,
      fetchImpl,
      cache,
    ),
    fetchWithRetry<NormalizedSpotifyPayload["playlists"]>(
      "/me/playlists?limit=50",
      accessToken,
      fetchImpl,
      cache,
    ),
  ]);

  const playlistIds = (playlists.items || [])
    .slice(0, PLAYLIST_FETCH_LIMIT)
    .map((playlist) => playlist.id);
  const playlistTracks = await fetchPlaylistTracks(
    playlistIds,
    accessToken,
    fetchImpl,
    cache,
  );

  return normalizeSpotifyData({
    topArtistsShort,
    topArtistsMedium,
    topArtistsLong,
    topTracksShort,
    recentlyPlayed,
    followedArtists,
    playlists,
    playlistTracks,
  });
}
