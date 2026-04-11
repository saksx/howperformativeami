export const PRESTIGE_GENRES = [
  "art rock",
  "post-punk",
  "avant-garde",
  "noise rock",
  "shoegaze",
  "krautrock",
  "experimental",
  "free jazz",
  "darkwave",
  "drone",
  "witch house",
  "lowercase",
  "industrial",
  "ambient",
  "neoclassical",
  "post-rock",
  "math rock",
  "chamber pop",
  "left-field",
  "glitch",
  "idm",
] as const;

export const AESTHETIC_IDENTITY_GENRES = [
  "bedroom pop",
  "lo-fi indie",
  "dream pop",
  "indie pop",
  "alt z",
  "indie rock",
  "noise pop",
  "shoegaze",
  "emo",
  "midwest emo",
  "sadcore",
  "indie emo",
  "hyperpop",
  "digicore",
  "bubblegum bass",
  "nu jazz",
  "jazz pop",
  "contemporary jazz",
  "folk pop",
  "indie folk",
  "chamber folk",
  "pov: indie",
  "chicago indie",
] as const;

export const AESTHETIC_CALLOUT_PRIORITY = [
  "bedroom pop",
  "indie pop",
  "indie folk",
  "indie rock",
  "emo",
  "hyperpop",
] as const;

export const AESTHETIC_GENRE_CALLOUTS: Record<string, string> = {
  "bedroom pop":
    "This is the aesthetic. You curated this for someone to see.",
  "indie pop": "An indie pop personality. Very on brand for you.",
  "indie folk": "The Phoebe Bridgers of it all. Very on brand.",
  "indie rock":
    "Alt starter pack energy. We're not judging. We're noting.",
  emo: "The sad indie cred is showing.",
  hyperpop: "Internet-brained taste. Deeply online energy.",
  tiktok_pipeline:
    "You found them on TikTok. Saved them. Haven't played them since.",
};
