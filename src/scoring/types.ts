export interface Artist {
  id: string;
  name: string;
  popularity: number;
  genres: string[];
  followers?: { total?: number };
  images?: Array<{ url: string }>;
}

export interface TrackArtistRef {
  id: string;
  name?: string;
}

export interface Track {
  id?: string;
  name?: string;
  artists: TrackArtistRef[];
}

export interface PlaylistTrackItem {
  track?: Track | null;
}

export interface Playlist {
  id: string;
  public?: boolean | null;
}

export interface UserData {
  topArtistsShort: Artist[];
  topArtistsMedium: Artist[];
  topArtistsLong: Artist[];
  topTracksShort: Track[];
  recentlyPlayed: Track[];
  followedArtists: Artist[];
  playlists: Playlist[];
  playlistTrackMap: Record<string, number>;
}

export type ArtistArchetype =
  | "MEGASTAR"
  | "PRESTIGE_TROPHY"
  | "AESTHETIC_MARKER"
  | "TIKTOK_PIPELINE"
  | "CULT"
  | "UNDERGROUND"
  | "MAINSTREAM";

export interface ArtistClassification {
  archetype: ArtistArchetype;
  performativeWeight: number;
  authenticityWeight: number;
  prestigeIndex?: number;
  aestheticScore?: number;
  isCulturalMonument: boolean;
}

export type DominantSignalKey =
  | "neverPlayed"
  | "popularityGap"
  | "curationRatio"
  | "prestige"
  | "abandoned";

export interface SignalBreakdown {
  neverPlayed: number;
  popularityGap: number;
  curationRatio: number;
  prestige: number;
  abandoned: number;
  authenticityDiscount: number;
  culturalMonumentBonus: number;
  culturalMonumentDiscount: number;
}

export interface ScoredArtist {
  artist: Artist;
  score: number;
  rawScore: number;
  clampedScore: number;
  classification: ArtistClassification;
  recentPlays: number;
  playlistCount: number;
  tenureScore: number;
  authenticityScore: number;
  dominantSignal: DominantSignalKey | null;
  signalBreakdown: SignalBreakdown;
  callout: string;
}

export interface ProfileLabel {
  label: string;
  subtitle: string;
  color: string;
}

export interface PerformativityResult {
  overallScore: number;
  profile: ProfileLabel;
  stats: {
    totalAnalyzed: number;
    performativeCount: number;
    authenticCount: number;
    ghostCount: number;
    performativePercent: number;
    avgMainstreamScore: number;
    topPerformative: ScoredArtist[];
    topAuthentic: ScoredArtist[];
  };
  scoredArtists: ScoredArtist[];
}
