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
    isSnow: isSnowReceivedPending || isSnowSentPending,
    comment,
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

export const loadCompleteHistory = async (userId: string): Promise<HistoryDay[]> => {
  const daysSnapshot = await getDocs(collection(db, "users", userId, "days"));
  const days = await Promise.all(
    daysSnapshot.docs.map(async (dayDocument) => ({
      dateKey: dayDocument.id,
      interventions: await loadInterventions(userId, dayDocument.id),
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
  await deleteDoc(doc(getInterventionsReference(userId, date), documentId));
  await setDoc(getDayReference(userId, date), { date, updatedAt: serverTimestamp() }, { merge: true });
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
  const active = activeSnapshot.docs.map((item) => {
    const data = item.data();
    return mapIntervention(item.id, data.currentDateKey ?? "", data);
  });

  // Non-destructive compatibility migration: dated legacy snapshots stay untouched.
  // We merge them with the new active collection, so old data remains searchable even
  // after the user has already created records in the V2 structure.
  const history = (await loadCompleteHistory(userId)).flatMap((day) => day.interventions);
  const latestByLogicalKey = new Map<string, Intervention>();

  [...history, ...active].forEach((item) => {
    const key = interventionLogicalKey(item);
    const current = latestByLogicalKey.get(key);
    if (!current || interventionActivityValue(item) > interventionActivityValue(current)) {
      latestByLogicalKey.set(key, item);
    }
  });

  const activeCaseIds = new Set(active.map((item) => item.documentId));
  const missingFromActive = Array.from(latestByLogicalKey.values()).filter(
    (item) => !activeCaseIds.has(item.documentId),
  );

  if (missingFromActive.length > 0) {
    const batch = writeBatch(db);
    missingFromActive.forEach((item) => {
      const caseId = item.documentId;
      batch.set(doc(getActiveReference(userId), caseId), {
        ...stripUiFields(item),
        caseId,
        currentDateKey: item.dateKey ?? "",
        createdAt: item.createdAt,
        updatedAt: item.updatedAt ?? item.createdAt,
        migratedFromLegacy: true,
      }, { merge: true });
    });
    await batch.commit();
  }

  return Array.from(latestByLogicalKey.values());
};

export const searchInterventions = async (userId: string, searchValue: string): Promise<Intervention[]> => {
  const normalizedSearchValue = searchValue.trim().toLowerCase();
  if (!normalizedSearchValue) return [];
  const active = await loadLatestInterventions(userId);
  return active
    .filter((intervention) => {
      const interventionId = intervention.interventionId?.trim().toLowerCase() ?? "";
      const oagId = intervention.oagID?.trim().toLowerCase() ?? "";
      return interventionId === normalizedSearchValue || oagId === normalizedSearchValue;
    })
    .sort((first, second) => interventionActivityValue(second).localeCompare(interventionActivityValue(first)));
};
