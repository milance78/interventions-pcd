import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { normalizePersonName, parseLegacyAddressClients } from "../../utils/addressClients";
import { serializeAddressClients } from "../../domain/addressClients/serialize";
import {
  addAddressClientState,
  removeAddressClientState,
  setAddressClientsState,
  updateAddressClientState,
} from "../../domain/addressClients/state";
import { clearTodaysCureState, recordCureState, updateRecordedCureSmsState } from "../../domain/cure/state";
import { composeMainAddress, normalizeNaNumber, parseMainAddress } from "../../utils/interventionAddress";
import { replaceCommentSegment } from "../../domain/comment/composer";
import { emptyInterventionData, loadSmsPreference } from "../../domain/intervention/defaults";
import { extractData, hasMeaningfulDraft, isSameInterventionData } from "../../domain/intervention/draft";
import { prepareImportedIntervention } from "../../domain/intervention/importData";
import { applyInterventionFieldUpdate } from "../../domain/intervention/fieldUpdate";
import {
  captureDraftBeforeNavigation,
  emptyDraftState,
  getCanonicalDraftState,
  refreshDraftState,
  resumeDisplacedDraft,
} from "../../domain/intervention/draftState";

import type {
  AddressClient,
  AddressClientMode,
  AddressConfirmation,
  CureKey,
  CureRecord,
  CureRecords,
  CureValue,
  Intervention,
  InterventionData,
  InterventionField,
  InterventionMode,
} from "../../domain/intervention/types";

export type {
  AddressClient,
  AddressClientMode,
  AddressConfirmation,
  CureKey,
  CureRecord,
  CureRecords,
  CureValue,
  Intervention,
  InterventionData,
  InterventionField,
  InterventionMode,
} from "../../domain/intervention/types";

interface UpdateFieldPayload {
  field: InterventionField;
  value: InterventionData[InterventionField];
}

interface ApplyStructuredMainAddressPayload {
  streetName: string;
  streetNumber: string;
  streetAlpha: string;
  postalCode: string;
  city: string;
}

type ImportedDataPayload = Partial<InterventionData>;

interface RecordCurePayload {
  cure: CureKey;
  recordedAt: string;
  smsEnabled: boolean;
}

interface UpdateCureSmsPayload {
  cure: CureKey;
  smsEnabled: boolean;
}

interface UpdateAddressClientPayload {
  id: string;
  field: keyof Omit<AddressClient, "id">;
  value: string | boolean | AddressClientMode;
}


export { emptyInterventionData } from "../../domain/intervention/defaults";
export { hasMeaningfulDraft, isSameInterventionData } from "../../domain/intervention/draft";



export const initialState: Intervention = {
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
};

const NewInterventionSlice = createSlice({
  name: "newIntervention",
  initialState,
  reducers: {
    updateField: (state, action: PayloadAction<UpdateFieldPayload>) => {
      if (state.mode === "VIEW_HISTORY") return;

      const { field, value } = action.payload;

      applyInterventionFieldUpdate(state, field, value);
      state.draftState = refreshDraftState(state);
      state.hasDraft = Boolean(
        state.draftState.active || state.draftState.displaced,
      );
    },

    updateMainAddressManually: (state, action: PayloadAction<string>) => {
      if (state.mode === "VIEW_HISTORY") return;

      const value = action.payload;
      const parsed = parseMainAddress(value);

      state.mainAddress = value;
      state.streetName = parsed.streetName;
      state.streetNumber = parsed.streetNumber;
      state.streetAlpha = parsed.streetAlpha;
      state.postalCode = parsed.postalCode;
      state.city = parsed.city;

      state.draftState = refreshDraftState(state);
      state.hasDraft = Boolean(state.draftState.active || state.draftState.displaced);
    },

    applyPastedMainAddress: (
      state,
      action: PayloadAction<ApplyStructuredMainAddressPayload>,
    ) => {
      if (state.mode === "VIEW_HISTORY") return;

      const parsed = action.payload;
      state.streetName = parsed.streetName;
      state.streetNumber = parsed.streetNumber;
      state.streetAlpha = parsed.streetAlpha;
      state.postalCode = parsed.postalCode;
      state.city = parsed.city;
      state.mainAddress = composeMainAddress(parsed);

      state.draftState = refreshDraftState(state);
      state.hasDraft = Boolean(state.draftState.active || state.draftState.displaced);
    },

    recordCure: (state, action: PayloadAction<RecordCurePayload>) => {
      if (state.mode === "VIEW_HISTORY") return;
      Object.assign(state, recordCureState(state, action.payload));
      state.draftState = refreshDraftState(state);
      state.hasDraft = Boolean(state.draftState.active || state.draftState.displaced);
    },

    updateRecordedCureSms: (state, action: PayloadAction<UpdateCureSmsPayload>) => {
      if (state.mode === "VIEW_HISTORY") return;
      const patch = updateRecordedCureSmsState(state, action.payload);
      if (!patch) return;
      Object.assign(state, patch);
      state.draftState = refreshDraftState(state);
      state.hasDraft = Boolean(state.draftState.active || state.draftState.displaced);
    },

    clearTodaysCures: (state) => {
      if (state.mode === "VIEW_HISTORY") return;
      Object.assign(state, clearTodaysCureState(state));
      state.draftState = refreshDraftState(state);
      state.hasDraft = Boolean(state.draftState.active || state.draftState.displaced);
    },

    addAddressClient: (state, action: PayloadAction<AddressClient>) => {
      if (state.mode === "VIEW_HISTORY") return;
      addAddressClientState(state, action.payload);
      state.draftState = refreshDraftState(state);
      state.hasDraft = Boolean(state.draftState.active || state.draftState.displaced);
    },

    updateAddressClient: (state, action: PayloadAction<UpdateAddressClientPayload>) => {
      if (state.mode === "VIEW_HISTORY") return;
      if (!updateAddressClientState(state, action.payload)) return;
      state.draftState = refreshDraftState(state);
      state.hasDraft = Boolean(state.draftState.active || state.draftState.displaced);
    },

    removeAddressClient: (state, action: PayloadAction<string>) => {
      if (state.mode === "VIEW_HISTORY") return;
      removeAddressClientState(state, action.payload);
      state.draftState = refreshDraftState(state);
      state.hasDraft = Boolean(state.draftState.active || state.draftState.displaced);
    },

    setAddressClients: (state, action: PayloadAction<AddressClient[]>) => {
      if (state.mode === "VIEW_HISTORY") return;
      setAddressClientsState(state, action.payload);
      state.draftState = refreshDraftState(state);
      state.hasDraft = Boolean(state.draftState.active || state.draftState.displaced);
    },

    applyImportedData: (state, action: PayloadAction<ImportedDataPayload>) => {
      if (state.mode === "VIEW_HISTORY") return;

      const importedAt = new Date().toISOString();
      Object.assign(
        state,
        prepareImportedIntervention(state, action.payload, importedAt),
      );
      state.draftState = refreshDraftState(state);
      state.hasDraft = Boolean(state.draftState.active || state.draftState.displaced);
    },

    loadInterventionForEdit: (
      state,
      action: PayloadAction<Intervention>,
    ): Intervention => {
      const draftState = captureDraftBeforeNavigation(state);
      return {
        ...initialState,
        ...action.payload,
        clientName: normalizePersonName(action.payload.clientName ?? ""),
        isEditing: true,
        isHistoryView: false,
        mode: "TODAY_EDIT",
        editSnapshot: extractData(action.payload),
        draftState,
        draftSnapshot: draftState.displaced?.snapshot ?? null,
        draftMode: draftState.displaced?.mode ?? null,
        draftEditSnapshot: draftState.displaced?.editSnapshot ?? null,
        hasDraft: Boolean(draftState.active || draftState.displaced),
      };
    },

    loadInterventionFromHistory: (
      state,
      action: PayloadAction<Intervention>,
    ): Intervention => {
      const draftState = captureDraftBeforeNavigation(state);

      return {
        ...initialState,
        ...action.payload,
        clientName: normalizePersonName(action.payload.clientName ?? ""),
        isEditing: true,
        isHistoryView: false,
        mode: "HISTORY_EDIT",
        editSnapshot: extractData(action.payload),
        draftState,
        draftSnapshot: draftState.displaced?.snapshot ?? null,
        draftMode: draftState.displaced?.mode ?? null,
        draftEditSnapshot: draftState.displaced?.editSnapshot ?? null,
        hasDraft: Boolean(draftState.active || draftState.displaced),
      };
    },

    loadInterventionFromSearch: (
      state,
      action: PayloadAction<Intervention>,
    ): Intervention => {
      const draftState = captureDraftBeforeNavigation(state);

      return {
        ...initialState,
        ...action.payload,
        clientName: normalizePersonName(action.payload.clientName ?? ""),
        isEditing: true,
        isHistoryView: false,
        mode: "SEARCH_EDIT",
        editSnapshot: extractData(action.payload),
        draftState,
        draftSnapshot: draftState.displaced?.snapshot ?? null,
        draftMode: draftState.displaced?.mode ?? null,
        draftEditSnapshot: draftState.displaced?.editSnapshot ?? null,
        hasDraft: Boolean(draftState.active || draftState.displaced),
      };
    },

    markSearchInterventionSaved: (
      state,
      action: PayloadAction<Intervention>,
    ): Intervention => ({
      ...initialState,
      ...action.payload,
      clientName: normalizePersonName(action.payload.clientName ?? ""),
      isEditing: false,
      isHistoryView: true,
      mode: "VIEW_HISTORY",
      draftState: getCanonicalDraftState(state),
      draftSnapshot: state.draftSnapshot,
      editSnapshot: extractData(action.payload),
      hasDraft: Boolean(getCanonicalDraftState(state).active || getCanonicalDraftState(state).displaced),
    }),

    loadDraft: (
      _state,
      action: PayloadAction<Partial<InterventionData>>,
    ): Intervention => {
      const legacyDraft = action.payload as Partial<InterventionData> & {
        isAddressConfirmed?: boolean;
      };
      const addressConfirmation: AddressConfirmation =
        legacyDraft.addressConfirmation ??
        (legacyDraft.isAddressConfirmed ? "confirmed" : "none");
      const { isAddressConfirmed: _legacyAddressConfirmed, ...draftData } = legacyDraft;
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
      const draft = {
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

      return {
        ...initialState,
        ...draft,
        mode: hasDraft ? "DRAFT" : "NEW",
        draftState: hasDraft
          ? { active: { snapshot: draft, mode: "DRAFT", editSnapshot: null }, displaced: null }
          : emptyDraftState(),
        draftSnapshot: hasDraft ? draft : null,
        draftMode: hasDraft ? "DRAFT" : null,
        draftEditSnapshot: null,
        hasDraft,
      };
    },

    resumeDraft: (state): Intervention => {
      return resumeDisplacedDraft(state);
    },

    startNewIntervention: (state): Intervention => {
      const draftState = getCanonicalDraftState(state);
      const nextDraftState = draftState.active
        ? { active: null, displaced: draftState.active }
        : draftState;

      return {
        ...initialState,
        smsEnabled: state.smsEnabled,
        draftState: nextDraftState,
        draftSnapshot: nextDraftState.displaced?.snapshot ?? null,
        draftMode: nextDraftState.displaced?.mode ?? null,
        draftEditSnapshot: nextDraftState.displaced?.editSnapshot ?? null,
        hasDraft: Boolean(nextDraftState.active || nextDraftState.displaced),
      };
    },

    cancelDraft: (state): Intervention => ({
      ...state,
      draftState: emptyDraftState(),
      draftSnapshot: null,
      draftMode: null,
      draftEditSnapshot: null,
      hasDraft: false,
    }),

    clearCurrentForm: (state): Intervention => {
      const preserved = {
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
        draftState:
          state.mode === "NEW" || state.mode === "DRAFT"
            ? { active: null, displaced: getCanonicalDraftState(state).displaced }
            : getCanonicalDraftState(state),
        draftSnapshot: getCanonicalDraftState(state).displaced?.snapshot ?? null,
        draftMode: getCanonicalDraftState(state).displaced?.mode ?? null,
        draftEditSnapshot: getCanonicalDraftState(state).displaced?.editSnapshot ?? null,
        editSnapshot: state.editSnapshot,
        hasDraft: Boolean(
          (state.mode === "NEW" || state.mode === "DRAFT" ? null : getCanonicalDraftState(state).active) ||
          getCanonicalDraftState(state).displaced,
        ),
        smsEnabled: state.smsEnabled,
      };

      return {
        ...initialState,
        ...preserved,
        smsEnabled: state.smsEnabled,
      };
    },

    restoreSession: (
      _state,
      action: PayloadAction<Partial<Intervention>>,
    ): Intervention => {
      const restored = action.payload;
      const restoredClients = Array.isArray(restored.addressClients)
        ? restored.addressClients.map((client) => ({
            ...client,
            isFuture: Boolean(client.isFuture),
            isSameClient: Boolean(client.isSameClient),
            na: normalizeNaNumber(client.na ?? ""),
            fullName: normalizePersonName(client.fullName ?? ""),
          }))
        : [];

      return {
        ...initialState,
        ...restored,
        draftState: restored.draftState ?? {
          active: restored.hasDraft && restored.draftSnapshot && isSameInterventionData(restored, restored.draftSnapshot)
            ? { snapshot: restored.draftSnapshot, mode: restored.draftMode ?? "DRAFT", editSnapshot: restored.draftEditSnapshot ?? null }
            : null,
          displaced: restored.hasDraft && restored.draftSnapshot && !isSameInterventionData(restored, restored.draftSnapshot)
            ? { snapshot: restored.draftSnapshot, mode: restored.draftMode ?? "DRAFT", editSnapshot: restored.draftEditSnapshot ?? null }
            : null,
        },
        clientName: normalizePersonName(restored.clientName ?? ""),
        addressClients: restoredClients,
        clientsOnAddress: serializeAddressClients(
          restoredClients,
          restored.infrastructure ?? "",
        ),
        smsEnabled: typeof restored.smsEnabled === "boolean"
          ? restored.smsEnabled
          : loadSmsPreference(),
      };
    },

    clearTask: (state): Intervention => {
      const draftState = getCanonicalDraftState(state);
      // Saving the currently displayed draft consumes only the active draft.
      // A displaced draft belongs to another intervention and remains available.
      const nextDraftState = {
        active: null,
        displaced: draftState.displaced,
      };
      return {
        ...initialState,
        smsEnabled: state.smsEnabled,
        draftState: nextDraftState,
        draftSnapshot: nextDraftState.displaced?.snapshot ?? null,
        draftMode: nextDraftState.displaced?.mode ?? null,
        draftEditSnapshot: nextDraftState.displaced?.editSnapshot ?? null,
        hasDraft: Boolean(nextDraftState.displaced),
      };
    },
  },
});

export const {
  addAddressClient,
  applyImportedData,
  applyPastedMainAddress,
  cancelDraft,
  clearCurrentForm,
  clearTask,
  clearTodaysCures,
  loadDraft,
  loadInterventionForEdit,
  loadInterventionFromHistory,
  loadInterventionFromSearch,
  markSearchInterventionSaved,
  recordCure,
  removeAddressClient,
  resumeDraft,
  restoreSession,
  setAddressClients,
  startNewIntervention,
  updateAddressClient,
  updateField,
  updateMainAddressManually,
  updateRecordedCureSms,
} = NewInterventionSlice.actions;

export { NewInterventionSlice };
export default NewInterventionSlice.reducer;
