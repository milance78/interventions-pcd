import type { Intervention, InterventionData } from "./types";

export interface InterventionRevision {
  revisionId: string;
  changedAt: string | null;
  previousDateKey: string;
  snapshot: InterventionData;
}

/**
 * Merge stored revisions with legacy historical occurrences.
 * This function is deliberately side-effect free; Firebase loading remains in
 * the service layer.
 */
export const mergeInterventionRevisions = (
  storedRevisions: InterventionRevision[],
  history: Array<{ interventions: Intervention[] }>,
  documentId: string,
  interventionId = "",
  oagID = "",
): InterventionRevision[] => {
  const normalizedInterventionId = interventionId.trim().toLowerCase();
  const normalizedOagId = oagID.trim().toLowerCase();
  const legacy: InterventionRevision[] = history
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
  [...storedRevisions, ...legacy].forEach((revision) => {
    const key = `${revision.previousDateKey}-${revision.changedAt}-${revision.snapshot.comment}-${revision.snapshot.additionalInformation}`;
    if (!unique.has(key)) unique.set(key, revision);
  });

  return Array.from(unique.values()).sort((a, b) =>
    (b.changedAt ?? b.previousDateKey).localeCompare(a.changedAt ?? a.previousDateKey),
  );
};
