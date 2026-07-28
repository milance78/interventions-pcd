export const trimOuterWhitespace = (value: string) =>
  value.replace(/^\s+|\s+$/g, "");

export const trimLeadingHorizontalWhitespace = (value: string) =>
  value.replace(/^[ \t]+/, "");

export const normalizeInterventionStrings = <T extends object>(
  value: T,
): T =>
  Object.fromEntries(
    Object.entries(value).map(([key, fieldValue]) => [
      key,
      typeof fieldValue === "string"
        ? trimOuterWhitespace(fieldValue)
        : fieldValue,
    ]),
  ) as T;

export const prepareNpsText = (value: string) =>
  value
    .replace(/\r\n/g, "\n")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "AE")
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim().length > 0)
    .join("\n")
    .trim();

export const prepareWctText = (value: string) =>
  value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();

export const writeTextToClipboard = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
};
