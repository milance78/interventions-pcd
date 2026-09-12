import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";

import { db } from "./firebaseConfig";
import {
  getActiveInterventionReference,
  getDayReference,
  getInterventionReference,
  getStoredCaseId,
  writeInterventionVersion,
} from "./interventionsRepository";
import { stripUiFields } from "../domain/intervention/serialization";
import type { Intervention } from "../domain/intervention/types";

type RevisionType = "TODAY_EDIT" | "SEARCH_EDIT";

type SummaryUpdater = () => void;

const commitBatch = async (
  build: (batch: ReturnType<typeof writeBatch>) => void,
): Promise<void> => {
  const batch = writeBatch(db);
  build(batch);
  await batch.commit();
};

/** Persist deletion of one dated occurrence and remove its active search record. */
export const persistInterventionDeletion = async (
  userId: string,
  date: string,
  documentId: string,
  onSummaryUpdate?: SummaryUpdater,
) => {
  const snapshotRef = getInterventionReference(userId, date, documentId);
  const snapshot = await getDoc(snapshotRef);
  const caseId = getStoredCaseId(snapshot, documentId);
  await commitBatch((batch) => {
    batch.delete(snapshotRef);
    batch.delete(getActiveInterventionReference(userId, caseId));
    batch.set(getDayReference(userId, date), { date, updatedAt: serverTimestamp() }, { merge: true });
  });
  onSummaryUpdate?.();
  return caseId;
};

/** Persist a normal intervention edit and its revision in one atomic batch. */
export const persistInterventionSnapshot = async (
  userId: string,
  date: string,
  documentId: string,
  intervention: Intervention,
  revisionType: RevisionType,
  includeDay = true,
  onSummaryUpdate?: SummaryUpdater,
) => {
  const snapshotRef = getInterventionReference(userId, date, documentId);
  const snapshot = await getDoc(snapshotRef);
  const caseId = getStoredCaseId(snapshot, documentId);
  const activeRef = getActiveInterventionReference(userId, caseId);
  const data = stripUiFields(intervention);
  await commitBatch((batch) => {
    batch.set(snapshotRef, { ...data, caseId, updatedAt: serverTimestamp() }, { merge: true });
    batch.set(activeRef, { ...data, caseId, currentDateKey: date, updatedAt: serverTimestamp() }, { merge: true });
    if (includeDay) {
      batch.set(getDayReference(userId, date), { date, updatedAt: serverTimestamp() }, { merge: true });
    }
    writeInterventionVersion(batch, userId, caseId, date, data, revisionType);
  });
  onSummaryUpdate?.();
  return caseId;
};

/** Persist the reviewed flag without changing the day marker or summary. */
export const persistReviewedIntervention = async (
  userId: string,
  date: string,
  documentId: string,
  intervention: Intervention,
) => {
  if (!documentId) throw new Error("Missing Firestore document ID");
  await persistInterventionSnapshot(userId, date, documentId, intervention, "TODAY_EDIT", false);
};
