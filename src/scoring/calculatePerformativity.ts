import { POPULARITY_WEIGHT_SCALE } from "./constants";
import { getArtistPool, getMaxRecentPlays, isArtistFollowed } from "./helpers";
import { getProfileLabel } from "./profile";
import { scoreArtist } from "./scoreArtist";
import type { PerformativityResult, ScoredArtist, UserData } from "./types";

export function calculateOverallScore(scoredArtists: ScoredArtist[]): number {
  if (scoredArtists.length === 0) {
    return 0;
  }

  let weightedScoreTotal = 0;
  let totalWeight = 0;

  scoredArtists.forEach((scoredArtist) => {
    const weight = 0.5 + scoredArtist.artist.popularity / POPULARITY_WEIGHT_SCALE;
    weightedScoreTotal += scoredArtist.score * weight;
    totalWeight += weight;
  });

  return totalWeight === 0 ? 0 : Math.round(weightedScoreTotal / totalWeight);
}

export function calculatePerformativity(
  userData: UserData,
): PerformativityResult {
  const artistPool = getArtistPool(userData);

  if (artistPool.length === 0) {
    return {
      overallScore: 0,
      profile: getProfileLabel(0),
      stats: {
        totalAnalyzed: 0,
        performativeCount: 0,
        authenticCount: 0,
        ghostCount: 0,
        performativePercent: 0,
        avgMainstreamScore: 0,
        topPerformative: [],
        topAuthentic: [],
      },
      scoredArtists: [],
    };
  }

  const maxRecentPlays = getMaxRecentPlays(userData);
  const scoredArtists = artistPool
    .map((artist) => scoreArtist(artist, userData, artistPool, maxRecentPlays))
    .sort((left, right) => right.score - left.score);

  const overallScore = calculateOverallScore(scoredArtists);
  const performativeCount = scoredArtists.filter((artist) => artist.score >= 50).length;
  const authenticCount = scoredArtists.filter((artist) => artist.score < 30).length;
  const ghostCount = scoredArtists.filter(
    (artist) => isArtistFollowed(artist.artist.id, userData) && artist.recentPlays === 0,
  ).length;
  const mainstreamArtists = scoredArtists.filter(
    (artist) => artist.artist.popularity >= 66,
  );
  const avgMainstreamScore =
    mainstreamArtists.length === 0
      ? 0
      : Math.round(
          mainstreamArtists.reduce((sum, artist) => sum + artist.score, 0) /
            mainstreamArtists.length,
        );

  return {
    overallScore,
    profile: getProfileLabel(overallScore),
    stats: {
      totalAnalyzed: scoredArtists.length,
      performativeCount,
      authenticCount,
      ghostCount,
      performativePercent:
        scoredArtists.length === 0
          ? 0
          : Math.round((performativeCount / scoredArtists.length) * 100),
      avgMainstreamScore,
      topPerformative: scoredArtists.slice(0, 5),
      topAuthentic: [...scoredArtists]
        .sort((left, right) => left.score - right.score)
        .slice(0, 5),
    },
    scoredArtists,
  };
}
