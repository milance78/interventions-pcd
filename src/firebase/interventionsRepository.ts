import { collection, doc, serverTimestamp, setDoc, type WriteBatch } from "firebase/firestore";

import { db } from "./firebaseConfig";

/**
 * Firestore path definitions for intervention data.
 * This module deliberately contains no intervention business rules: it only
 * describes where intervention data lives.
 */
export const getDaysReference = (userId: string) =>
  collection(db, "users", userId, "days");

export const getDayReference = (userId: string, date: string) =>
  doc(db, "users", userId, "days", date);

export const getInterventionsReference = (userId: string, date: string) =>
  collection(db, "users", userId, "days", date, "interventions");

export const getSummaryReference = (userId: string, date: string) =>
  doc(db, "users", userId, "days", date, "summary", "daily");

export const getActiveReference = (userId: string) =>
  collection(db, "users", userId, "activeInterventions");

export const getVersionsReference = (userId: string, caseId: string) =>
  collection(db, "users", userId, "interventionVersions", caseId, "versions");


export const getInterventionReference = (userId: string, date: string, documentId: string) =>
  doc(getInterventionsReference(userId, date), documentId);

export const getActiveInterventionReference = (userId: string, caseId: string) =>
  doc(getActiveReference(userId), caseId);

export const getVersionReference = (userId: string, caseId: string) =>
  doc(getVersionsReference(userId, caseId));

export const getStoredCaseId = (snapshot: { exists: () => boolean; data: () => Record<string, any> }, fallbackId: string) =>
  snapshot.exists() ? snapshot.data().caseId ?? fallbackId : fallbackId;

export const writeInterventionVersion = (
  batch: WriteBatch,
  userId: string,
  caseId: string,
  dateKey: string,
  data: Record<string, unknown>,
  source: "CREATE" | "TODAY_EDIT" | "SEARCH_EDIT",
) => {
  batch.set(getVersionReference(userId, caseId), {
    caseId,
    dateKey,
    source,
    savedAt: serverTimestamp(),
    data,
  });
};


export const writeDailySummary = async (
  userId: string,
  date: string,
  summary: Record<string, unknown>,
) => {
  await setDoc(
    getSummaryReference(userId, date),
    { ...summary, lastUpdated: serverTimestamp() },
    { merge: true },
  );
};
