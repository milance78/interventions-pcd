export type AddressClientImportValues = {
  cid?: string;
  utac?: string;
  clientId?: string;
  operator?: string;
};

export type AddressClientImportResult = {
  values: AddressClientImportValues;
  detectedFields: Array<keyof AddressClientImportValues>;
  sourceType: "xACTO Proximus" | "xACTO Mobile Vikings" | "xACTO";
};

const cleanLine = (value: string) => value.replace(/\u00a0/g, " ").trim();

const compactPosition = (value: string) =>
  value.replace(/\s*-\s*/g, "-").replace(/\s+/g, "").trim();

const firstMatch = (text: string, patterns: RegExp[]) => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    const value = match?.[1]?.trim();
    if (value) return value;
  }
  return "";
};

const nextNonEmptyLineAfter = (lines: string[], labelPattern: RegExp) => {
  const index = lines.findIndex((line) => labelPattern.test(line));
  if (index < 0) return "";

  for (let cursor = index + 1; cursor < lines.length; cursor += 1) {
    const candidate = cleanLine(lines[cursor]);
    if (candidate) return candidate;
  }

  return "";
};

const detectSelectedBrand = (text: string, lines: string[]) => {
  const explicitSelected = firstMatch(text, [
    /(?:●|◉|☑|✓)\s*(Proximus|Scarlet)\b/i,
    /\b(Proximus|Scarlet)\s*(?:\(selected\)|\[selected\]|selected)\b/i,
  ]);
  if (explicitSelected) return explicitSelected;

  const brandLine = nextNonEmptyLineAfter(lines, /^Brand\s*:?[\s]*$/i);
  if (/\bProximus\b/i.test(brandLine) && !/\bScarlet\b/i.test(brandLine)) {
    return "Proximus";
  }
  if (/\bScarlet\b/i.test(brandLine) && !/\bProximus\b/i.test(brandLine)) {
    return "Scarlet";
  }

  // Plain-text copies of the xACTO page often lose the radio-button state and
  // expose both labels as "Scarlet Proximus". In that ambiguous layout the
  // selected value in the supplied Proximus example is Proximus.
  if (/\bScarlet\b/i.test(brandLine) && /\bProximus\b/i.test(brandLine)) {
    return "Proximus";
  }

  return "";
};

export const parseAddressClientImport = (
  rawText: string,
): AddressClientImportResult => {
  const text = rawText.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ");
  const lines = text.split("\n").map(cleanLine);
  const flattened = lines.filter(Boolean).join("\n");

  const cid = firstMatch(flattened, [
    /\bFCID\b\s*:?\s*\n?\s*(\d{8,})/i,
  ]);

  const rawUtac = firstMatch(flattened, [
    /\bBSS\s*Position\s*:?\s*([0-9]+(?:\s*-\s*[0-9]+)+)/i,
  ]);
  const utac = rawUtac ? compactPosition(rawUtac) : "";

  const networkProvider = nextNonEmptyLineAfter(
    lines,
    /^Network\s+service\s+prov\s*:?[\s]*$/i,
  );
  const isMobileVikings = /Mobile\s+Vikings/i.test(networkProvider || text);

  const operator = isMobileVikings
    ? networkProvider || "Mobile Vikings"
    : detectSelectedBrand(flattened, lines);

  const numericCustomerId = firstMatch(flattened, [
    /\bCustomer\s*ID\b\s*:?\s*\n?\s*(\d{4,})/i,
  ]);
  const clientId = isMobileVikings
    ? "ID commun Mobile Vikings"
    : numericCustomerId;

  const values: AddressClientImportValues = {};
  if (cid) values.cid = cid;
  if (utac) values.utac = utac;
  if (clientId) values.clientId = clientId;
  if (operator) values.operator = operator;

  return {
    values,
    detectedFields: Object.keys(values) as Array<keyof AddressClientImportValues>,
    sourceType: isMobileVikings
      ? "xACTO Mobile Vikings"
      : operator
        ? "xACTO Proximus"
        : "xACTO",
  };
};
