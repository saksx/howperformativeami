import { PROFILE_LABELS } from "./constants";
import type { ProfileLabel } from "./types";

export function getProfileLabel(score: number): ProfileLabel {
  const match = PROFILE_LABELS.find(
    (entry) => score >= entry.min && score <= entry.max,
  );

  return match ? match.profile : PROFILE_LABELS[PROFILE_LABELS.length - 1].profile;
}
