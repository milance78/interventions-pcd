import type { Intervention } from "./types";
import { interventionActivityValue, interventionLogicalKey } from "../../utils/interventionIdentity";

/** Merge historical occurrences with the latest known state without changing day membership. */
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
      interventionActivityValue(intervention) > interventionActivityValue(current)
    ) {
      latestByKey.set(key, intervention);
    }
  });

  return occurrences.map((occurrence) => {
    const latest = latestByKey.get(interventionLogicalKey(occurrence));
    if (!latest) return occurrence;

    return {
      ...occurrence,
      ...latest,
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
