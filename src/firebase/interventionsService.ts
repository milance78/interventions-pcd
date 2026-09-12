import {
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  writeBatch,
} from "firebase/firestore";

import { db } from "./firebaseConfig";
import {
  getActiveInterventionReference,
  getActiveReference,
  getDayReference,
  getInterventionsReference,
  getInterventionReference,
  getStoredCaseId,
  getSummaryReference,
  getVersionsReference,
  getDaysReference,
  writeInterventionVersion,
  writeDailySummary,
} from "./interventionsRepository";
import { convertTimestampToString, mapIntervention, normalizeLegacyFields, stripUiFields } from "../domain/intervention/serialization";
import type { Intervention, InterventionData } from "../domain/intervention/types";

import { getLocalDateKey } from "../domain/intervention/dateKey";
import { calculateDailySummary } from "../domain/intervention/summary";
import { extractHistoryDateKeys, loadHistoryDaysSafely, normalizeHistoryDays, sortHistoryDateKeys } from "../domain/intervention/history";
import type { HistoryDay } from "../domain/intervention/history";
import { mergeInterventionRevisions } from "../domain/intervention/revisions";

const updateSummaryInBackground = (userId: string, date: string) => {
  // A daily score is a snapshot. Once the calendar day has passed, later
  // edits must never recalculate that day's score.
  if (date !== getLocalDateKey()) return;
  void recalculateDailySummary(userId, date).catch((error) => {
    console.error("Daily summary update failed:", error);
  });
};

const persistInterventionDeletion = async (
  userId: string,
  date: string,
  documentId: string,
) => {
  const snapshotRef = getInterventionReference(userId, date, documentId);
  const snapshot = await getDoc(snapshotRef);
  const caseId = getStoredCaseId(snapshot, documentId);
  const batch = writeBatch(db);

  batch.delete(snapshotRef);
  // Removing a historical occurrence also removes its active searchable record.
  batch.delete(getActiveInterventionReference(userId, caseId));
  batch.set(getDayReference(userId, date), { date, updatedAt: serverTimestamp() }, { merge: true });
  await batch.commit();
  updateSummaryInBackground(userId, date);
  return caseId;
};

const persistInterventionSnapshot = async (
  userId: string,
  date: string,
  documentId: string,
  intervention: Intervention,
  revisionType: "TODAY_EDIT" | "SEARCH_EDIT",
  includeDay = true,
) => {
  const snapshotRef = getInterventionReference(userId, date, documentId);
  const snapshot = await getDoc(snapshotRef);
  const caseId = getStoredCaseId(snapshot, documentId);
  const activeRef = getActiveInterventionReference(userId, caseId);
  const data = stripUiFields(intervention);
  const batch = writeBatch(db);

  batch.set(snapshotRef, { ...data, caseId, updatedAt: serverTimestamp() }, { merge: true });
  batch.set(activeRef, { ...data, caseId, currentDateKey: date, updatedAt: serverTimestamp() }, { merge: true });
  if (includeDay) {
    batch.set(getDayReference(userId, date), { date, updatedAt: serverTimestamp() }, { merge: true });
  }
  writeInterventionVersion(batch, userId, caseId, date, data, revisionType);
  await batch.commit();
  updateSummaryInBackground(userId, date);
  return caseId;
};

export const createIntervention = async (
  userId: string,
  date: string,
  intervention: Intervention,
) => {
  const snapshotRef = doc(getInterventionsReference(userId, date));
  const caseId = snapshotRef.id;
  const activeRef = getActiveInterventionReference(userId, caseId);
  const batch = writeBatch(db);
  const data = stripUiFields(intervention);

  batch.set(getDayReference(userId, date), { date, updatedAt: serverTimestamp() }, { merge: true });
  batch.set(snapshotRef, { ...data, caseId, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  batch.set(activeRef, { ...data, caseId, currentDateKey: date, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
  writeInterventionVersion(batch, userId, caseId, date, data, "CREATE");
  await batch.commit();

  updateSummaryInBackground(userId, date);
  return caseId;
};

export const loadInterventions = async (userId: string, date: string): Promise<Intervention[]> => {
  const snapshot = await getDocs(getInterventionsReference(userId, date));
  return snapshot.docs.map((item) => mapIntervention(getStoredCaseId(item, item.id), date, item.data()));
};

export const loadHistoryDateKeys = async (userId: string): Promise<string[]> => {
  const daysSnapshot = await getDocs(getDaysReference(userId));
  return sortHistoryDateKeys(extractHistoryDateKeys(daysSnapshot.docs));
};

export const loadCompleteHistory = async (
  userId: string,
  suppliedDateKeys?: string[],
): Promise<HistoryDay[]> => {
  const dateKeys = suppliedDateKeys ?? await loadHistoryDateKeys(userId);
  const days = await loadHistoryDaysSafely(
    dateKeys,
    (key) => loadInterventions(userId, key),
    (error, key) => console.error(`Unable to load history day ${key}:`, error),
  );
  return normalizeHistoryDays(days);
};


export { hydrateOccurrencesWithLatestState } from "../domain/intervention/history";

export const deleteIntervention = async (userId: string, date: string, documentId: string) => {
  await persistInterventionDeletion(userId, date, documentId);
};

export const updateIntervention = async (
  userId: string,
  date: string,
  documentId: string,
  intervention: Intervention,
) => {
  await persistInterventionSnapshot(userId, date, documentId, intervention, "TODAY_EDIT");
};

export const markInterventionReviewed = async (
  userId: string,
  date: string,
  documentId: string,
  intervention: Intervention,
) => {
  if (!documentId) throw new Error("Missing Firestore document ID");
  const snapshotRef = getInterventionReference(userId, date, documentId);
  const snapshot = await getDoc(snapshotRef);
  const caseId = getStoredCaseId(snapshot, documentId);
  const activeRef = getActiveInterventionReference(userId, caseId);
  const data = stripUiFields(intervention);
  const batch = writeBatch(db);
  batch.set(snapshotRef, { ...data, caseId, updatedAt: serverTimestamp() }, { merge: true });
  batch.set(activeRef, { ...data, caseId, currentDateKey: date, updatedAt: serverTimestamp() }, { merge: true });
  writeInterventionVersion(batch, userId, caseId, date, data, "TODAY_EDIT");
  await batch.commit();
  return { ...intervention, updatedAt: new Date().toISOString(), dateKey: date };
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
  const versions: InterventionRevision[] = versionsSnapshot.docs.map((item) => {
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
  return mergeInterventionRevisions(versions, history, documentId, interventionId, oagID);
};

export const updateSearchInterventionAndMoveToToday = async (
  userId: string,
  originalDate: string,
  today: string,
  intervention: Intervention,
): Promise<Intervention> => {
  if (!intervention.documentId) throw new Error("Missing Firestore document ID");

  const originalSnapshotRef = getInterventionReference(userId, originalDate, intervention.documentId);
  const originalSnapshot = await getDoc(originalSnapshotRef);
  const caseId = getStoredCaseId(originalSnapshot, intervention.documentId);
  const activeRef = getActiveInterventionReference(userId, caseId);
  const activeSnapshot = await getDoc(activeRef);
  const currentData: Record<string, any> = activeSnapshot.exists()
    ? activeSnapshot.data()
    : stripUiFields(intervention);
  const todaySnapshotRef = getInterventionReference(userId, today, caseId);
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
  writeInterventionVersion(batch, userId, caseId, today, data, "SEARCH_EDIT");
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
  const summary = calculateDailySummary(snapshot.docs.map((documentSnapshot) => documentSnapshot.data()));
  await writeDailySummary(userId, date, summary);
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

import { prepareSearchValue, numericPart } from "../domain/intervention/search";
import { interventionActivityValue } from "../utils/interventionIdentity";
export type SearchCriterion = {
  label: "Intervention ID" | "OAG ID" | "Snow mentionné" | "Snow à mon nom" | "Snow créé";
  value: string;
};

export type SearchInterventionResult = {
  intervention: Intervention;
  criterion: SearchCriterion;
};

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
          getInterventionReference(userId, dateKey, result.intervention.documentId),
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
