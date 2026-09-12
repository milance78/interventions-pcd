/**
 * Pure helpers for maintaining generated sections inside the free-form
 * Commentaire field.  UI components and Redux reducers should only provide
 * the segment/action text; this module owns the paragraph/line replacement.
 */

export const replaceCommentSegment = (
  comment: string,
  previousSegment: string,
  nextSegment: string,
  insertAfterFirstBlock = false,
): string => {
  const blocks = comment
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const previous = previousSegment.trim();
  const filtered = previous
    ? blocks.filter((block) => block !== previous)
    : blocks;

  const next = nextSegment.trim();
  if (!next) return filtered.join("\n\n");

  if (insertAfterFirstBlock && filtered.length > 0) {
    filtered.splice(1, 0, next);
  } else {
    filtered.push(next);
  }

  return filtered.join("\n\n");
};

export const replaceActionCommentLine = (
  comment: string,
  prefixes: string[],
  nextLine: string,
): string => {
  const lines = comment.replace(/\r\n/g, "\n").split("\n");
  const normalizedPrefixes = prefixes.map((prefix) => prefix.trim().toLowerCase());
  const filtered = lines.filter((line) =>
    !normalizedPrefixes.some((prefix) =>
      line.trim().toLowerCase().startsWith(prefix),
    ),
  );

  const cleaned = filtered.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  const next = nextLine.trim();
  return next ? (cleaned ? `${cleaned}\n\n${next}` : next) : cleaned;
};

export const removeAutomaticAddressLines = (comment: string): string => {
  const automaticAddressLine =
    /^(?:Adresse confirmée\.?|Adresse pas confirmée\.?|Adresse pas encore confirmée\.?)$/;

  return comment
    .replace(/\r\n/g, "\n")
    .split("\n")
    .filter((line) => !automaticAddressLine.test(line.trim()))
    .join("\n")
    .replace(/^\n+/, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
};

export const replaceResiliationBciLine = (
  comment: string,
  reference: string,
): { comment: string; line: string } => {
  const lines = comment.replace(/\r\n/g, "\n").split("\n");
  const index = lines.findIndex((item) => /^RES en attente(?::|,)?/i.test(item.trim()));

  if (index >= 0) {
    lines[index] =
      lines[index]
        .replace(/\s*,\s*BCI:.*$/i, "")
        .replace(/\s*$/, "") + `, BCI: ${reference.trim()}`;
    return { comment: lines.join("\n"), line: lines[index] };
  }

  const line = `BCI: ${reference.trim()}`;
  return {
    comment: comment.trim() ? `${comment.trim()}\n\n${line}` : line,
    line,
  };
};
