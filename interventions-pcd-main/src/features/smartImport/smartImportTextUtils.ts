export const cleanSmartImportValue = (value: string | undefined): string =>
  (value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\uFFFD/g, "'")
    .replace(/[ \t]+/g, " ")
    .trim();

export const meaningfulSmartImportValue = (
  value: string | undefined,
): string => {
  const result = cleanSmartImportValue(value);
  return result && result !== "--" && result !== "-" ? result : "";
};

export const isSmartImportPlaceholder = (value: string | undefined): boolean =>
  /^(?:preemptive_first_name\s+preemptive_last_name|nom de famille|last name|first name|action)$/i.test(
    cleanSmartImportValue(value),
  );

export const meaningfulBusinessValue = (
  value: string | undefined,
): string => {
  const result = meaningfulSmartImportValue(value);
  return result && !isSmartImportPlaceholder(result) ? result : "";
};

export const firstMeaningfulValue = (
  ...values: Array<string | undefined>
): string => values.map(meaningfulSmartImportValue).find(Boolean) ?? "";

export const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const normalizeSmartImportText = (rawText: string): string =>
  rawText
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .replace(/\uFFFD/g, "'");

export const extractSection = (
  text: string,
  start: RegExp,
  ends: RegExp[],
): string => {
  const match = start.exec(text);
  if (!match) return "";

  const from = match.index + match[0].length;
  const rest = text.slice(from);
  const offsets = ends
    .map((pattern) => {
      pattern.lastIndex = 0;
      return pattern.exec(rest)?.index;
    })
    .filter((value): value is number => typeof value === "number");

  return rest.slice(0, offsets.length ? Math.min(...offsets) : rest.length);
};

export const splitLooseColumns = (line: string): string[] =>
  line
    .split(/\t+| {2,}/)
    .map(cleanSmartImportValue)
    .filter(Boolean);
