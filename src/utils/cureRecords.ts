import type {
  CureKey,
  CureRecord,
  CureRecords,
} from "../redux/features/newInterventionSlice";

export const cureOrder: CureKey[] = [
  "firstCure",
  "secondCure",
  "thirdCure",
];

export const emptyCureRecords = (): CureRecords => ({
  firstCure: null,
  secondCure: null,
  thirdCure: null,
});

export const localDateKey = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

export const localTimeKey = (date: Date): string =>
  `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

const labelByCure: Record<CureKey, string> = {
  firstCure: "1er",
  secondCure: "2eme",
  thirdCure: "3eme",
};

const ordinalPatternByCure: Record<CureKey, RegExp> = {
  firstCure: /\b1(?:er|ère|ere|ᵉʳ)?\s*CURE\b/i,
  secondCure: /\b2(?:e|ème|eme|ᵉ)?\s*CURE\b/i,
  thirdCure: /\b3(?:e|ème|eme|ᵉ)?\s*CURE\b/i,
};

export const formatCureLine = (
  cure: CureKey,
  record: CureRecord,
): string => {
  const [year = "", month = "", day = ""] = record.date.split("-");
  const [hours = "00", minutes = "00"] = record.time.split(":");
  const supportsSms = cure === "firstCure" || cure === "secondCure";
  const smsText = supportsSms && record.smsEnabled ? " + SMS" : "";

  return `${labelByCure[cure]} CURE${smsText} fait le ${day}/${month}/${year} à ${hours}:${minutes}h;`;
};

const lineMatchesCure = (line: string, cure: CureKey) =>
  ordinalPatternByCure[cure].test(line);

const cureDateTimeMatchesLine = (
  line: string,
  record: CureRecord | null,
): boolean => {
  if (!record) return false;
  const [year = "", month = "", day = ""] = record.date.split("-");
  const [hours = "", minutes = ""] = record.time.split(":");
  if (!year || !month || !day || !hours || !minutes) return false;

  const normalizedLine = line.replace(/\s+/g, " ");
  return (
    /\bCURE\b/i.test(normalizedLine) &&
    normalizedLine.includes(`${day}/${month}/${year}`) &&
    new RegExp(`\\b${hours}:${minutes}(?:h)?\\b`, "i").test(normalizedLine)
  );
};

/**
 * Removes the automatic comment lines for the supplied CURE records.
 *
 * Besides the ordinal (1er/2ème/3ème), the stored date and time are used as a
 * fallback. This also removes an automatic line whose ordinal was manually
 * altered, while leaving unrelated manual comment text untouched.
 */
export const removeCureLines = (
  comment: string,
  cures: CureKey[],
  records?: CureRecords,
): string => {
  if (cures.length === 0) return comment;

  const cleaned = comment
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) =>
      !cures.some(
        (cure) =>
          lineMatchesCure(line, cure) ||
          cureDateTimeMatchesLine(line, records?.[cure] ?? null),
      ),
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return cleaned;
};

/**
 * Restores or refreshes one canonical CURE line without touching the stored
 * CURE record. Manual comment text remains editable and is otherwise kept.
 */
export const upsertCureLine = (
  comment: string,
  cure: CureKey,
  records: CureRecords,
): string => {
  const record = records[cure];
  if (!record) return comment;

  const canonicalLine = formatCureLine(cure, record);
  const lines = comment.replace(/\r\n/g, "\n").split("\n");
  const matchingIndexes = lines
    .map((line, index) => (lineMatchesCure(line, cure) ? index : -1))
    .filter((index) => index >= 0);

  if (matchingIndexes.length > 0) {
    const firstIndex = matchingIndexes[0];
    lines[firstIndex] = canonicalLine;
    for (let index = matchingIndexes.length - 1; index >= 1; index -= 1) {
      lines.splice(matchingIndexes[index], 1);
    }
    return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  }

  const currentOrderIndex = cureOrder.indexOf(cure);

  for (let index = currentOrderIndex - 1; index >= 0; index -= 1) {
    const previousCure = cureOrder[index];
    const previousLineIndex = lines.findIndex((line) =>
      lineMatchesCure(line, previousCure),
    );
    if (previousLineIndex >= 0) {
      lines.splice(previousLineIndex + 1, 0, canonicalLine);
      return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    }
  }

  for (let index = currentOrderIndex + 1; index < cureOrder.length; index += 1) {
    const nextCure = cureOrder[index];
    const nextLineIndex = lines.findIndex((line) => lineMatchesCure(line, nextCure));
    if (nextLineIndex >= 0) {
      lines.splice(nextLineIndex, 0, canonicalLine);
      return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    }
  }

  const trimmed = comment.trimEnd();
  if (!trimmed) return canonicalLine;
  return `${trimmed}\n\n${canonicalLine}`;
};

export const normalizeCureRecords = (
  value: unknown,
  legacyCure: unknown,
  legacyRecordedAt: unknown,
): CureRecords => {
  const result = emptyCureRecords();
  if (value && typeof value === "object") {
    for (const cure of cureOrder) {
      const rawRecord = (value as Record<string, unknown>)[cure];
      if (!rawRecord || typeof rawRecord !== "object") continue;
      const raw = rawRecord as Record<string, unknown>;
      const recordedAt = raw.recordedAt;
      const parsedRecordedAt =
        typeof recordedAt === "string" && !Number.isNaN(new Date(recordedAt).getTime())
          ? new Date(recordedAt)
          : null;

      const storedDate = raw.date ?? raw.dateKey;
      const storedTime = raw.time;
      const date =
        typeof storedDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(storedDate)
          ? storedDate
          : parsedRecordedAt
            ? localDateKey(parsedRecordedAt)
            : "";
      const time =
        typeof storedTime === "string" && /^\d{2}:\d{2}$/.test(storedTime)
          ? storedTime
          : parsedRecordedAt
            ? localTimeKey(parsedRecordedAt)
            : "";

      if (!date || !time) continue;

      const normalizedRecordedAt =
        typeof recordedAt === "string" && parsedRecordedAt
          ? recordedAt
          : new Date(`${date}T${time}:00`).toISOString();

      result[cure] = {
        date,
        time,
        recordedAt: normalizedRecordedAt,
        smsEnabled: Boolean(raw.smsEnabled),
      };
    }
  }

  const normalizedLegacyCure: CureKey | null =
    legacyCure === "firstCure" || legacyCure === "CURE1"
      ? "firstCure"
      : legacyCure === "secondCure" || legacyCure === "CURE2"
        ? "secondCure"
        : legacyCure === "thirdCure" || legacyCure === "CURE3"
          ? "thirdCure"
          : null;

  if (
    normalizedLegacyCure &&
    !result[normalizedLegacyCure] &&
    typeof legacyRecordedAt === "string" &&
    !Number.isNaN(new Date(legacyRecordedAt).getTime())
  ) {
    const legacyDate = new Date(legacyRecordedAt);
    result[normalizedLegacyCure] = {
      date: localDateKey(legacyDate),
      time: localTimeKey(legacyDate),
      recordedAt: legacyRecordedAt,
      smsEnabled: false,
    };
  }

  return result;
};
