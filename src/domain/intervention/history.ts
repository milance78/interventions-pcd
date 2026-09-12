import type { Intervention } from "./types";

export interface HistoryDay {
  dateKey: string;
  interventions: Intervention[];
}
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


/** Return history date keys in newest-first order. */
export const sortHistoryDateKeys = (dateKeys: string[]): string[] =>
  [...dateKeys].sort((a, b) => b.localeCompare(a));


/** Keep only successfully loaded history days that contain interventions. */
export const filterHistoryDays = (days: Array<HistoryDay | null>): HistoryDay[] =>
  days.filter((day): day is HistoryDay => Boolean(day) && day.interventions.length > 0);


/** Keep loaded history days in newest-first order. */
export const normalizeHistoryDays = (days: Array<HistoryDay | null>): HistoryDay[] =>
  filterHistoryDays(days).sort((a, b) => b.dateKey.localeCompare(a.dateKey));

export const createHistoryDay = <T>(dateKey: string, interventions: T[]): HistoryDay & { interventions: T[] } => ({
  dateKey,
  interventions,
});

/** Wrap a history-day loader so one failed day does not abort the archive. */
export const loadHistoryDaySafely = async <T>(
  dateKey: string,
  loader: (dateKey: string) => Promise<T[]>,
  onError: (error: unknown, dateKey: string) => void = () => undefined,
): Promise<(HistoryDay & { interventions: T[] }) | null> => {
  try {
    return createHistoryDay(dateKey, await loader(dateKey));
  } catch (error) {
    onError(error, dateKey);
    return null;
  }
};

/** Load all history days while isolating failures per date. */
export const loadHistoryDaysSafely = async <T>(
  dateKeys: string[],
  loader: (dateKey: string) => Promise<T[]>,
  onError: (error: unknown, dateKey: string) => void = () => undefined,
): Promise<Array<HistoryDay & { interventions: T[] } | null>> =>
  Promise.all(dateKeys.map((dateKey) => loadHistoryDaySafely(dateKey, loader, onError)));


/** Extract Firestore history day IDs without changing their order. */
export const extractHistoryDateKeys = <T extends { id: string }>(documents: T[]): string[] =>
  documents.map((document) => document.id);
