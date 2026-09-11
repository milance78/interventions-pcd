import type { Intervention } from "./types";
import { getCanonicalDraftState } from "./draftState";

export type DraftPresentation = "none" | "displayed" | "displaced";

/** Pure selectors for the explicit draft state-machine. */
export const getDraftPresentation = (intervention: Intervention): DraftPresentation => {
  const draftState = getCanonicalDraftState(intervention);
  if (draftState.active) return "displayed";
  if (draftState.displaced) return "displaced";
  return "none";
};

export const hasDisplacedDraft = (intervention: Intervention) =>
  getDraftPresentation(intervention) === "displaced";

export const isDisplayedDraft = (intervention: Intervention) =>
  getDraftPresentation(intervention) === "displayed";
