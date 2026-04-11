import type {
  Artist,
  Playlist,
  PlaylistTrackItem,
  Track,
  UserData,
} from "../scoring/types";

interface SpotifyImage {
  url: string;
}

interface SpotifyArtist {
  id: string;
  name: string;
  popularity: number;
  genres?: string[];
  followers?: { total?: number };
  images?: SpotifyImage[];
}

interface SpotifyTrackArtist {
  id: string;
  name?: string;
}

interface SpotifyTrack {
  id?: string;
  name?: string;
  artists?: SpotifyTrackArtist[];
}

interface SpotifyPlaylist {
  id: string;
  public?: boolean | null;
}

interface SpotifyRecentlyPlayedItem {
  track?: SpotifyTrack | null;
}

interface SpotifyTopArtistsResponse {
  items?: SpotifyArtist[];
}

interface SpotifyTopTracksResponse {
  items?: SpotifyTrack[];
}

interface SpotifyRecentlyPlayedResponse {
  items?: SpotifyRecentlyPlayedItem[];
}

interface SpotifyFollowingResponse {
  artists?: {
    items?: SpotifyArtist[];
  };
}

interface SpotifyPlaylistsResponse {
  items?: SpotifyPlaylist[];
}

function normalizePopularity(popularity: number | undefined): number {
  return typeof popularity === "number" && Number.isFinite(popularity)
    ? popularity
    : 50;
}

export interface NormalizedSpotifyPayload {
  topArtistsShort: SpotifyTopArtistsResponse;
  topArtistsMedium: SpotifyTopArtistsResponse;
  topArtistsLong: SpotifyTopArtistsResponse;
  topTracksShort: SpotifyTopTracksResponse;
  recentlyPlayed: SpotifyRecentlyPlayedResponse;
  followedArtists: SpotifyFollowingResponse;
  playlists: SpotifyPlaylistsResponse;
  playlistTracks: PlaylistTrackItem[][];
}

function normalizeArtist(artist: SpotifyArtist): Artist {
  return {
    id: artist.id,
    name: artist.name,
    popularity: normalizePopularity(artist.popularity),
    genres: artist.genres ?? [],
    followers: artist.followers,
    images: artist.images,
  };
}

function normalizeTrack(track: SpotifyTrack | null | undefined): Track | null {
  if (!track?.artists?.length) {
    return null;
  }

  return {
    id: track.id,
    name: track.name,
    artists: track.artists.map((artist) => ({
      id: artist.id,
      name: artist.name,
    })),
  };
}

function normalizePlaylist(playlist: SpotifyPlaylist): Playlist {
  return {
    id: playlist.id,
    public: playlist.public,
  };
}

function buildPlaylistTrackMap(playlistTracks: PlaylistTrackItem[][]): Record<string, number> {
  return playlistTracks.reduce<Record<string, number>>((artistMap, playlistItems) => {
    playlistItems.forEach((item) => {
      item.track?.artists.forEach((artist) => {
        artistMap[artist.id] = (artistMap[artist.id] || 0) + 1;
      });
    });

    return artistMap;
  }, {});
}

export function normalizeSpotifyData(payload: NormalizedSpotifyPayload): UserData {
  const topArtistsShort = (payload.topArtistsShort.items || []).map(normalizeArtist);
  const topArtistsMedium = (payload.topArtistsMedium.items || []).map(normalizeArtist);
  const topArtistsLong = (payload.topArtistsLong.items || []).map(normalizeArtist);
  const topTracksShort = (payload.topTracksShort.items || [])
    .map(normalizeTrack)
    .filter((track): track is Track => Boolean(track));
  const recentlyPlayed = (payload.recentlyPlayed.items || [])
    .map((item) => normalizeTrack(item.track))
    .filter((track): track is Track => Boolean(track));
  const followedArtists = (payload.followedArtists.artists?.items || []).map(normalizeArtist);
  const playlists = (payload.playlists.items || []).map(normalizePlaylist);
  const normalizedPlaylistTracks = payload.playlistTracks.map((playlistItems) =>
    playlistItems
      .map((item) => ({
        track: normalizeTrack(item.track),
      }))
      .filter(
        (item): item is PlaylistTrackItem & { track: Track } => Boolean(item.track),
      ),
  );

  return {
    topArtistsShort,
    topArtistsMedium,
    topArtistsLong,
    topTracksShort,
    recentlyPlayed,
    followedArtists,
    playlists,
    playlistTrackMap: buildPlaylistTrackMap(normalizedPlaylistTracks),
  };
}
