import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { formatAddressClientsForComment, normalizePersonName, parseLegacyAddressClients, serializeAddressClients } from "../../utils/addressClients";
import { cureOrder, emptyCureRecords, localDateKey, localTimeKey, removeCureLines, upsertCureLine } from "../../utils/cureRecords";
import { composeMainAddress, normalizeNaNumber, parseMainAddress } from "../../utils/interventionAddress";
import { replaceCommentBlock } from "../../domain/comment/commentBlocks";
import { emptyInterventionData, loadSmsPreference } from "../../domain/intervention/defaults";
import { captureCurrentDraft, extractData, hasMeaningfulDraft, isSameInterventionData, refreshDraftMetadata } from "../../domain/intervention/draft";

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
};

const NewInterventionSlice = createSlice({
  name: "newIntervention",
  initialState,
  reducers: {
    updateField: (state, action: PayloadAction<UpdateFieldPayload>) => {
      if (state.mode === "VIEW_HISTORY") return;

      const { field, value } = action.payload;
      const previousCure = state.cure;
      const previousSnowMentioned = state.snowMentioned;
      const previousSnowReceived = state.snowReceived;
      const previousSnowSent = state.snowSent;

      (
        state as unknown as Record<
          InterventionField,
          InterventionData[InterventionField]
        >
      )[field] = value;

      if (field === "snowMentioned" && typeof value === "string" && !previousSnowMentioned.trim() && value.trim() && !state.snowMentionedCreatedAt) {
        state.snowMentionedCreatedAt = new Date().toISOString();
      }
      if (field === "snowReceived" && typeof value === "string" && !previousSnowReceived.trim() && value.trim() && !state.snowReceivedCreatedAt) {
        state.snowReceivedCreatedAt = new Date().toISOString();
      }
      if (field === "snowSent" && typeof value === "string" && !previousSnowSent.trim() && value.trim() && !state.snowSentCreatedAt) {
        state.snowSentCreatedAt = new Date().toISOString();
      }

      if (field === "na" && typeof value === "string") {
        state.na = normalizeNaNumber(value);
      }

      if (field === "clientName" && typeof value === "string") {
        state.clientName = normalizePersonName(value);
      }

      if (
        field === "streetName" ||
        field === "streetNumber" ||
        field === "streetAlpha" ||
        field === "postalCode" ||
        field === "city"
      ) {
        state.mainAddress = composeMainAddress(state);
      }

      // Backward-compatible manual/import update: split a legacy compact address.
      if (field === "mainAddress" && typeof value === "string") {
        const parsed = parseMainAddress(value);
        state.streetName = parsed.streetName;
        state.streetNumber = parsed.streetNumber;
        state.streetAlpha = parsed.streetAlpha;
        state.postalCode = parsed.postalCode;
        state.city = parsed.city;
        state.mainAddress = composeMainAddress(parsed);
      }

      if (field === "comment" && typeof value === "string") {
        state.commentSegmentGeneralInfo = value;
      }

      if (field === "addressConfirmation") {
        state.commentSegmentAddressConfirmation =
          value === "confirmed"
            ? "Adresse confirmée"
            : value === "notConfirmed"
              ? "Adresse pas confirmée"
              : "";
      }

      if (field === "clientsOnAddress" && typeof value === "string") {
        state.addressClients = parseLegacyAddressClients(value);
        state.commentSegmentClientsOnAddress = formatAddressClientsForComment(
          state.addressClients,
          state.infrastructure,
        );
      }

      if (field === "addressClients" && Array.isArray(value)) {
        state.clientsOnAddress = serializeAddressClients(value, state.infrastructure);
        state.commentSegmentClientsOnAddress = formatAddressClientsForComment(value, state.infrastructure);
      }

      if (field === "infrastructure") {
        state.clientsOnAddress = serializeAddressClients(state.addressClients, String(value));
        state.commentSegmentClientsOnAddress = formatAddressClientsForComment(state.addressClients, String(value));
      }

      if (field === "cure") {
        const nextCure = value as CureValue;
        const isPendingCure =
          nextCure === "firstCure" || nextCure === "secondCure";

        if (!isPendingCure) {
          state.curePendingSince = null;
        } else if (previousCure !== nextCure || !state.curePendingSince) {
          state.curePendingSince = new Date().toISOString();
        }
      }

      if (
        field === "isSnowReceivedPending" ||
        field === "isSnowSentPending"
      ) {
        state.isSnow =
          state.isSnowReceivedPending || state.isSnowSentPending;
      }

      refreshDraftMetadata(state);
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

      refreshDraftMetadata(state);
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

      refreshDraftMetadata(state);
    },

    recordCure: (state, action: PayloadAction<RecordCurePayload>) => {
      if (state.mode === "VIEW_HISTORY") return;

      const { cure, recordedAt, smsEnabled } = action.payload;
      const now = new Date(recordedAt);
      const todayKey = localDateKey(now);
      const existing = state.cureRecords[cure];

      const currentTime = localTimeKey(now);

      if (!existing) {
        state.cureRecords[cure] = {
          date: todayKey,
          time: currentTime,
          recordedAt,
          smsEnabled,
        };
      } else if (existing.date === todayKey) {
        state.cureRecords[cure] = {
          ...existing,
          time: currentTime,
          recordedAt,
          smsEnabled,
        };
      }

      state.cure = cure;
      state.curePendingSince =
        cure === "firstCure" || cure === "secondCure"
          ? state.cureRecords[cure]?.recordedAt ?? existing?.recordedAt ?? null
          : null;
      state.comment = upsertCureLine(state.comment, cure, state.cureRecords);
      state.commentActionCure = cureOrder
        .map((key) => state.cureRecords[key])
        .filter(Boolean)
        .map((record, index) => {
          const cure = cureOrder[index];
          return record ? upsertCureLine("", cure, { ...emptyCureRecords(), [cure]: record }) : "";
        })
        .filter(Boolean)
        .join("\n");
      refreshDraftMetadata(state);
    },

    updateRecordedCureSms: (state, action: PayloadAction<UpdateCureSmsPayload>) => {
      if (state.mode === "VIEW_HISTORY") return;
      const existing = state.cureRecords[action.payload.cure];
      if (!existing) return;
      const todayKey = localDateKey(new Date());
      if (existing.date !== todayKey) return;

      state.cureRecords[action.payload.cure] = {
        ...existing,
        smsEnabled: action.payload.smsEnabled,
      };
      state.comment = upsertCureLine(
        state.comment,
        action.payload.cure,
        state.cureRecords,
      );
      state.commentActionCure = cureOrder
        .map((key) => state.cureRecords[key])
        .filter(Boolean)
        .map((record, index) => {
          const cure = cureOrder[index];
          return record ? upsertCureLine("", cure, { ...emptyCureRecords(), [cure]: record }) : "";
        })
        .filter(Boolean)
        .join("\n");
      refreshDraftMetadata(state);
    },

    clearTodaysCures: (state) => {
      if (state.mode === "VIEW_HISTORY") return;

      const todayKey = localDateKey(new Date());
      const curesToDelete = cureOrder.filter(
        (cure) => state.cureRecords[cure]?.date === todayKey,
      );

      // Keep a snapshot because the stored date/time is also used to find a
      // manually altered automatic line in Comment.
      const recordsBeforeDelete: CureRecords = {
        firstCure: state.cureRecords.firstCure
          ? { ...state.cureRecords.firstCure }
          : null,
        secondCure: state.cureRecords.secondCure
          ? { ...state.cureRecords.secondCure }
          : null,
        thirdCure: state.cureRecords.thirdCure
          ? { ...state.cureRecords.thirdCure }
          : null,
      };

      state.comment = removeCureLines(
        state.comment,
        curesToDelete,
        recordsBeforeDelete,
      );

      for (const cure of curesToDelete) {
        state.cureRecords[cure] = null;
      }

      const latestRemainingCure = [...cureOrder]
        .reverse()
        .find((cure) => Boolean(state.cureRecords[cure])) ?? null;

      state.cure = latestRemainingCure ?? "noCure";
      state.curePendingSince =
        latestRemainingCure === "firstCure" || latestRemainingCure === "secondCure"
          ? state.cureRecords[latestRemainingCure]?.recordedAt ?? null
          : null;
      state.commentActionCure = cureOrder
        .map((key) => state.cureRecords[key])
        .filter(Boolean)
        .map((record, index) => {
          const cure = cureOrder[index];
          return record ? upsertCureLine("", cure, { ...emptyCureRecords(), [cure]: record }) : "";
        })
        .filter(Boolean)
        .join("\n");
      refreshDraftMetadata(state);
    },

    addAddressClient: (state, action: PayloadAction<AddressClient>) => {
      if (state.mode === "VIEW_HISTORY") return;
      const previousSegment = state.commentSegmentClientsOnAddress;
      state.addressClients.push({
        ...action.payload,
        isFuture: Boolean(action.payload.isFuture),
        isSameClient: Boolean(action.payload.isSameClient),
        na: normalizeNaNumber(action.payload.na ?? ""),
      });
      state.clientsOnAddress = serializeAddressClients(state.addressClients, state.infrastructure);
      state.commentSegmentClientsOnAddress = formatAddressClientsForComment(state.addressClients, state.infrastructure);
      state.comment = replaceCommentBlock(
        state.comment,
        previousSegment,
        state.commentSegmentClientsOnAddress,
        state.commentSegmentAddressConfirmation.trim().length > 0,
      );
      refreshDraftMetadata(state);
    },

    updateAddressClient: (state, action: PayloadAction<UpdateAddressClientPayload>) => {
      if (state.mode === "VIEW_HISTORY") return;
      const client = state.addressClients.find((item) => item.id === action.payload.id);
      if (!client) return;
      const previousSegment = state.commentSegmentClientsOnAddress;
      // Keep raw input while the user is typing. Field-specific normalization
      // (for example the leading zero in NA) is applied on blur by the UI.
      (client as unknown as Record<string, unknown>)[action.payload.field] =
        action.payload.value;
      state.clientsOnAddress = serializeAddressClients(state.addressClients, state.infrastructure);
      state.commentSegmentClientsOnAddress = formatAddressClientsForComment(state.addressClients, state.infrastructure);
      state.comment = replaceCommentBlock(
        state.comment,
        previousSegment,
        state.commentSegmentClientsOnAddress,
        state.commentSegmentAddressConfirmation.trim().length > 0,
      );
      refreshDraftMetadata(state);
    },

    removeAddressClient: (state, action: PayloadAction<string>) => {
      if (state.mode === "VIEW_HISTORY") return;
      state.addressClients = state.addressClients.filter((item) => item.id !== action.payload);
      state.clientsOnAddress = serializeAddressClients(state.addressClients, state.infrastructure);
      state.commentSegmentClientsOnAddress = formatAddressClientsForComment(state.addressClients, state.infrastructure);
      refreshDraftMetadata(state);
    },

    setAddressClients: (state, action: PayloadAction<AddressClient[]>) => {
      if (state.mode === "VIEW_HISTORY") return;
      const previousSegment = state.commentSegmentClientsOnAddress;
      state.addressClients = action.payload.map((client) => ({
        ...client,
        isFuture: Boolean(client.isFuture),
        isSameClient: Boolean(client.isSameClient),
        na: normalizeNaNumber(client.na ?? ""),
      }));
      state.clientsOnAddress = serializeAddressClients(state.addressClients, state.infrastructure);
      state.commentSegmentClientsOnAddress = formatAddressClientsForComment(state.addressClients, state.infrastructure);
      state.comment = replaceCommentBlock(
        state.comment,
        previousSegment,
        state.commentSegmentClientsOnAddress,
        state.commentSegmentAddressConfirmation.trim().length > 0,
      );
      refreshDraftMetadata(state);
    },

    applyImportedData: (state, action: PayloadAction<ImportedDataPayload>) => {
      if (state.mode === "VIEW_HISTORY") return;

      const importedAt = new Date().toISOString();
      for (const [key, value] of Object.entries(action.payload)) {
        if (value === undefined || value === null) continue;
        const field = key as InterventionField;
        (state as unknown as Record<string, unknown>)[field] = value;
      }
      if (action.payload.snowMentioned?.trim() && !state.snowMentionedCreatedAt) state.snowMentionedCreatedAt = importedAt;
      if (action.payload.snowReceived?.trim() && !state.snowReceivedCreatedAt) state.snowReceivedCreatedAt = importedAt;
      if (action.payload.snowSent?.trim() && !state.snowSentCreatedAt) state.snowSentCreatedAt = importedAt;

      state.clientName = normalizePersonName(String(state.clientName ?? ""));

      const importedAddress =
        action.payload.streetName !== undefined ||
        action.payload.streetNumber !== undefined ||
        action.payload.streetAlpha !== undefined ||
        action.payload.postalCode !== undefined ||
        action.payload.city !== undefined
          ? {
              streetName: String(action.payload.streetName ?? state.streetName),
              streetNumber: String(action.payload.streetNumber ?? state.streetNumber),
              streetAlpha: String(action.payload.streetAlpha ?? state.streetAlpha),
              postalCode: String(action.payload.postalCode ?? state.postalCode),
              city: String(action.payload.city ?? state.city),
            }
          : parseMainAddress(String(action.payload.mainAddress ?? state.mainAddress));
      state.streetName = importedAddress.streetName;
      state.streetNumber = importedAddress.streetNumber;
      state.streetAlpha = importedAddress.streetAlpha;
      state.postalCode = importedAddress.postalCode;
      state.city = importedAddress.city;
      state.mainAddress = composeMainAddress(importedAddress);
      state.na = normalizeNaNumber(String(state.na ?? ""));
      state.addressClients = state.addressClients.map((client) => ({
        ...client,
        isFuture: Boolean(client.isFuture),
        isSameClient: Boolean(client.isSameClient),
        na: normalizeNaNumber(client.na ?? ""),
      }));

      if ((!action.payload.addressClients || action.payload.addressClients.length === 0) && action.payload.clientsOnAddress) {
        state.addressClients = parseLegacyAddressClients(action.payload.clientsOnAddress);
      }
      state.addressClients = state.addressClients.map((client) => ({
        ...client,
        isFuture: Boolean(client.isFuture),
        isSameClient: Boolean(client.isSameClient),
        na: normalizeNaNumber(client.na ?? ""),
      }));
      state.clientsOnAddress = serializeAddressClients(state.addressClients, state.infrastructure);

      refreshDraftMetadata(state);
    },

    loadInterventionForEdit: (
      state,
      action: PayloadAction<Intervention>,
    ): Intervention => {
      const draftState = captureCurrentDraft(state);
      return {
        ...initialState,
        ...action.payload,
        clientName: normalizePersonName(action.payload.clientName ?? ""),
        isEditing: true,
        isHistoryView: false,
        mode: "TODAY_EDIT",
        editSnapshot: extractData(action.payload),
        ...draftState,
      };
    },

    loadInterventionFromHistory: (
      state,
      action: PayloadAction<Intervention>,
    ): Intervention => {
      const draftState = captureCurrentDraft(state);

      return {
        ...initialState,
        ...action.payload,
        clientName: normalizePersonName(action.payload.clientName ?? ""),
        isEditing: true,
        isHistoryView: false,
        mode: "HISTORY_EDIT",
        editSnapshot: extractData(action.payload),
        ...draftState,
      };
    },

    loadInterventionFromSearch: (
      state,
      action: PayloadAction<Intervention>,
    ): Intervention => {
      const draftState = captureCurrentDraft(state);

      return {
        ...initialState,
        ...action.payload,
        clientName: normalizePersonName(action.payload.clientName ?? ""),
        isEditing: true,
        isHistoryView: false,
        mode: "SEARCH_EDIT",
        editSnapshot: extractData(action.payload),
        ...draftState,
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
      draftSnapshot: state.draftSnapshot,
      editSnapshot: extractData(action.payload),
      hasDraft: state.hasDraft,
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
        draftSnapshot: hasDraft ? draft : null,
        draftMode: hasDraft ? "DRAFT" : null,
        draftEditSnapshot: null,
        hasDraft,
      };
    },

    resumeDraft: (state): Intervention => {
      const draft = state.draftSnapshot;
      if (!draft || !hasMeaningfulDraft(draft)) {
        return { ...initialState, smsEnabled: state.smsEnabled };
      }

      const targetMode = state.draftMode ?? "DRAFT";
      const isEditMode =
        targetMode === "TODAY_EDIT" ||
        targetMode === "HISTORY_EDIT" ||
        targetMode === "SEARCH_EDIT";

      return {
        ...initialState,
        ...draft,
        isEditing: isEditMode,
        isHistoryView: false,
        mode: targetMode,
        draftSnapshot: draft,
        draftMode: targetMode,
        draftEditSnapshot: state.draftEditSnapshot,
        editSnapshot: isEditMode ? state.draftEditSnapshot : null,
        hasDraft: true,
        smsEnabled: state.smsEnabled,
      };
    },

    startNewIntervention: (state): Intervention => ({
      ...initialState,
      smsEnabled: state.smsEnabled,
      draftSnapshot: state.draftSnapshot,
      draftMode: state.draftMode,
      draftEditSnapshot: state.draftEditSnapshot,
      hasDraft: state.hasDraft,
    }),

    cancelDraft: (state): Intervention => ({
      ...state,
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
        draftSnapshot:
          state.mode === "NEW" || state.mode === "DRAFT"
            ? null
            : state.draftSnapshot,
        draftMode:
          state.mode === "NEW" || state.mode === "DRAFT"
            ? null
            : state.draftMode,
        draftEditSnapshot:
          state.mode === "NEW" || state.mode === "DRAFT"
            ? null
            : state.draftEditSnapshot,
        editSnapshot: state.editSnapshot,
        hasDraft:
          state.mode === "NEW" || state.mode === "DRAFT"
            ? false
            : state.hasDraft,
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
      const isDisplayedDraft = Boolean(
        state.hasDraft &&
          state.draftSnapshot &&
          isSameInterventionData(state, state.draftSnapshot),
      );

      // Keep a background brouillon when the intervention currently on screen
      // is another record. If the saved action was performed on the brouillon
      // itself, it has now become a normal saved intervention and must not be
      // resurrected as a brouillon.
      return {
        ...initialState,
        smsEnabled: state.smsEnabled,
        draftSnapshot: isDisplayedDraft ? null : state.draftSnapshot,
        draftMode: isDisplayedDraft ? null : state.draftMode,
        draftEditSnapshot: isDisplayedDraft ? null : state.draftEditSnapshot,
        hasDraft: isDisplayedDraft ? false : state.hasDraft,
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
