import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { normalizePersonName, parseLegacyAddressClients, serializeAddressClients } from "../../utils/addressClients";
import { cureOrder, emptyCureRecords, localDateKey, localTimeKey, removeCureLines, upsertCureLine } from "../../utils/cureRecords";
import { composeMainAddress, normalizeNaNumber, parseMainAddress } from "../../utils/interventionAddress";

export type InterventionMode =
  | "NEW"
  | "DRAFT"
  | "VIEW_HISTORY"
  | "HISTORY_EDIT"
  | "SEARCH_EDIT"
  | "TODAY_EDIT";

export type CureKey = "firstCure" | "secondCure" | "thirdCure";
export type CureValue = "noCure" | CureKey;
export interface CureRecord {
  /** Calendar date in local time, YYYY-MM-DD. */
  date: string;
  /** Clock time in local time, HH:mm. */
  time: string;
  /** Kept for backward compatibility and precise timestamp reconstruction. */
  recordedAt: string;
  smsEnabled: boolean;
}
export type CureRecords = Record<CureKey, CureRecord | null>;
export type AddressConfirmation = "none" | "confirmed" | "notConfirmed";
export type AddressClientMode = "base" | "plus";

export interface AddressClient {
  id: string;
  mode: AddressClientMode;
  fullName: string;
  operator: string;
  naInService: string;
  addressDetails: string;
  utac: string;
  clientId: string;
  na: string;
  cid: string;
  voip: string;
}

const loadSmsPreference = (): boolean => {
  try {
    return window.localStorage.getItem("interventions-pcd:sms-enabled") === "true";
  } catch {
    return false;
  }
};

export interface InterventionData {
  documentId: string;
  interventionId: string;
  network: string;
  infrastructure: string;
  oagID: string;
  na: string;
  cid: string;
  clientName: string;
  interventionDescription: string;
  clientID: string;
  mainAddress: string;
  streetName: string;
  streetNumber: string;
  streetAlpha: string;
  postalCode: string;
  city: string;
  addressDetails: string;
  mailbox: string;
  floor: string;
  apartment: string;
  blockNumber: string;
  clientsOnAddress: string;
  addressClients: AddressClient[];
  LOMKey: string;
  phone: string;
  displayAllFields: boolean;
  snowReceived: string;
  snowSent: string;
  snowMentioned: string;
  isSnowReceivedPending: boolean;
  isSnowSentPending: boolean;
  isResPending: boolean;
  /** Local calendar date (YYYY-MM-DD) of the latest Résiliation consultation. */
  resConsultedDate: string | null;
  /** Local calendar date (YYYY-MM-DD) of latest Snow à mon nom consultation. */
  snowReceivedConsultedDate: string | null;
  /** Local calendar date (YYYY-MM-DD) of latest Snow créé consultation. */
  snowSentConsultedDate: string | null;
  isUnclear: boolean;
  addressConfirmation: AddressConfirmation;
  isGoodExample: boolean;
  isSnow: boolean;
  comment: string;
  additionalInformation: string;
  cure: CureValue;
  cureRecords: CureRecords;
  curePendingSince: string | null;
  smsEnabled: boolean;
  status: string;
  createdAt: string | null;
  updatedAt: string | null;
  dateKey?: string;
}

export interface Intervention extends InterventionData {
  isEditing: boolean;
  isHistoryView: boolean;
  mode: InterventionMode;
  draftSnapshot: InterventionData | null;
  editSnapshot: InterventionData | null;
  hasDraft: boolean;
}

export type InterventionField = keyof InterventionData;

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
  value: string | AddressClientMode;
}


export const emptyInterventionData: InterventionData = {
  documentId: "",
  interventionId: "",
  network: "",
  infrastructure: "",
  oagID: "",
  na: "",
  cid: "",
  clientName: "",
  interventionDescription: "",
  clientID: "",
  mainAddress: "",
  streetName: "",
  streetNumber: "",
  streetAlpha: "",
  postalCode: "",
  city: "",
  addressDetails: "",
  mailbox: "",
  floor: "",
  apartment: "",
  blockNumber: "",
  clientsOnAddress: "",
  addressClients: [],
  LOMKey: "",
  phone: "",
  displayAllFields: false,
  snowReceived: "",
  snowSent: "",
  snowMentioned: "",
  isSnowReceivedPending: false,
  isSnowSentPending: false,
  isResPending: false,
  resConsultedDate: null,
  snowReceivedConsultedDate: null,
  snowSentConsultedDate: null,
  isUnclear: false,
  addressConfirmation: "none",
  isGoodExample: false,
  isSnow: false,
  comment: "",
  additionalInformation: "",
  cure: "noCure",
  cureRecords: emptyCureRecords(),
  curePendingSince: null,
  smsEnabled: loadSmsPreference(),
  status: "",
  createdAt: null,
  updatedAt: null,
};

export const hasMeaningfulDraft = (
  intervention: Partial<InterventionData> | null | undefined,
) => {
  if (!intervention) return false;

  return Object.entries(intervention).some(([key, value]) => {
    if (
      key === "documentId" ||
      key === "createdAt" ||
      key === "updatedAt" ||
      key === "dateKey" ||
      key === "displayAllFields" ||
      key === "cure" ||
      key === "smsEnabled" ||
      key === "mode" ||
      key === "isEditing" ||
      key === "isHistoryView" ||
      key === "draftSnapshot" ||
      key === "editSnapshot" ||
      key === "hasDraft" ||
      (key === "addressConfirmation" && value === "none")
    ) {
      return false;
    }

    if (typeof value === "boolean") return value;
    if (Array.isArray(value)) return value.length > 0;
    return typeof value === "string" && value.trim().length > 0;
  });
};

const extractData = (state: Intervention): InterventionData => ({
  documentId: state.documentId,
  interventionId: state.interventionId,
  network: state.network,
  infrastructure: state.infrastructure,
  oagID: state.oagID,
  na: state.na,
  cid: state.cid,
  clientName: state.clientName,
  interventionDescription: state.interventionDescription,
  clientID: state.clientID,
  mainAddress: state.mainAddress,
  streetName: state.streetName,
  streetNumber: state.streetNumber,
  streetAlpha: state.streetAlpha,
  postalCode: state.postalCode,
  city: state.city,
  addressDetails: state.addressDetails,
  mailbox: state.mailbox,
  floor: state.floor,
  apartment: state.apartment,
  blockNumber: state.blockNumber,
  clientsOnAddress: state.clientsOnAddress,
  addressClients: state.addressClients,
  LOMKey: state.LOMKey,
  phone: state.phone,
  displayAllFields: state.displayAllFields,
  snowReceived: state.snowReceived,
  snowSent: state.snowSent,
  snowMentioned: state.snowMentioned,
  isSnowReceivedPending: state.isSnowReceivedPending,
  isSnowSentPending: state.isSnowSentPending,
  isResPending: state.isResPending,
  resConsultedDate: state.resConsultedDate,
  snowReceivedConsultedDate: state.snowReceivedConsultedDate,
  snowSentConsultedDate: state.snowSentConsultedDate,
  isUnclear: state.isUnclear,
  addressConfirmation: state.addressConfirmation,
  isGoodExample: state.isGoodExample,
  isSnow: state.isSnow,
  comment: state.comment,
  additionalInformation: state.additionalInformation,
  cure: state.cure,
  cureRecords: state.cureRecords,
  curePendingSince: state.curePendingSince,
  smsEnabled: state.smsEnabled,
  status: state.status,
  createdAt: state.createdAt,
  updatedAt: state.updatedAt,
  dateKey: state.dateKey,
});

const refreshDraftMetadata = (state: Intervention) => {
  if (state.mode !== "NEW" && state.mode !== "DRAFT") return;
  const draft = extractData(state);
  state.hasDraft = hasMeaningfulDraft(draft);
  state.mode = state.hasDraft ? "DRAFT" : "NEW";
  state.draftSnapshot = state.hasDraft
    ? { ...draft, documentId: "", createdAt: null, updatedAt: null, dateKey: undefined }
    : null;
};

const captureCurrentDraft = (state: Intervention) => {
  if (state.mode !== "NEW" && state.mode !== "DRAFT") {
    return {
      draftSnapshot: state.draftSnapshot,
      hasDraft: state.hasDraft,
    };
  }

  const currentDraft = extractData(state);
  const hasDraft = hasMeaningfulDraft(currentDraft);

  return {
    hasDraft,
    draftSnapshot: hasDraft
      ? {
          ...currentDraft,
          documentId: "",
          createdAt: null,
          updatedAt: null,
          dateKey: undefined,
        }
      : null,
  };
};

export const initialState: Intervention = {
  ...emptyInterventionData,
  isEditing: false,
  isHistoryView: false,
  mode: "NEW",
  draftSnapshot: null,
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

      (
        state as unknown as Record<
          InterventionField,
          InterventionData[InterventionField]
        >
      )[field] = value;

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

      if (field === "clientsOnAddress" && typeof value === "string") {
        state.addressClients = parseLegacyAddressClients(value);
      }

      if (field === "addressClients" && Array.isArray(value)) {
        state.clientsOnAddress = serializeAddressClients(value, state.infrastructure);
      }

      if (field === "infrastructure") {
        state.clientsOnAddress = serializeAddressClients(state.addressClients, String(value));
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

      if (state.mode === "NEW" || state.mode === "DRAFT") {
        const draft = extractData(state);
        state.hasDraft = hasMeaningfulDraft(draft);
        state.mode = state.hasDraft ? "DRAFT" : "NEW";
        state.draftSnapshot = state.hasDraft
          ? {
              ...draft,
              documentId: "",
              createdAt: null,
              updatedAt: null,
              dateKey: undefined,
            }
          : null;
      }
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

      state.cure = "noCure";
      state.curePendingSince = null;
      refreshDraftMetadata(state);
    },

    addAddressClient: (state, action: PayloadAction<AddressClient>) => {
      if (state.mode === "VIEW_HISTORY") return;
      state.addressClients.push({
        ...action.payload,
        na: normalizeNaNumber(action.payload.na ?? ""),
      });
      state.clientsOnAddress = serializeAddressClients(state.addressClients, state.infrastructure);
      refreshDraftMetadata(state);
    },

    updateAddressClient: (state, action: PayloadAction<UpdateAddressClientPayload>) => {
      if (state.mode === "VIEW_HISTORY") return;
      const client = state.addressClients.find((item) => item.id === action.payload.id);
      if (!client) return;
      // Keep raw input while the user is typing. Field-specific normalization
      // (for example the leading zero in NA) is applied on blur by the UI.
      (client as unknown as Record<string, unknown>)[action.payload.field] =
        action.payload.value;
      state.clientsOnAddress = serializeAddressClients(state.addressClients, state.infrastructure);
      refreshDraftMetadata(state);
    },

    removeAddressClient: (state, action: PayloadAction<string>) => {
      if (state.mode === "VIEW_HISTORY") return;
      state.addressClients = state.addressClients.filter((item) => item.id !== action.payload);
      state.clientsOnAddress = serializeAddressClients(state.addressClients, state.infrastructure);
      refreshDraftMetadata(state);
    },

    setAddressClients: (state, action: PayloadAction<AddressClient[]>) => {
      if (state.mode === "VIEW_HISTORY") return;
      state.addressClients = action.payload.map((client) => ({
        ...client,
        na: normalizeNaNumber(client.na ?? ""),
      }));
      state.clientsOnAddress = serializeAddressClients(state.addressClients, state.infrastructure);
      refreshDraftMetadata(state);
    },

    applyImportedData: (state, action: PayloadAction<ImportedDataPayload>) => {
      if (state.mode === "VIEW_HISTORY") return;

      for (const [key, value] of Object.entries(action.payload)) {
        if (value === undefined || value === null) continue;
        const field = key as InterventionField;
        (state as unknown as Record<string, unknown>)[field] = value;
      }

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
        na: normalizeNaNumber(client.na ?? ""),
      }));

      if ((!action.payload.addressClients || action.payload.addressClients.length === 0) && action.payload.clientsOnAddress) {
        state.addressClients = parseLegacyAddressClients(action.payload.clientsOnAddress);
      }
      state.addressClients = state.addressClients.map((client) => ({
        ...client,
        na: normalizeNaNumber(client.na ?? ""),
      }));
      state.clientsOnAddress = serializeAddressClients(state.addressClients, state.infrastructure);

      if (state.mode === "NEW" || state.mode === "DRAFT") {
        const draft = extractData(state);
        state.hasDraft = hasMeaningfulDraft(draft);
        state.mode = state.hasDraft ? "DRAFT" : "NEW";
        state.draftSnapshot = state.hasDraft
          ? {
              ...draft,
              documentId: "",
              createdAt: null,
              updatedAt: null,
              dateKey: undefined,
            }
          : null;
      }
    },

    loadInterventionForEdit: (
      state,
      action: PayloadAction<Intervention>,
    ): Intervention => ({
      ...initialState,
      ...action.payload,
      clientName: normalizePersonName(action.payload.clientName ?? ""),
      isEditing: true,
      isHistoryView: false,
      mode: "TODAY_EDIT",
      draftSnapshot: state.draftSnapshot,
      editSnapshot: extractData(action.payload),
      hasDraft: state.hasDraft,
    }),

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
        hasDraft,
      };
    },

    resumeDraft: (state): Intervention => {
      const draft = state.draftSnapshot;
      if (!draft || !hasMeaningfulDraft(draft)) {
        return { ...initialState };
      }

      return {
        ...initialState,
        ...draft,
        mode: "DRAFT",
        draftSnapshot: draft,
        hasDraft: true,
      };
    },

    startNewIntervention: (state): Intervention => ({
      ...initialState,
      smsEnabled: state.smsEnabled,
    }),

    cancelDraft: (state): Intervention => ({
      ...state,
      draftSnapshot: null,
      hasDraft: false,
    }),

    clearCurrentForm: (state): Intervention => {
      const preserved = {
        documentId: state.documentId,
        createdAt: state.createdAt,
        updatedAt: state.updatedAt,
        dateKey: state.dateKey,
        isEditing: state.isEditing,
        isHistoryView: state.isHistoryView,
        mode: state.mode,
        draftSnapshot:
          state.mode === "NEW" || state.mode === "DRAFT"
            ? null
            : state.draftSnapshot,
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

    clearTask: (state): Intervention => ({
      ...initialState,
      smsEnabled: state.smsEnabled,
    }),
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
  setAddressClients,
  startNewIntervention,
  updateAddressClient,
  updateField,
  updateMainAddressManually,
  updateRecordedCureSms,
} = NewInterventionSlice.actions;

export { NewInterventionSlice };
export default NewInterventionSlice.reducer;
