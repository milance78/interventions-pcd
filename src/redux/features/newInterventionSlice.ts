import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { formatAddressClientsForComment, normalizePersonName, parseLegacyAddressClients, serializeAddressClients } from "../../utils/addressClients";
import { cureOrder, emptyCureRecords, localDateKey, localTimeKey, removeCureLines, upsertCureLine } from "../../utils/cureRecords";
import { composeMainAddress, normalizeNaNumber, parseMainAddress } from "../../utils/interventionAddress";

const replaceCommentBlock = (comment: string, previous: string, next: string, insertAfterFirstBlock = false) => {
  const blocks = comment.replace(/\r\n/g, "\n").split(/\n{2,}/).map((block) => block.trim()).filter(Boolean);
  const filtered = previous.trim()
    ? blocks.filter((block) => block !== previous.trim())
    : blocks;

  if (!next.trim()) return filtered.join("\n\n");

  const nextBlock = next.trim();
  if (insertAfterFirstBlock && filtered.length > 0) {
    filtered.splice(1, 0, nextBlock);
  } else {
    filtered.push(nextBlock);
  }
  return filtered.join("\n\n");
};

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
  isFuture: boolean;
  isSameClient: boolean;
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
  wctLink: string;
  displayAllFields: boolean;
  snowReceived: string;
  snowSent: string;
  snowMentioned: string;
  isSnowReceivedPending: boolean;
  isSnowSentPending: boolean;
  /** Snow ticket resolution state, shown next to the base status once
   * "Snow à mon nom" has a value. */
  snowStatus: "pending" | "resolved";
  isResPending: boolean;
  /** Local calendar date (YYYY-MM-DD) of the latest Résiliation consultation. */
  resConsultedDate: string | null;
  /** Local calendar date (YYYY-MM-DD) of latest Snow à mon nom consultation. */
  snowReceivedConsultedDate: string | null;
  /** Local calendar date (YYYY-MM-DD) of latest Snow créé consultation. */
  snowSentConsultedDate: string | null;
  /** Explicit Revu markers. Kept separate from legacy consultation metadata so
   * the visual stamp can only be created by the Revu action. */
  resReviewedDate: string | null;
  snowReceivedReviewedDate: string | null;
  snowSentReviewedDate: string | null;
  otherReviewedDate: string | null;
  cureReviewedDate: string | null;
  questionReviewedDate: string | null;
  isUnclear: boolean;
  addressConfirmation: AddressConfirmation;
  isGoodExample: boolean;
  isSnow: boolean;
  comment: string;
  commentSegmentAddressConfirmation: string;
  commentSegmentTechDetailOnAddress: string;
  commentSegmentClientsOnAddress: string;
  commentSegmentGeneralInfo: string;
  commentActionCure: string;
  commentActionResiliation: string;
  commentActionSnowReceived: string;
  commentActionSnowSent: string;
  commentActionBci: string;
  commentActionTache173: string;
  commentActionTache79: string;
  commentActionTache96: string;
  bciNumber: string;
  wioNumber: string;
  tache173Content: string;
  tache79Content: string;
  tache79JobId: string;
  tache96Content: string;
  tache96SnowId: string;
  additionalInformation: string;
  cure: CureValue;
  cureRecords: CureRecords;
  curePendingSince: string | null;
  smsEnabled: boolean;
  status: string;
  postponedDate: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  lastRevuAt: string | null;
  dateKey?: string;
}

export interface Intervention extends InterventionData {
  isEditing: boolean;
  isHistoryView: boolean;
  mode: InterventionMode;
  draftSnapshot: InterventionData | null;
  draftMode: InterventionMode | null;
  draftEditSnapshot: InterventionData | null;
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
  value: string | boolean | AddressClientMode;
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
  wctLink: "",
  displayAllFields: false,
  snowReceived: "",
  snowSent: "",
  snowMentioned: "",
  isSnowReceivedPending: false,
  isSnowSentPending: false,
  snowStatus: "pending",
  isResPending: false,
  resConsultedDate: null,
  snowReceivedConsultedDate: null,
  snowSentConsultedDate: null,
  resReviewedDate: null,
  snowReceivedReviewedDate: null,
  snowSentReviewedDate: null,
  otherReviewedDate: null,
  cureReviewedDate: null,
  questionReviewedDate: null,
  isUnclear: false,
  addressConfirmation: "none",
  isGoodExample: false,
  isSnow: false,
  comment: "",
  commentSegmentAddressConfirmation: "",
  commentSegmentTechDetailOnAddress: "",
  commentSegmentClientsOnAddress: "",
  commentSegmentGeneralInfo: "",
  commentActionCure: "",
  commentActionResiliation: "",
  commentActionSnowReceived: "",
  commentActionSnowSent: "",
  commentActionBci: "",
  commentActionTache173: "",
  commentActionTache79: "",
  commentActionTache96: "",
  bciNumber: "",
  wioNumber: "",
  tache173Content: "",
  tache79Content: "",
  tache79JobId: "",
  tache96Content: "",
  tache96SnowId: "",
  additionalInformation: "",
  cure: "noCure",
  cureRecords: emptyCureRecords(),
  curePendingSince: null,
  smsEnabled: loadSmsPreference(),
  status: "on hold",
  postponedDate: null,
  createdAt: null,
  updatedAt: null,
  lastRevuAt: null,
};

export const hasMeaningfulDraft = (
  intervention: Partial<InterventionData> | null | undefined,
) => {
  if (!intervention) return false;

  // A brouillon exists as soon as the user has changed any intervention value
  // from the pristine form. UI-only expansion and the globally persistent SMS
  // preference are deliberately excluded. If every value is put back to its
  // pristine value, the brouillon disappears again.
  const ignored = new Set<keyof InterventionData>([
    "documentId",
    "createdAt",
    "updatedAt",
    "dateKey",
    "displayAllFields",
    "smsEnabled",
  ]);

  return (Object.keys(emptyInterventionData) as Array<keyof InterventionData>).some(
    (key) => {
      if (ignored.has(key)) return false;

      const current = intervention[key] ?? emptyInterventionData[key];
      const initial = emptyInterventionData[key];

      if (Array.isArray(current) || typeof current === "object") {
        return JSON.stringify(current) !== JSON.stringify(initial);
      }

      return current !== initial;
    },
  );
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
  wctLink: state.wctLink,
  displayAllFields: state.displayAllFields,
  snowReceived: state.snowReceived,
  snowSent: state.snowSent,
  snowMentioned: state.snowMentioned,
  isSnowReceivedPending: state.isSnowReceivedPending,
  isSnowSentPending: state.isSnowSentPending,
  snowStatus: state.snowStatus,
  isResPending: state.isResPending,
  resConsultedDate: state.resConsultedDate,
  snowReceivedConsultedDate: state.snowReceivedConsultedDate,
  snowSentConsultedDate: state.snowSentConsultedDate,
  resReviewedDate: state.resReviewedDate,
  snowReceivedReviewedDate: state.snowReceivedReviewedDate,
  snowSentReviewedDate: state.snowSentReviewedDate,
  otherReviewedDate: state.otherReviewedDate,
  cureReviewedDate: state.cureReviewedDate,
  questionReviewedDate: state.questionReviewedDate,
  isUnclear: state.isUnclear,
  addressConfirmation: state.addressConfirmation,
  isGoodExample: state.isGoodExample,
  isSnow: state.isSnow,
  comment: state.comment,
  commentSegmentAddressConfirmation: state.commentSegmentAddressConfirmation,
  commentSegmentTechDetailOnAddress: state.commentSegmentTechDetailOnAddress,
  commentSegmentClientsOnAddress: state.commentSegmentClientsOnAddress,
  commentSegmentGeneralInfo: state.commentSegmentGeneralInfo,
  commentActionCure: state.commentActionCure,
  commentActionResiliation: state.commentActionResiliation,
  commentActionSnowReceived: state.commentActionSnowReceived,
  commentActionSnowSent: state.commentActionSnowSent,
  commentActionBci: state.commentActionBci,
  commentActionTache173: state.commentActionTache173,
  commentActionTache79: state.commentActionTache79,
  commentActionTache96: state.commentActionTache96,
  bciNumber: state.bciNumber,
  wioNumber: state.wioNumber,
  tache173Content: state.tache173Content,
  tache79Content: state.tache79Content,
  tache79JobId: state.tache79JobId,
  tache96Content: state.tache96Content,
  tache96SnowId: state.tache96SnowId,
  additionalInformation: state.additionalInformation,
  cure: state.cure,
  cureRecords: state.cureRecords,
  curePendingSince: state.curePendingSince,
  smsEnabled: state.smsEnabled,
  status: state.status,
  postponedDate: state.postponedDate,
  createdAt: state.createdAt,
  updatedAt: state.updatedAt,
  lastRevuAt: state.lastRevuAt,
  dateKey: state.dateKey,
});

export const isSameInterventionData = (
  firstValue: Partial<InterventionData> | null | undefined,
  secondValue: Partial<InterventionData> | null | undefined,
) => {
  if (!firstValue || !secondValue) return false;
  const ignored = new Set<keyof InterventionData>(["updatedAt"]);
  return (Object.keys(emptyInterventionData) as Array<keyof InterventionData>).every((key) => {
    if (ignored.has(key)) return true;
    const firstItem = firstValue[key] ?? emptyInterventionData[key];
    const secondItem = secondValue[key] ?? emptyInterventionData[key];
    if (typeof firstItem === "object" || typeof secondItem === "object") {
      return JSON.stringify(firstItem) === JSON.stringify(secondItem);
    }
    return firstItem === secondItem;
  });
};

const refreshDraftMetadata = (state: Intervention) => {
  const draft = extractData(state);

  if (state.mode === "NEW" || state.mode === "DRAFT") {
    const hasDraft = hasMeaningfulDraft(draft);
    state.hasDraft = hasDraft;
    state.mode = hasDraft ? "DRAFT" : "NEW";
    state.draftSnapshot = hasDraft
      ? { ...draft, documentId: "", createdAt: null, updatedAt: null, dateKey: undefined }
      : null;
    state.draftMode = hasDraft ? "DRAFT" : null;
    state.draftEditSnapshot = null;
    return;
  }

  if (state.mode === "VIEW_HISTORY" || !state.editSnapshot) return;

  const changed = !isSameInterventionData(draft, state.editSnapshot);
  if (changed) {
    state.hasDraft = true;
    state.draftSnapshot = draft;
    state.draftMode = state.mode;
    state.draftEditSnapshot = state.editSnapshot;
    return;
  }

  // If this draft belongs to the currently displayed edit and every value was
  // restored to its original baseline, it is no longer a brouillon. Preserve
  // any unrelated background draft instead.
  if (state.draftMode === state.mode && state.draftEditSnapshot) {
    state.hasDraft = false;
    state.draftSnapshot = null;
    state.draftMode = null;
    state.draftEditSnapshot = null;
  }
};

const captureCurrentDraft = (state: Intervention) => {
  if (state.mode === "NEW" || state.mode === "DRAFT") {
    const currentDraft = extractData(state);
    const hasDraft = hasMeaningfulDraft(currentDraft);
    return {
      hasDraft,
      draftSnapshot: hasDraft
        ? { ...currentDraft, documentId: "", createdAt: null, updatedAt: null, dateKey: undefined }
        : null,
      draftMode: hasDraft ? ("DRAFT" as InterventionMode) : null,
      draftEditSnapshot: null,
    };
  }

  if (state.mode !== "VIEW_HISTORY" && state.editSnapshot) {
    const currentData = extractData(state);
    if (!isSameInterventionData(currentData, state.editSnapshot)) {
      return {
        hasDraft: true,
        draftSnapshot: currentData,
        draftMode: state.mode,
        draftEditSnapshot: state.editSnapshot,
      };
    }
  }

  return {
    draftSnapshot: state.draftSnapshot,
    draftMode: state.draftMode,
    draftEditSnapshot: state.draftEditSnapshot,
    hasDraft: state.hasDraft,
  };
};

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
