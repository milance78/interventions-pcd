import type {
  AddressConfirmation,
  Intervention,
  InterventionData,
  InterventionMode,
} from "./types";
import { emptyInterventionData, loadSmsPreference } from "./defaults";
import { extractData, hasMeaningfulDraft, isSameInterventionData } from "./draft";
import {
  captureDraftBeforeNavigation,
  emptyDraftState,
  getCanonicalDraftState,
  resumeDisplacedDraft,
} from "./draftState";
import { normalizePersonName, parseLegacyAddressClients, serializeAddressClients } from "../../utils/addressClients";
import { composeMainAddress, normalizeNaNumber, parseMainAddress } from "../../utils/interventionAddress";

const withLegacyDraftMirrors = (state: Intervention, draftState = getCanonicalDraftState(state)): Intervention => ({
  ...state,
  draftState,
  draftSnapshot: draftState.displaced?.snapshot ?? null,
  draftMode: draftState.displaced?.mode ?? null,
  draftEditSnapshot: draftState.displaced?.editSnapshot ?? null,
  hasDraft: Boolean(draftState.active || draftState.displaced),
});

const loadSavedForEdit = (
  state: Intervention,
  intervention: Intervention,
  mode: "TODAY_EDIT" | "HISTORY_EDIT" | "SEARCH_EDIT",
): Intervention => {
  const draftState = captureDraftBeforeNavigation(state);
  return withLegacyDraftMirrors(
    {
      ...emptyInterventionData,
      ...intervention,
      clientName: normalizePersonName(intervention.clientName ?? ""),
      isEditing: true,
      isHistoryView: false,
      mode,
      editSnapshot: extractData(intervention),
      draftState,
    },
    draftState,
  );
};

export const loadInterventionForEdit = (state: Intervention, intervention: Intervention): Intervention =>
  loadSavedForEdit(state, intervention, "TODAY_EDIT");

export const loadInterventionFromHistory = (state: Intervention, intervention: Intervention): Intervention =>
  loadSavedForEdit(state, intervention, "HISTORY_EDIT");

export const loadInterventionFromSearch = (state: Intervention, intervention: Intervention): Intervention =>
  loadSavedForEdit(state, intervention, "SEARCH_EDIT");

export const markSearchInterventionSaved = (state: Intervention, intervention: Intervention): Intervention => {
  const draftState = getCanonicalDraftState(state);
  return {
    ...emptyInterventionData,
    ...intervention,
    clientName: normalizePersonName(intervention.clientName ?? ""),
    isEditing: false,
    isHistoryView: true,
    mode: "VIEW_HISTORY",
    draftState,
    draftSnapshot: state.draftSnapshot,
    editSnapshot: extractData(intervention),
    hasDraft: Boolean(draftState.active || draftState.displaced),
  };
};

export const loadDraft = (
  payload: Partial<InterventionData> & { isAddressConfirmed?: boolean },
): Intervention => {
  const { isAddressConfirmed: legacyAddressConfirmed, ...draftData } = payload;
  const addressConfirmation: AddressConfirmation =
    draftData.addressConfirmation ?? (legacyAddressConfirmed ? "confirmed" : "none");
  const addressClients = Array.isArray(draftData.addressClients)
    ? draftData.addressClients
    : parseLegacyAddressClients(draftData.clientsOnAddress ?? "");
  const parsedDraftAddress =
    draftData.streetName !== undefined ||
    draftData.streetNumber !== undefined ||
    draftData.streetAlpha !== undefined ||
    draftData.postalCode !== undefined ||
    draftData.city !== undefined
      ? {
          streetName: draftData.streetName ?? "",
          streetNumber: draftData.streetNumber ?? "",
          streetAlpha: draftData.streetAlpha ?? "",
          postalCode: draftData.postalCode ?? "",
          city: draftData.city ?? "",
        }
      : parseMainAddress(draftData.mainAddress ?? "");
  const normalizedAddressClients = addressClients.map((client) => ({
    ...client,
    isFuture: Boolean(client.isFuture),
    isSameClient: Boolean(client.isSameClient),
    na: normalizeNaNumber(client.na ?? ""),
  }));
  const draft: InterventionData = {
    ...emptyInterventionData,
    ...draftData,
    ...parsedDraftAddress,
    mainAddress: composeMainAddress(parsedDraftAddress),
    na: normalizeNaNumber(draftData.na ?? ""),
    clientName: normalizePersonName(draftData.clientName ?? ""),
    addressClients: normalizedAddressClients,
    clientsOnAddress: serializeAddressClients(normalizedAddressClients, draftData.infrastructure ?? ""),
    addressConfirmation,
    documentId: "",
    createdAt: null,
    updatedAt: null,
    dateKey: undefined,
  };
  const hasDraft = hasMeaningfulDraft(draft);
  const draftState = hasDraft
    ? { active: { snapshot: draft, mode: "DRAFT" as const, editSnapshot: null }, displaced: null }
    : emptyDraftState();
  return {
    ...initialStateLike(),
    ...draft,
    mode: hasDraft ? "DRAFT" : "NEW",
    draftState,
    draftSnapshot: hasDraft ? draft : null,
    draftMode: hasDraft ? "DRAFT" : null,
    draftEditSnapshot: null,
    hasDraft,
  };
};

const initialStateLike = (): Intervention => ({
  ...emptyInterventionData,
  isEditing: false,
  isHistoryView: false,
  mode: "NEW",
  draftSnapshot: null,
  draftMode: null,
  draftEditSnapshot: null,
  editSnapshot: null,
  hasDraft: false,
  draftState: emptyDraftState(),
});

export const startNewIntervention = (state: Intervention): Intervention => {
  const draftState = getCanonicalDraftState(state);
  const nextDraftState = draftState.active
    ? { active: null, displaced: draftState.active }
    : draftState;
  return withLegacyDraftMirrors(
    { ...initialStateLike(), smsEnabled: state.smsEnabled, draftState: nextDraftState },
    nextDraftState,
  );
};

export const cancelDraft = (state: Intervention): Intervention => ({
  ...state,
  draftState: emptyDraftState(),
  draftSnapshot: null,
  draftMode: null,
  draftEditSnapshot: null,
  hasDraft: false,
});

export const clearCurrentForm = (state: Intervention): Intervention => {
  const canonical = getCanonicalDraftState(state);
  const draftState = state.mode === "NEW" || state.mode === "DRAFT"
    ? { active: null, displaced: canonical.displaced }
    : canonical;
  return {
    ...initialStateLike(),
    documentId: state.documentId,
    createdAt: state.createdAt,
    updatedAt: state.updatedAt,
    snowMentionedCreatedAt: state.snowMentionedCreatedAt,
    snowReceivedCreatedAt: state.snowReceivedCreatedAt,
    snowSentCreatedAt: state.snowSentCreatedAt,
    dateKey: state.dateKey,
    isEditing: state.isEditing,
    isHistoryView: state.isHistoryView,
    mode: state.mode,
    draftState,
    draftSnapshot: draftState.displaced?.snapshot ?? null,
    draftMode: draftState.displaced?.mode ?? null,
    draftEditSnapshot: draftState.displaced?.editSnapshot ?? null,
    editSnapshot: state.editSnapshot,
    hasDraft: Boolean(draftState.active || draftState.displaced),
    smsEnabled: state.smsEnabled,
  };
};

export const restoreSession = (restored: Partial<Intervention>): Intervention => {
  const restoredClients = Array.isArray(restored.addressClients)
    ? restored.addressClients.map((client) => ({
        ...client,
        isFuture: Boolean(client.isFuture),
        isSameClient: Boolean(client.isSameClient),
        na: normalizeNaNumber(client.na ?? ""),
        fullName: normalizePersonName(client.fullName ?? ""),
      }))
    : [];
  const draftState = restored.draftState ?? (
    restored.hasDraft && restored.draftSnapshot
      ? (isSameInterventionData(restored as Intervention, restored.draftSnapshot)
          ? { active: { snapshot: restored.draftSnapshot, mode: restored.draftMode ?? "DRAFT", editSnapshot: restored.draftEditSnapshot ?? null }, displaced: null }
          : { active: null, displaced: { snapshot: restored.draftSnapshot, mode: restored.draftMode ?? "DRAFT", editSnapshot: restored.draftEditSnapshot ?? null } })
      : emptyDraftState()
  );
  return {
    ...initialStateLike(),
    ...restored,
    draftState,
    clientName: normalizePersonName(restored.clientName ?? ""),
    addressClients: restoredClients,
    clientsOnAddress: serializeAddressClients(restoredClients, restored.infrastructure ?? ""),
    smsEnabled: typeof restored.smsEnabled === "boolean" ? restored.smsEnabled : loadSmsPreference(),
  };
};

export const clearTask = (state: Intervention): Intervention => {
  const draftState = getCanonicalDraftState(state);
  const nextDraftState = { active: null, displaced: draftState.displaced };
  return withLegacyDraftMirrors({ ...initialStateLike(), smsEnabled: state.smsEnabled, draftState: nextDraftState }, nextDraftState);
};

export const resumeDraft = (state: Intervention): Intervention => resumeDisplacedDraft(state);
