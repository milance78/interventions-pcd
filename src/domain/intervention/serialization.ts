import type { Intervention } from "./types";
import { parseLegacyAddressClients, serializeAddressClients } from "../../utils/addressClients";
import { normalizeCureRecords } from "../../utils/cureRecords";
import { composeMainAddress, normalizeNaNumber, parseMainAddress } from "../../utils/interventionAddress";

export const convertTimestampToString = (timestamp: any): string | null => {
  if (!timestamp) return null;
  if (typeof timestamp === "string") return timestamp;
  return typeof timestamp.toDate === "function"
    ? timestamp.toDate().toISOString()
    : String(timestamp);
};

const extractLegacyAddressDetail = (details: string, label: string) => {
  const match = details.match(new RegExp(`(?:^|\n)\s*${label}\s*:\s*(.+)$`, "im"));
  return match?.[1]?.trim() ?? "";
};

export const normalizeLegacyFields = (data: Record<string, any>): Record<string, any> => {
  const { isAddressConfirmed: legacyAddressConfirmed, ...dataWithoutLegacyAddress } = data;
  const addressDetails = data.addressDetails ?? "";

  const comment = data.comment ?? data.commentaire ?? "";
  const addressConfirmation =
    data.addressConfirmation === "confirmed" ||
    data.addressConfirmation === "notConfirmed" ||
    data.addressConfirmation === "none"
      ? data.addressConfirmation
      : legacyAddressConfirmed === true
        ? "confirmed"
        : comment === "Adresse confirmée" || comment.startsWith("Adresse confirmée\n")
          ? "confirmed"
          : comment === "Adresse pas encore confirmée" || comment.startsWith("Adresse pas encore confirmée\n")
            ? "notConfirmed"
            : "none";

  const snowReceived =
    data.snowReceived ??
    data.snowReference ??
    data.snowReceivedPending ??
    "";
  const snowSent =
    data.snowSent ??
    data.snowSentPending ??
    data.snowEnvoyePending ??
    "";
  const snowMentioned = data.snowMentioned ?? data.snowMentionne ?? "";

  const isSnowReceivedPending = Boolean(
    data.isSnowReceivedPending ?? false,
  );
  const isSnowSentPending = Boolean(
    data.isSnowSentPending ?? false,
  );
  const snowStatus: "pending" | "resolved" =
    data.snowStatus === "resolved" ? "resolved" : "pending";

  const rawCure = data.cure ?? data.Cure;
  const normalizedCure =
    rawCure === "CURE1"
      ? "firstCure"
      : rawCure === "CURE2"
        ? "secondCure"
        : rawCure === "CURE3"
          ? "thirdCure"
          : rawCure ?? "noCure";

  const addressClients = (Array.isArray(data.addressClients)
    ? data.addressClients
    : parseLegacyAddressClients(data.clientsOnAddress ?? "")).map((client: any) => ({
      ...client,
      isFuture: Boolean(client.isFuture),
      isSameClient: Boolean(client.isSameClient),
      na: normalizeNaNumber(String(client.na ?? "")),
    }));
  const structuredAddress =
    data.streetName !== undefined ||
    data.streetNumber !== undefined ||
    data.streetAlpha !== undefined ||
    data.postalCode !== undefined ||
    data.city !== undefined
      ? {
          streetName: String(data.streetName ?? ""),
          streetNumber: String(data.streetNumber ?? ""),
          streetAlpha: String(data.streetAlpha ?? ""),
          postalCode: String(data.postalCode ?? ""),
          city: String(data.city ?? ""),
        }
      : parseMainAddress(String(data.mainAddress ?? ""));

  return {
    ...dataWithoutLegacyAddress,
    ...structuredAddress,
    mainAddress: composeMainAddress(structuredAddress),
    na: normalizeNaNumber(String(data.na ?? "")),
    addressClients,
    clientsOnAddress: serializeAddressClients(addressClients, data.infrastructure ?? ""),
    snowReceived,
    snowSent,
    snowMentioned,
    snowMentionedCreatedAt:
      typeof data.snowMentionedCreatedAt === "string" ? data.snowMentionedCreatedAt : null,
    snowReceivedCreatedAt:
      typeof data.snowReceivedCreatedAt === "string" ? data.snowReceivedCreatedAt : null,
    snowSentCreatedAt:
      typeof data.snowSentCreatedAt === "string" ? data.snowSentCreatedAt : null,
    isSnowReceivedPending,
    isSnowSentPending,
    snowStatus,
    isResPending: Boolean(
      data.isResPending ??
        data.resPending ??
        data.RES ??
        data.res ??
        false,
    ),
    resConsultedDate:
      typeof data.resConsultedDate === "string"
        ? data.resConsultedDate
        : null,
    snowReceivedConsultedDate:
      typeof data.snowReceivedConsultedDate === "string"
        ? data.snowReceivedConsultedDate
        : null,
    snowSentConsultedDate:
      typeof data.snowSentConsultedDate === "string"
        ? data.snowSentConsultedDate
        : null,
    resReviewedDate:
      typeof data.resReviewedDate === "string" ? data.resReviewedDate : null,
    snowReceivedReviewedDate:
      typeof data.snowReceivedReviewedDate === "string"
        ? data.snowReceivedReviewedDate
        : null,
    snowSentReviewedDate:
      typeof data.snowSentReviewedDate === "string"
        ? data.snowSentReviewedDate
        : null,
    otherReviewedDate:
      typeof data.otherReviewedDate === "string" ? data.otherReviewedDate : null,
    cureReviewedDate:
      typeof data.cureReviewedDate === "string" ? data.cureReviewedDate : null,
    questionReviewedDate:
      typeof data.questionReviewedDate === "string" ? data.questionReviewedDate : null,
    isSnow: isSnowReceivedPending || isSnowSentPending,
    comment,
    commentSegmentAddressConfirmation: String(data.commentSegmentAddressConfirmation ?? ""),
    commentSegmentTechDetailOnAddress: String(data.commentSegmentTechDetailOnAddress ?? ""),
    commentSegmentClientsOnAddress: String(data.commentSegmentClientsOnAddress ?? ""),
    commentSegmentGeneralInfo: String(data.commentSegmentGeneralInfo ?? ""),
    commentActionCure: String(data.commentActionCure ?? ""),
    commentActionResiliation: String(data.commentActionResiliation ?? ""),
    commentActionSnowReceived: String(data.commentActionSnowReceived ?? ""),
    commentActionSnowSent: String(data.commentActionSnowSent ?? ""),
    commentActionBci: String(data.commentActionBci ?? ""),
    commentActionTache173: String(data.commentActionTache173 ?? ""),
    commentActionTache79: String(data.commentActionTache79 ?? ""),
    commentActionTache96: String(data.commentActionTache96 ?? ""),
    bciNumber: String(data.bciNumber ?? ""),
    wioNumber: String(data.wioNumber ?? ""),
    tache173Content: String(data.tache173Content ?? ""),
    tache79Content: String(data.tache79Content ?? ""),
    tache79JobId: String(data.tache79JobId ?? ""),
    tache96Content: String(data.tache96Content ?? ""),
    tache96SnowId: String(data.tache96SnowId ?? ""),
    lastRevuAt:
      typeof data.lastRevuAt === "string" ? data.lastRevuAt : null,
    wctLink: String(data.wctLink ?? ""),
    addressConfirmation,
    additionalInformation:
      data.additionalInformation ?? data.informationsSupplementaires ?? "",
    cure: normalizedCure,
    cureRecords: normalizeCureRecords(
      data.cureRecords,
      normalizedCure,
      convertTimestampToString(data.curePendingSince),
    ),
    curePendingSince:
      convertTimestampToString(data.curePendingSince) ?? null,
    smsEnabled: data.smsEnabled ?? data.sms ?? false,
    mailbox:
      data.mailbox ?? data.mailBox ?? data.box ??
      extractLegacyAddressDetail(addressDetails, "Bo[iî]te"),
    floor:
      data.floor ?? data.etage ??
      extractLegacyAddressDetail(addressDetails, "[ÉE]tage"),
    apartment:
      data.apartment ?? data.appartement ??
      extractLegacyAddressDetail(addressDetails, "Appartement"),
    blockNumber:
      data.blockNumber ?? data.block ??
      extractLegacyAddressDetail(addressDetails, "Bloc"),
  };
};

export const mapIntervention = (
  documentId: string,
  dateKey: string,
  rawData: Record<string, any>,
): Intervention => {
  const data = normalizeLegacyFields(rawData);
  const { createdAt, updatedAt, ...interventionData } = data;
  return {
    ...interventionData,
    documentId,
    dateKey,
    createdAt: convertTimestampToString(createdAt),
    updatedAt: convertTimestampToString(updatedAt),
    isEditing: false,
    isHistoryView: false,
    mode: "VIEW_HISTORY",
    draftSnapshot: null,
    draftMode: null,
    draftEditSnapshot: null,
    editSnapshot: null,
    hasDraft: false,
    draftState: { active: null, displaced: null },
  } as Intervention;
};

export const stripUiFields = (intervention: Intervention) => {
  const {
    documentId: _documentId,
    isEditing: _isEditing,
    isHistoryView: _isHistoryView,
    mode: _mode,
    draftSnapshot: _draftSnapshot,
    draftMode: _draftMode,
    draftEditSnapshot: _draftEditSnapshot,
    editSnapshot: _editSnapshot,
    hasDraft: _hasDraft,
    draftState: _draftState,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    dateKey: _dateKey,
    ...interventionData
  } = intervention;
  return interventionData;
};

