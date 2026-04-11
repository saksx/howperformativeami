import { calculatePerformativity } from "./calculatePerformativity";
import type { Artist, Track, UserData } from "./types";

function createArtist(overrides: Partial<Artist> & Pick<Artist, "id" | "name">): Artist {
  return {
    popularity: 50,
    genres: [],
    followers: { total: 100000 },
    images: [],
    ...overrides,
  };
}

function createTrack(artist: Artist, id: string, name = id): Track {
  return {
    id,
    name,
    artists: [{ id: artist.id, name: artist.name }],
  };
}

function createUserData(overrides: Partial<UserData>): UserData {
  return {
    topArtistsShort: [],
    topArtistsMedium: [],
    topArtistsLong: [],
    topTracksShort: [],
    recentlyPlayed: [],
    followedArtists: [],
    playlists: [],
    playlistTrackMap: {},
    ...overrides,
  };
}

function expect(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

export function runExampleTests(): void {
  const megastar = createArtist({
    id: "mega",
    name: "Megastar",
    popularity: 95,
    genres: ["pop"],
  });
  const prestige = createArtist({
    id: "prestige",
    name: "Prestige Trophy",
    popularity: 72,
    genres: ["art rock"],
  });
  const underground = createArtist({
    id: "underground",
    name: "Underground Hero",
    popularity: 18,
    genres: ["noise rock"],
  });
  const tiktok = createArtist({
    id: "tiktok",
    name: "Pipeline Artist",
    popularity: 60,
    genres: ["bedroom pop"],
  });
  const monument = createArtist({
    id: "monument",
    name: "Monument Band",
    popularity: 80,
    genres: ["rock"],
    followers: { total: 20000000 },
  });
  const abandoned = createArtist({
    id: "abandoned",
    name: "Shelf Artist",
    popularity: 55,
    genres: ["indie rock"],
  });
  const peerA = createArtist({
    id: "peer-a",
    name: "Peer A",
    popularity: 48,
    genres: ["art rock"],
  });
  const peerB = createArtist({
    id: "peer-b",
    name: "Peer B",
    popularity: 50,
    genres: ["art rock"],
  });

  const userData = createUserData({
    topArtistsShort: [underground, monument],
    topArtistsMedium: [underground, monument],
    topArtistsLong: [prestige, underground, monument, abandoned, peerA, peerB],
    topTracksShort: [createTrack(underground, "u-1"), createTrack(monument, "m-1")],
    recentlyPlayed: [
      createTrack(underground, "u-1"),
      createTrack(underground, "u-2"),
      createTrack(underground, "u-3"),
      createTrack(underground, "u-4"),
      createTrack(monument, "m-1"),
      createTrack(monument, "m-2"),
      createTrack(monument, "m-3"),
      createTrack(monument, "m-4"),
      createTrack(tiktok, "t-1"),
    ],
    followedArtists: [megastar, prestige, tiktok, monument, abandoned],
    playlistTrackMap: {
      mega: 6,
      prestige: 4,
      tiktok: 5,
      abandoned: 2,
    },
  });

  const result = calculatePerformativity(userData);
  const findById = (id: string) => result.scoredArtists.find((entry) => entry.artist.id === id);

  const megastarResult = findById("mega");
  const prestigeResult = findById("prestige");
  const undergroundResult = findById("underground");
  const tiktokResult = findById("tiktok");
  const monumentResult = findById("monument");
  const abandonedResult = findById("abandoned");

  expect(Boolean(megastarResult), "Megastar scenario should produce a scored artist.");
  expect(
    megastarResult?.classification.archetype === "MEGASTAR",
    "Megastar followed but never played should classify as MEGASTAR.",
  );

  expect(Boolean(prestigeResult), "Prestige scenario should produce a scored artist.");
  expect(
    prestigeResult?.classification.archetype === "PRESTIGE_TROPHY",
    "Prestige trophy should classify as PRESTIGE_TROPHY.",
  );
  expect(
    prestigeResult?.signalBreakdown.neverPlayed === 40,
    "Prestige trophy followed but never played should hit neverPlayed.",
  );

  expect(Boolean(undergroundResult), "Underground scenario should produce a scored artist.");
  expect(
    undergroundResult?.classification.archetype === "UNDERGROUND",
    "Underground artist should classify as UNDERGROUND.",
  );
  expect(
    undergroundResult?.signalBreakdown.authenticityDiscount === -25,
    "Heavily played underground artist should receive authenticity discount.",
  );

  expect(Boolean(tiktokResult), "TikTok scenario should produce a scored artist.");
  expect(
    tiktokResult?.classification.archetype === "TIKTOK_PIPELINE",
    "One-song followed aesthetic artist should classify as TIKTOK_PIPELINE.",
  );

  expect(Boolean(monumentResult), "Cultural monument scenario should produce a scored artist.");
  expect(
    monumentResult?.classification.isCulturalMonument === true,
    "Cultural monument artist should set the independent monument flag.",
  );
  expect(
    monumentResult?.signalBreakdown.culturalMonumentDiscount === -20,
    "Frequently played monument should receive the authenticity monument discount.",
  );

  expect(Boolean(abandonedResult), "Abandoned scenario should produce a scored artist.");
  expect(
    abandonedResult?.signalBreakdown.abandoned === 15,
    "Long-term artist absent from short-term should get abandoned signal.",
  );

  expect(result.stats.totalAnalyzed >= 6, "Example fixtures should analyze multiple artists.");
}
