import type { Intervention, InterventionData } from "./types";

export type RevisionSource = {
  revisionId: string;
  changedAt: string | null;
  previousDateKey: string;
  snapshot: InterventionData;
};

export const buildLegacyRevisions = (
  history: Array<{ interventions: Intervention[] }>,
  documentId: string,
  interventionId: string,
  oagID: string,
): RevisionSource[] => {
  const normalizedInterventionId = interventionId.trim().toLowerCase();
  const normalizedOagId = oagID.trim().toLowerCase();

  return history
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
};

export const mergeAndSortRevisions = (
  revisions: RevisionSource[],
): RevisionSource[] => {
  const unique = new Map<string, RevisionSource>();
  revisions.forEach((revision) => {
    const key = `${revision.previousDateKey}-${revision.changedAt}-${revision.snapshot.comment}-${revision.snapshot.additionalInformation}`;
    if (!unique.has(key)) unique.set(key, revision);
  });

  return Array.from(unique.values()).sort((a, b) =>
    (b.changedAt ?? b.previousDateKey).localeCompare(a.changedAt ?? a.previousDateKey),
  );
};
