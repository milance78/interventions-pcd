import type { Intervention } from "../redux/features/newInterventionSlice";
import {
  interventionActivityValue,
  interventionLogicalKey,
} from "./interventionIdentity";

export type HistoryGroup = {
  key: string;
  date: Date | null;
  interventions: Intervention[];
};

type HistoryViewModel = {
  groupedInterventions: HistoryGroup[];
  navigationGroups: HistoryGroup[];
};

let cachedInterventions: Intervention[] | null = null;
let cachedDateKeys: string[] | null = null;
let cachedViewModel: HistoryViewModel | null = null;

const convertToDate = (value: unknown): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;

  if (typeof value === "string") {
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      const parsedLocalDate = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
      );

      return Number.isNaN(parsedLocalDate.getTime())
        ? null
        : parsedLocalDate;
    }

    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  if (typeof value === "number") {
    const parsedDate = new Date(value);
    return Number.isNaN(parsedDate.getTime()) ? null : parsedDate;
  }

  if (typeof value === "object") {
    const timestamp = value as {
      toDate?: () => Date;
      seconds?: number;
      _seconds?: number;
    };

    if (typeof timestamp.toDate === "function") {
      const date = timestamp.toDate();
      return Number.isNaN(date.getTime()) ? null : date;
    }

    const seconds = timestamp.seconds ?? timestamp._seconds;
    if (typeof seconds === "number") return new Date(seconds * 1000);
  }

  return null;
};

const getInterventionDate = (intervention: Intervention): Date | null => {
  const record = intervention as unknown as Record<string, unknown>;
  const values = [
    record.dateKey,
    record.createdAt,
    record.interventionDate,
    record.date,
    record.updatedAt,
    record.timestamp,
  ];

  for (const value of values) {
    const date = convertToDate(value);
    if (date) return date;
  }

  return null;
};

const getActivityDate = (intervention: Intervention): Date | null => {
  const record = intervention as unknown as Record<string, unknown>;
  const values = [
    record.updatedAt,
    record.createdAt,
    record.timestamp,
    record.interventionDate,
    record.date,
    record.dateKey,
  ];

  for (const value of values) {
    const date = convertToDate(value);
    if (date) return date;
  }

  return null;
};

const getDateKey = (date: Date | null) => {
  if (!date) return "unknown-date";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const buildHistoryViewModel = (
  interventions: Intervention[],
  dateKeys: string[],
): HistoryViewModel => {
  if (
    cachedViewModel &&
    cachedInterventions === interventions &&
    cachedDateKeys === dateKeys
  ) {
    return cachedViewModel;
  }

  const groups = new Map<string, HistoryGroup>();
  const uniqueByDateAndTicket = new Map<string, Intervention>();

  interventions.forEach((intervention) => {
    const date = getInterventionDate(intervention);
    const dateKey = getDateKey(date);
    const uniqueKey = `${dateKey}:${interventionLogicalKey(intervention)}`;
    const existing = uniqueByDateAndTicket.get(uniqueKey);

    if (
      !existing ||
      interventionActivityValue(intervention) > interventionActivityValue(existing)
    ) {
      uniqueByDateAndTicket.set(uniqueKey, intervention);
    }
  });

  uniqueByDateAndTicket.forEach((intervention) => {
    const date = getInterventionDate(intervention);
    const dateKey = getDateKey(date);
    const group = groups.get(dateKey);

    if (group) group.interventions.push(intervention);
    else groups.set(dateKey, { key: dateKey, date, interventions: [intervention] });
  });

  groups.forEach((group) => {
    group.interventions.sort((first, second) => {
      const firstDate = getActivityDate(first);
      const secondDate = getActivityDate(second);
      if (!firstDate && !secondDate) return 0;
      if (!firstDate) return 1;
      if (!secondDate) return -1;
      return secondDate.getTime() - firstDate.getTime();
    });
  });

  const groupedInterventions = Array.from(groups.values()).sort((first, second) => {
    if (!first.date && !second.date) return 0;
    if (!first.date) return 1;
    if (!second.date) return -1;
    return second.date.getTime() - first.date.getTime();
  });

  const groupsByKey = new Map(groupedInterventions.map((group) => [group.key, group]));

  dateKeys.forEach((dateKey) => {
    if (groupsByKey.has(dateKey)) return;
    const [year, month, day] = dateKey.split("-").map(Number);
    const parsedDate = year && month && day ? new Date(year, month - 1, day) : null;
    groupsByKey.set(dateKey, {
      key: dateKey,
      date: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null,
      interventions: [],
    });
  });

  const navigationGroups = Array.from(groupsByKey.values()).sort((first, second) => {
    if (!first.date && !second.date) return 0;
    if (!first.date) return 1;
    if (!second.date) return -1;
    return second.date.getTime() - first.date.getTime();
  });

  cachedInterventions = interventions;
  cachedDateKeys = dateKeys;
  cachedViewModel = { groupedInterventions, navigationGroups };
  return cachedViewModel;
};
