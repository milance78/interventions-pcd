import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
} from "firebase/firestore";

import { db } from "./firebaseConfig";
import type { Intervention, InterventionData } from "../redux/features/newInterventionSlice";
import { parseLegacyAddressClients, serializeAddressClients } from "../utils/addressClients";
import { normalizeCureRecords } from "../utils/cureRecords";
import { composeMainAddress, normalizeNaNumber, parseMainAddress } from "../utils/interventionAddress";
import {
  interventionActivityValue,
  interventionLogicalKey,
} from "../utils/interventionIdentity";

const getDayReference = (userId: string, date: string) =>
  doc(db, "users", userId, "days", date);
const getInterventionsReference = (userId: string, date: string) =>
  collection(db, "users", userId, "days", date, "interventions");
const getSummaryReference = (userId: string, date: string) =>
  doc(db, "users", userId, "days", date, "summary", "daily");
const getActiveReference = (userId: string) =>
  collection(db, "users", userId, "activeInterventions");
const getVersionsReference = (userId: string, caseId: string) =>
  collection(db, "users", userId, "interventionVersions", caseId, "versions");

const convertTimestampToString = (timestamp: any): string | null => {
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

const normalizeLegacyFields = (data: Record<string, any>): Record<string, any> => {
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

  const normalizedCure =
    data.cure === "CURE1"
      ? "firstCure"
      : data.cure === "CURE2"
        ? "secondCure"
        : data.cure === "CURE3"
          ? "thirdCure"
          : data.cure ?? data.Cure ?? "noCure";

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
    isSnowReceivedPending,
    isSnowSentPending,
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

const mapIntervention = (
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
    editSnapshot: null,
    hasDraft: false,
  } as Intervention;
};

const stripUiFields = (intervention: Intervention) => {
  const {
    documentId: _documentId,
    isEditing: _isEditing,
    isHistoryView: _isHistoryView,
    mode: _mode,
    draftSnapshot: _draftSnapshot,
    editSnapshot: _editSnapshot,
    hasDraft: _hasDraft,
    createdAt: _createdAt,
    updatedAt: _updatedAt,
    dateKey: _dateKey,
    ...interventionData
  } = intervention;
  return interventionData;
};

const updateSummaryInBackground = (userId: string, date: string) => {
  void recalculateDailySummary(userId, date).catch((error) => {
    console.error("Daily summary update failed:", error);
  });
};

const writeVersion = (
  batch: ReturnType<typeof writeBatch>,
  userId: string,
  caseId: string,
  dateKey: string,
  data: Record<string, any>,
  source: "CREATE" | "TODAY_EDIT" | "SEARCH_EDIT",
) => {
  const versionRef = doc(getVersionsReference(userId, caseId));
  batch.set(versionRef, {
    caseId,
    dateKey,
    source,
    savedAt: serverTimestamp(),
    data,
  });
};

export const createIntervention = async (
  userId: string,
  date: string,
  intervention: Intervention,
) => {
  const snapshotRef = doc(getInterventionsReference(userId, date));
  const caseId = snapshotRef.id;
  const activeRef = doc(getActiveReference(userId), caseId);
  const batch = writeBatch(db);
  const data = stripUiFields(intervention);

  batch.set(getDayReference(userId, date), { date, updatedAt: serverTimestamp() }, { merge: true });
  batch.set(snapshotRef, { ...data, caseId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  batch.set(activeRef, { ...data, caseId, currentDateKey: date, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  writeVersion(batch, userId, caseId, date, data, "CREATE");
  await batch.commit();

  updateSummaryInBackground(userId, date);
  return caseId;
};

export const loadInterventions = async (userId: string, date: string): Promise<Intervention[]> => {
  const snapshot = await getDocs(getInterventionsReference(userId, date));
  return snapshot.docs.map((item) => mapIntervention(item.data().caseId ?? item.id, date, item.data()));
};

export interface HistoryDay {
  dateKey: string;
  interventions: Intervention[];
}

export const loadHistoryDateKeys = async (userId: string): Promise<string[]> => {
  const daysSnapshot = await getDocs(collection(db, "users", userId, "days"));
  return daysSnapshot.docs
    .map((dayDocument) => dayDocument.id)
    .sort((a, b) => b.localeCompare(a));
};

export const loadCompleteHistory = async (
  userId: string,
  suppliedDateKeys?: string[],
): Promise<HistoryDay[]> => {
  const dateKeys = suppliedDateKeys ?? await loadHistoryDateKeys(userId);
  const days = await Promise.all(
    dateKeys.map(async (dateKey) => ({
      dateKey,
      interventions: await loadInterventions(userId, dateKey),
    })),
  );
  return days
    .filter((day) => day.interventions.length > 0)
    .sort((a, b) => b.dateKey.localeCompare(a.dateKey));
};


export const hydrateOccurrencesWithLatestState = (
  occurrences: Intervention[],
  latestInterventions: Intervention[],
): Intervention[] => {
  const latestByKey = new Map<string, Intervention>();

  latestInterventions.forEach((intervention) => {
    const key = interventionLogicalKey(intervention);
    const current = latestByKey.get(key);

    if (
      !current ||
      interventionActivityValue(intervention) >
        interventionActivityValue(current)
    ) {
      latestByKey.set(key, intervention);
    }
  });

  return occurrences.map((occurrence) => {
    const latest = latestByKey.get(
      interventionLogicalKey(occurrence),
    );

    if (!latest) return occurrence;

    return {
      ...occurrence,
      ...latest,
      // Membership in History/Today remains attached to its original day.
      documentId: occurrence.documentId,
      dateKey: occurrence.dateKey,
      createdAt: occurrence.createdAt ?? latest.createdAt,
      isEditing: false,
      isHistoryView: false,
      mode: "VIEW_HISTORY",
      draftSnapshot: null,
      editSnapshot: null,
      hasDraft: false,
    };
  });
};

export const deleteIntervention = async (userId: string, date: string, documentId: string) => {
  const snapshotRef = doc(getInterventionsReference(userId, date), documentId);
  const snapshot = await getDoc(snapshotRef);
  const caseId = snapshot.exists() ? snapshot.data().caseId ?? documentId : documentId;
  const batch = writeBatch(db);

  batch.delete(snapshotRef);
  // A deletion from Historique is a real deletion of the intervention from the
  // searchable active index as well. Otherwise the active document survives
  // and the deleted card keeps reappearing in Recherche.
  batch.delete(doc(getActiveReference(userId), caseId));
  batch.set(getDayReference(userId, date), { date, updatedAt: serverTimestamp() }, { merge: true });
  await batch.commit();
  updateSummaryInBackground(userId, date);
};

export const updateIntervention = async (
  userId: string,
  date: string,
  documentId: string,
  intervention: Intervention,
) => {
  const snapshotRef = doc(getInterventionsReference(userId, date), documentId);
  const snapshot = await getDoc(snapshotRef);
  const caseId = snapshot.exists() ? snapshot.data().caseId ?? documentId : documentId;
  const activeRef = doc(getActiveReference(userId), caseId);
  const data = stripUiFields(intervention);
  const batch = writeBatch(db);

  batch.set(snapshotRef, { ...data, caseId, updatedAt: serverTimestamp() }, { merge: true });
  batch.set(activeRef, { ...data, caseId, currentDateKey: date, updatedAt: serverTimestamp() }, { merge: true });
  batch.set(getDayReference(userId, date), { date, updatedAt: serverTimestamp() }, { merge: true });
  writeVersion(batch, userId, caseId, date, data, "TODAY_EDIT");
  await batch.commit();
  updateSummaryInBackground(userId, date);
};

export interface InterventionRevision {
  revisionId: string;
  changedAt: string | null;
  previousDateKey: string;
  snapshot: InterventionData;
}

export const loadInterventionRevisions = async (
  userId: string,
  documentId: string,
  interventionId = "",
  oagID = "",
): Promise<InterventionRevision[]> => {
  const versionsSnapshot = await getDocs(getVersionsReference(userId, documentId));
  const versions = versionsSnapshot.docs.map((item) => {
    const raw = item.data();
    const data = normalizeLegacyFields(raw.data ?? raw.snapshot ?? {});
    return {
      revisionId: item.id,
      changedAt: convertTimestampToString(raw.savedAt ?? raw.changedAt),
      previousDateKey: raw.dateKey ?? raw.previousDateKey ?? "",
      snapshot: { ...data, documentId, dateKey: raw.dateKey ?? raw.previousDateKey ?? "" } as InterventionData,
    };
  });

  const history = await loadCompleteHistory(userId);
  const normalizedInterventionId = interventionId.trim().toLowerCase();
  const normalizedOagId = oagID.trim().toLowerCase();
  const legacy = history
    .flatMap((day) => day.interventions)
    .filter((item) => {
      if (item.documentId === documentId) return true;
      if (normalizedInterventionId && item.interventionId?.trim().toLowerCase() === normalizedInterventionId) return true;
      return Boolean(normalizedOagId && item.oagID?.trim().toLowerCase() === normalizedOagId);
    })
    .map((item) => ({
      revisionId: `legacy-${item.dateKey}-${item.documentId}`,
      changedAt: item.updatedAt ?? item.createdAt,
      previousDateKey: item.dateKey ?? "",
      snapshot: item as InterventionData,
    }));

  const unique = new Map<string, InterventionRevision>();
  [...versions, ...legacy].forEach((revision) => {
    const key = `${revision.previousDateKey}-${revision.changedAt}-${revision.snapshot.comment}-${revision.snapshot.additionalInformation}`;
    if (!unique.has(key)) unique.set(key, revision);
  });
  return Array.from(unique.values()).sort((a, b) => (b.changedAt ?? b.previousDateKey).localeCompare(a.changedAt ?? a.previousDateKey));
};

export const updateSearchInterventionAndMoveToToday = async (
  userId: string,
  originalDate: string,
  today: string,
  intervention: Intervention,
): Promise<Intervention> => {
  if (!intervention.documentId) throw new Error("Missing Firestore document ID");

  const originalSnapshotRef = doc(
    getInterventionsReference(userId, originalDate),
    intervention.documentId,
  );
  const originalSnapshot = await getDoc(originalSnapshotRef);
  const caseId = originalSnapshot.exists()
    ? originalSnapshot.data().caseId ?? intervention.documentId
    : intervention.documentId;
  const activeRef = doc(getActiveReference(userId), caseId);
  const activeSnapshot = await getDoc(activeRef);
  const currentData: Record<string, any> = activeSnapshot.exists()
    ? activeSnapshot.data()
    : stripUiFields(intervention);
  const todaySnapshotRef = doc(getInterventionsReference(userId, today), caseId);
  const data = stripUiFields(intervention);
  const batch = writeBatch(db);

  // The old day snapshot is intentionally never deleted or overwritten.
  batch.set(todaySnapshotRef, {
    ...data,
    caseId,
    createdAt: currentData.createdAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  batch.set(activeRef, {
    ...data,
    caseId,
    currentDateKey: today,
    createdAt: currentData.createdAt ?? serverTimestamp(),
    updatedAt: serverTimestamp(),
  }, { merge: true });
  batch.set(getDayReference(userId, today), { date: today, updatedAt: serverTimestamp() }, { merge: true });
  writeVersion(batch, userId, caseId, today, data, "SEARCH_EDIT");
  await batch.commit();

  updateSummaryInBackground(userId, today);
  const now = new Date().toISOString();
  return {
    ...intervention,
    documentId: caseId,
    dateKey: today,
    updatedAt: now,
    createdAt: convertTimestampToString(currentData.createdAt) ?? intervention.createdAt,
    isEditing: false,
    isHistoryView: true,
    mode: "VIEW_HISTORY",
  };
};

export const recalculateDailySummary = async (userId: string, date: string) => {
  const snapshot = await getDocs(getInterventionsReference(userId, date));
  const summary = { total: 0, completed: 0, onHold: 0, transferred: 0, closedByAnotherAgent: 0, lastUpdated: null as null | ReturnType<typeof serverTimestamp> };
  snapshot.docs.forEach((documentSnapshot) => {
    const intervention = documentSnapshot.data();
    summary.total += 1;
    switch (intervention.status) {
      case "completed": summary.completed += 1; break;
      case "on hold": summary.onHold += 1; break;
      case "transferred": summary.transferred += 1; break;
      case "closed by another agent": summary.closedByAnotherAgent += 1; break;
      default: break;
    }
  });
  await setDoc(getSummaryReference(userId, date), { ...summary, lastUpdated: serverTimestamp() }, { merge: true });
};

export const loadDailySummary = async (userId: string, date: string) => {
  const snapshot = await getDoc(getSummaryReference(userId, date));
  return snapshot.exists() ? snapshot.data() : null;
};

export const loadLatestInterventions = async (userId: string): Promise<Intervention[]> => {
  const activeSnapshot = await getDocs(getActiveReference(userId));
  return activeSnapshot.docs.map((item) => {
    const data = item.data();
    return mapIntervention(item.id, data.currentDateKey ?? "", data);
  });
};

export type SearchCriterion = {
  label: "Intervention ID" | "OAG ID" | "Snow mentionné" | "Snow à mon nom" | "Snow créé";
  value: string;
};

export type SearchInterventionResult = {
  intervention: Intervention;
  criterion: SearchCriterion;
};

type SearchMode = "exact" | "digits";

const prepareSearchValue = (rawValue: string): { value: string; mode: SearchMode } => {
  const trimmed = rawValue.trim();

  if (trimmed.length === 18) {
    return { value: trimmed, mode: "exact" };
  }

  if (trimmed.length === 17) {
    return { value: `${trimmed}9`, mode: "exact" };
  }

  return { value: trimmed.replace(/\D/g, ""), mode: "digits" };
};

const numericPart = (value?: string | null) => (value ?? "").replace(/\D/g, "");

export const searchInterventions = async (
  userId: string,
  searchValue: string,
): Promise<SearchInterventionResult[]> => {
  const prepared = prepareSearchValue(searchValue);
  if (!prepared.value) return [];

  const active = await loadLatestInterventions(userId);

  const rawTrimmed = searchValue.trim();
  const rawHasLetters = /[A-Za-z]/.test(rawTrimmed);

  const matchMainIdentifier = (candidate?: string | null) => {
    const trimmedCandidate = candidate?.trim() ?? "";
    if (!trimmedCandidate) return false;

    if (prepared.mode === "exact") {
      return trimmedCandidate === prepared.value;
    }

    // Numeric fallback is intended for genuinely numeric identifiers.
    // Do not collapse two different alphanumeric OAG values to the same digit
    // sequence (e.g. ...Z9US9 versus ...U9CS9). If the user supplied letters,
    // an alphanumeric identifier must match literally. Snow still uses digits.
    if (rawHasLetters && /[A-Za-z]/.test(trimmedCandidate)) {
      return trimmedCandidate.toLowerCase() === rawTrimmed.toLowerCase();
    }

    return numericPart(trimmedCandidate) === prepared.value;
  };

  const matches: SearchInterventionResult[] = [];

  active.forEach((intervention) => {
    let criterion: SearchCriterion | null = null;

    if (matchMainIdentifier(intervention.interventionId)) {
      criterion = {
        label: "Intervention ID",
        value: intervention.interventionId.trim(),
      };
    } else if (matchMainIdentifier(intervention.oagID)) {
      criterion = {
        label: "OAG ID",
        value: intervention.oagID.trim(),
      };
    } else {
      const snowCandidates: Array<[SearchCriterion["label"], string]> = [
        ["Snow mentionné", intervention.snowMentioned ?? ""],
        ["Snow à mon nom", intervention.snowReceived ?? ""],
        ["Snow créé", intervention.snowSent ?? ""],
      ];

      const snowMatch = snowCandidates.find(([, value]) => {
        const digits = numericPart(value);
        return Boolean(digits) && digits === prepared.value;
      });

      if (snowMatch) {
        criterion = { label: snowMatch[0], value: numericPart(snowMatch[1]) };
      }
    }

    if (criterion) {
      matches.push({ intervention, criterion });
    }
  });

  // The active index may contain legacy stale documents created by older
  // versions of the app. Before exposing a Search result, verify that its
  // current dated occurrence still exists. This also makes old deletions from
  // Historique disappear from Recherche without requiring a manual migration.
  const verified = (
    await Promise.all(
      matches.map(async (result) => {
        const dateKey = result.intervention.dateKey ?? "";
        if (!dateKey || !result.intervention.documentId) return null;
        const snapshot = await getDoc(
          doc(getInterventionsReference(userId, dateKey), result.intervention.documentId),
        );
        return snapshot.exists() ? result : null;
      }),
    )
  ).filter((result): result is SearchInterventionResult => Boolean(result));

  return verified.sort((first, second) =>
    interventionActivityValue(second.intervention).localeCompare(
      interventionActivityValue(first.intervention),
    ),
  );
};
