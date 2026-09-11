import type { Intervention, InterventionData, InterventionMode, DraftRecord, DraftState } from "./types";
import { emptyInterventionData } from "./defaults";
import { extractData, hasMeaningfulDraft, isSameInterventionData } from "./draft";

export const emptyDraftState = (): DraftState => ({
  active: null,
  displaced: null,
});

const normalizeSnapshot = (snapshot: InterventionData): InterventionData => ({
  ...snapshot,
  documentId: "",
  createdAt: null,
  updatedAt: null,
  dateKey: undefined,
});

export const makeDraftRecord = (
  snapshot: InterventionData,
  mode: InterventionMode,
  editSnapshot: InterventionData | null = null,
): DraftRecord => ({
  snapshot: normalizeSnapshot(snapshot),
  mode,
  editSnapshot,
});

/**
 * Migrates the pre-refactor draft fields to the explicit two-slot model.
 * This is only a compatibility boundary; new code should use draftState.
 */
export const migrateLegacyDraftState = (state: Intervention): DraftState => {
  const current = state.draftSnapshot && hasMeaningfulDraft(state.draftSnapshot)
    ? makeDraftRecord(
        state.draftSnapshot,
        state.draftMode ?? "DRAFT",
        state.draftEditSnapshot,
      )
    : null;

  if (!state.hasDraft || !current) return emptyDraftState();

  const displayed = isSameInterventionData(state, current.snapshot);
  return displayed
    ? { active: current, displaced: null }
    : { active: null, displaced: current };
};

/**
 * Returns the canonical draft state for a Redux state, transparently
 * supporting sessions created before the draft state-machine refactor.
 */
export const getCanonicalDraftState = (state: Intervention): DraftState => {
  if (state.draftState) return state.draftState;
  return migrateLegacyDraftState(state);
};

/**
 * Captures the draft currently being edited before navigation to another
 * intervention. The captured draft becomes displaced, never active, because
 * the destination intervention will occupy Current Intervention.
 */
export const captureDraftBeforeNavigation = (state: Intervention): DraftState => {
  const currentDraftState = getCanonicalDraftState(state);

  if (state.mode === "NEW" || state.mode === "DRAFT") {
    if (currentDraftState.active) {
      return {
        active: null,
        displaced: currentDraftState.active,
      };
    }
    const current = extractData(state);
    return hasMeaningfulDraft(current)
      ? { active: null, displaced: makeDraftRecord(current, "DRAFT") }
      : currentDraftState;
  }

  if (state.mode !== "VIEW_HISTORY" && state.editSnapshot) {
    const current = extractData(state);
    if (!isSameInterventionData(current, state.editSnapshot)) {
      return {
        active: null,
        displaced: makeDraftRecord(current, state.mode, state.editSnapshot),
      };
    }
  }

  return currentDraftState;
};

/**
 * Rebuilds the active draft after a field mutation. Any displaced draft is
 * intentionally preserved: it represents a different draft that can still be
 * resumed with the Brouillon action.
 */
export const refreshDraftState = (state: Intervention): DraftState => {
  const currentDraftState = getCanonicalDraftState(state);
  const current = extractData(state);

  if (state.mode === "NEW" || state.mode === "DRAFT") {
    if (!hasMeaningfulDraft(current)) {
      return { active: null, displaced: currentDraftState.displaced };
    }
    return {
      active: makeDraftRecord(current, "DRAFT"),
      displaced: currentDraftState.displaced,
    };
  }

  if (state.mode === "VIEW_HISTORY" || !state.editSnapshot) {
    return currentDraftState;
  }

  if (!isSameInterventionData(current, state.editSnapshot)) {
    return {
      active: makeDraftRecord(current, state.mode, state.editSnapshot),
      displaced: currentDraftState.displaced,
    };
  }

  return {
    active: null,
    displaced: currentDraftState.displaced,
  };
};

export const resumeDisplacedDraft = (state: Intervention): Intervention => {
  const draftState = getCanonicalDraftState(state);
  const displaced = draftState.displaced;
  if (!displaced || !hasMeaningfulDraft(displaced.snapshot)) {
    return {
      ...state,
      draftState,
      draftSnapshot: null,
      draftMode: null,
      draftEditSnapshot: null,
      hasDraft: Boolean(draftState.active),
    };
  }

  const isEditMode =
    displaced.mode === "TODAY_EDIT" ||
    displaced.mode === "HISTORY_EDIT" ||
    displaced.mode === "SEARCH_EDIT";

  return {
    ...emptyInterventionData,
    ...displaced.snapshot,
    isEditing: isEditMode,
    isHistoryView: false,
    mode: displaced.mode,
    editSnapshot: isEditMode ? displaced.editSnapshot : null,
    draftState: { active: displaced, displaced: null },
    // Legacy mirrors are kept for persisted sessions created by older builds.
    draftSnapshot: displaced.snapshot,
    draftMode: displaced.mode,
    draftEditSnapshot: displaced.editSnapshot,
    hasDraft: true,
  };
};
