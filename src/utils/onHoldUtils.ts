import type { Intervention } from "../redux/features/newInterventionSlice";
import {
  interventionActivityValue,
  interventionLogicalKey,
} from "./interventionIdentity";

export type OnHoldTab =
  | "overdue"
  | "cure"
  | "snowSent"
  | "snowReceived"
  | "res"
  | "questions"
  | "other";

const BELGIUM_TIME_ZONE = "Europe/Brussels";

export type BelgianCalendarDate = {
  year: number;
  month: number;
  day: number;
};

export type CureCalendarStatus = {
  sourceDate: BelgianCalendarDate | null;
  dueBusinessDate: BelgianCalendarDate | null;
  dueDateKey: string | null;
  isOverdue: boolean;
};

const getBelgiumDateParts = (
  date: Date,
): BelgianCalendarDate => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: BELGIUM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? 0);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
  };
};

const calendarDateKey = ({
  year,
  month,
  day,
}: BelgianCalendarDate) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const nextCalendarDate = ({
  year,
  month,
  day,
}: BelgianCalendarDate): BelgianCalendarDate => {
  const next = new Date(Date.UTC(year, month - 1, day + 1, 12));

  return {
    year: next.getUTCFullYear(),
    month: next.getUTCMonth() + 1,
    day: next.getUTCDate(),
  };
};

const easterSunday = (
  year: number,
): BelgianCalendarDate => {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return { year, month, day };
};

const addCalendarDays = (
  date: BelgianCalendarDate,
  days: number,
): BelgianCalendarDate => {
  const result = new Date(
    Date.UTC(date.year, date.month - 1, date.day + days, 12),
  );

  return {
    year: result.getUTCFullYear(),
    month: result.getUTCMonth() + 1,
    day: result.getUTCDate(),
  };
};

const belgianPublicHolidayKeys = (year: number) => {
  const easter = easterSunday(year);

  return new Set([
    `${year}-01-01`,
    calendarDateKey(addCalendarDays(easter, 1)),
    `${year}-05-01`,
    calendarDateKey(addCalendarDays(easter, 39)),
    calendarDateKey(addCalendarDays(easter, 50)),
    `${year}-07-21`,
    `${year}-08-15`,
    `${year}-11-01`,
    `${year}-11-11`,
    `${year}-12-25`,
  ]);
};

export const isBelgianBusinessDay = (
  date: BelgianCalendarDate,
) => {
  const weekday = new Date(
    Date.UTC(date.year, date.month - 1, date.day),
  ).getUTCDay();

  if (weekday === 0 || weekday === 6) return false;

  return !belgianPublicHolidayKeys(date.year).has(
    calendarDateKey(date),
  );
};

const parseFrenchDateFromComment = (
  comment: string | undefined,
  cure: Intervention["cure"],
): BelgianCalendarDate | null => {
  if (!comment) return null;

  const expectedCure =
    cure === "secondCure"
      ? /\b(?:2(?:e|ème|eme|ᵉ)|deuxième)\s*CURE\b/i
      : /\b(?:1(?:er|ère|ere|ᵉʳ)|première)\s*CURE\b/i;

  const lines = comment
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => expectedCure.test(line));

  if (lines.length === 0) return null;

  // Use the most recently written matching CURE line.
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const match = lines[index].match(
      /(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/,
    );

    if (!match) continue;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const year = Number(match[3]);

    if (
      year >= 2000 &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      return { year, month, day };
    }
  }

  return null;
};

const getCureSourceDate = (
  intervention: Intervention,
): BelgianCalendarDate | null => {
  if (
    intervention.cure !== "firstCure" &&
    intervention.cure !== "secondCure"
  ) {
    return null;
  }

  // Existing documents may contain an incorrect curePendingSince written by
  // the older implementation from updatedAt. The explicit CURE date written
  // in Commentaire is therefore the primary source for legacy records.
  const commentDate = parseFrenchDateFromComment(
    intervention.comment,
    intervention.cure,
  );

  if (commentDate) return commentDate;

  if (intervention.curePendingSince) {
    const storedDate = new Date(intervention.curePendingSince);

    if (!Number.isNaN(storedDate.getTime())) {
      return getBelgiumDateParts(storedDate);
    }
  }

  const fallback =
    intervention.createdAt ??
    intervention.updatedAt;

  if (!fallback) return null;

  const fallbackDate = new Date(fallback);

  return Number.isNaN(fallbackDate.getTime())
    ? null
    : getBelgiumDateParts(fallbackDate);
};

export const getSecondFollowingBelgianBusinessDate = (
  sourceDate: BelgianCalendarDate,
) => {
  let date = sourceDate;
  let countedBusinessDays = 0;

  while (countedBusinessDays < 2) {
    date = nextCalendarDate(date);

    if (isBelgianBusinessDay(date)) {
      countedBusinessDays += 1;
    }
  }

  return date;
};

export const getCureStatus = (
  intervention: Intervention,
  now = new Date(),
): CureCalendarStatus => {
  const sourceDate = getCureSourceDate(intervention);

  if (!sourceDate) {
    return {
      sourceDate: null,
      dueBusinessDate: null,
      dueDateKey: null,
      isOverdue: false,
    };
  }

  const dueBusinessDate =
    getSecondFollowingBelgianBusinessDate(sourceDate);
  const dueDateKey = calendarDateKey(dueBusinessDate);
  const todayKey = calendarDateKey(getBelgiumDateParts(now));

  return {
    sourceDate,
    dueBusinessDate,
    dueDateKey,
    // Activates at 00:00 Brussels time on the due business date.
    isOverdue: todayKey >= dueDateKey,
  };
};

const belgiumMidnightToDate = ({
  year,
  month,
  day,
}: BelgianCalendarDate) => {
  const desiredAsUtc = Date.UTC(year, month - 1, day, 0, 0, 0);
  let candidate = new Date(desiredAsUtc);

  for (let iteration = 0; iteration < 3; iteration += 1) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: BELGIUM_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(candidate);

    const value = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((part) => part.type === type)?.value ?? 0);

    const representedAsUtc = Date.UTC(
      value("year"),
      value("month") - 1,
      value("day"),
      value("hour"),
      value("minute"),
      value("second"),
    );

    candidate = new Date(
      candidate.getTime() + desiredAsUtc - representedAsUtc,
    );
  }

  return candidate;
};

export const getCureDeadline = (
  intervention: Intervention,
) => {
  const { dueBusinessDate } = getCureStatus(intervention);

  return dueBusinessDate
    ? belgiumMidnightToDate(dueBusinessDate)
    : null;
};

export const isCureOverdue = (
  intervention: Intervention,
  now = new Date(),
) => getCureStatus(intervention, now).isOverdue;

const parseLocalDateKey = (value: string | null | undefined): BelgianCalendarDate | null => {
  if (!value) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!match) return null;
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
};

const compareCalendarDates = (
  first: BelgianCalendarDate,
  second: BelgianCalendarDate,
) => calendarDateKey(first).localeCompare(calendarDateKey(second));

const addBusinessDaysToDateKey = (
  dateKey: string | null | undefined,
  businessDays: number,
) => {
  const source = parseLocalDateKey(dateKey);
  if (!source) return null;

  let date = source;
  let counted = 0;
  while (counted < businessDays) {
    date = nextCalendarDate(date);
    if (isBelgianBusinessDay(date)) counted += 1;
  }
  return date;
};

const isSnowOverdueAfterReview = (
  intervention: Intervention,
  now = new Date(),
) => {
  const today = getBelgiumDateParts(now);
  const pendingReviews = [
    intervention.isSnowReceivedPending ? intervention.snowReceivedReviewedDate : null,
    intervention.isSnowSentPending ? intervention.snowSentReviewedDate : null,
  ];

  return pendingReviews.some((reviewDate) => {
    const due = addBusinessDaysToDateKey(reviewDate, 2);
    return due ? compareCalendarDates(today, due) >= 0 : false;
  });
};

const isPostponedOverdue = (
  intervention: Intervention,
  now = new Date(),
) => {
  const due = parseLocalDateKey(intervention.postponedDate);
  if (!due) return false;
  return compareCalendarDates(getBelgiumDateParts(now), due) >= 0;
};

export const isOverdueIntervention = (
  intervention: Intervention,
  now = new Date(),
) =>
  isPostponedOverdue(intervention, now) ||
  isCureOverdue(intervention, now) ||
  isSnowOverdueAfterReview(intervention, now);

export type OverdueKind = "postponed" | "cure" | "snow";

export const getOverdueKind = (
  intervention: Intervention,
  now = new Date(),
): OverdueKind => {
  if (isPostponedOverdue(intervention, now)) return "postponed";
  if (isCureOverdue(intervention, now)) return "cure";
  return "snow";
};

export const getLatestInterventions = (
  interventions: Intervention[],
) => {
  const latest = new Map<string, Intervention>();

  interventions.forEach((intervention) => {
    const key = interventionLogicalKey(intervention);
    const current = latest.get(key);

    if (!current || interventionActivityValue(intervention) > interventionActivityValue(current)) {
      latest.set(key, intervention);
    }
  });

  return Array.from(latest.values());
};

export const getOnHoldInterventions = (
  interventions: Intervention[],
  tab: OnHoldTab,
) => {
  const latest = getLatestInterventions(interventions);

  if (tab === "overdue") {
    return latest.filter((intervention) => isOverdueIntervention(intervention));
  }

  if (tab === "cure") {
    return latest.filter(
      (intervention) =>
        intervention.cure === "firstCure" ||
        intervention.cure === "secondCure",
    );
  }

  if (tab === "snowSent") {
    return latest.filter(
      (intervention) => intervention.isSnowSentPending,
    );
  }

  if (tab === "snowReceived") {
    return latest.filter(
      (intervention) => intervention.isSnowReceivedPending,
    );
  }

  if (tab === "res") {
    return latest.filter(
      (intervention) => intervention.isResPending,
    );
  }

  if (tab === "questions") {
    return latest.filter(
      (intervention) => intervention.isUnclear,
    );
  }

  // Postposé contains only interventions explicitly postponed to a date.
  return latest.filter(
    (intervention) =>
      intervention.status === "postponed" && Boolean(intervention.postponedDate),
  );
};

export const getOverdueCureCount = (
  interventions: Intervention[],
) =>
  getOnHoldInterventions(interventions, "cure").filter((intervention) =>
    isCureOverdue(intervention),
  ).length;
