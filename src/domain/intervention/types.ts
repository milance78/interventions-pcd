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
  snowMentionedCreatedAt: string | null;
  snowReceivedCreatedAt: string | null;
  snowSentCreatedAt: string | null;
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

export interface DraftRecord {
  snapshot: InterventionData;
  mode: InterventionMode;
  editSnapshot: InterventionData | null;
}

export interface DraftState {
  active: DraftRecord | null;
  displaced: DraftRecord | null;
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
  /** Canonical draft state-machine. Legacy draft* fields remain for migration compatibility. */
  draftState?: DraftState;
}

export type InterventionField = keyof InterventionData;
