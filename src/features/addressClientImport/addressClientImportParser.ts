export type AddressClientTechnology = "cuivre" | "fibre";

export type AddressClientImportValues = {
  na?: string;
  cid?: string;
  utac?: string;
  clientId?: string;
  operator?: string;
};

export type AddressClientImportResult = {
  values: AddressClientImportValues;
  detectedFields: Array<keyof AddressClientImportValues>;
  sourceType:
    | "SALY/xACTO Cuivre"
    | "SALY/xACTO Fibre"
    | "SALY/xACTO Mobile Vikings"
    | "SALY/xACTO Autre OLO";
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

const nextNonEmptyLine = (lines: string[], startIndex: number) => {
  for (let cursor = startIndex + 1; cursor < lines.length; cursor += 1) {
    const candidate = cleanLine(lines[cursor]);
    if (candidate) return candidate;
  }
  return "";
};

/**
 * xACTO appears in several slightly different plain-text layouts:
 *   Network service prov\nMOBILE VIKINGS - X0270
 *   Network service provEDPNET
 *   Network Service Provider: Scarlet
 *
 * This value has absolute priority over Brand when it is present.
 */
const extractNetworkServiceProvider = (lines: string[]) => {
  const labelPattern = /^Network\s+service\s+prov(?:ider)?\s*:?\s*(.*)$/i;

  for (let index = 0; index < lines.length; index += 1) {
    const line = cleanLine(lines[index]);
    const match = line.match(labelPattern);
    if (!match) continue;

    const inlineValue = cleanLine(match[1] ?? "");
    if (inlineValue) return inlineValue;

    return nextNonEmptyLine(lines, index);
  }

  return "";
};

const normalizeNetwork = (provider: string) => {
  const normalized = cleanLine(provider);
  if (!normalized) return "";
  if (/Mobile\s+Vikings/i.test(normalized)) return "Mobile Vikings";
  if (/\bScarlet\b/i.test(normalized)) return "Scarlet";
  if (/\bProximus\b/i.test(normalized)) return "Proximus";
  return "Autre OLO";
};

const extractBrandLine = (lines: string[]) => {
  for (let index = 0; index < lines.length; index += 1) {
    const line = cleanLine(lines[index]);
    const match = line.match(/^Brand\s*:?\s*(.*)$/i);
    if (!match) continue;

    const inlineValue = cleanLine(match[1] ?? "");
    if (inlineValue) return inlineValue;

    return nextNonEmptyLine(lines, index);
  }
  return "";
};

/**
 * Plain-text copies can lose the selected radio state and expose Brand as
 * "Scarlet Proximus". In those copies we use stable product/operator clues.
 * Network service provider, when present, is handled before this function.
 */
const detectBrandFallback = (text: string, lines: string[]) => {
  const explicitSelected = firstMatch(text, [
    /(?:●|◉|☑|✓)\s*(Proximus|Scarlet)\b/i,
    /\b(Proximus|Scarlet)\s*(?:\(selected\)|\[selected\]|selected)\b/i,
  ]);
  if (explicitSelected) return explicitSelected;

  // Scarlet pages expose these clues even when the Brand radio state is lost.
  if (/\bC0001\s*\(SCARLET\)/i.test(text) || /\b(?:Internet|Fiber)\s+LOCO\b/i.test(text)) {
    return "Scarlet";
  }

  const brandLine = extractBrandLine(lines);
  const hasScarlet = /\bScarlet\b/i.test(brandLine);
  const hasProximus = /\bProximus\b/i.test(brandLine);

  if (hasScarlet && !hasProximus) return "Scarlet";
  if (hasProximus && !hasScarlet) return "Proximus";

  // In SALY/xACTO copies where both labels remain visible and no Scarlet clue
  // is present, the supplied Proximus cases resolve to Proximus.
  if (hasScarlet && hasProximus) return "Proximus";

  return "";
};

const addDetectedValue = <K extends keyof AddressClientImportValues>(
  values: AddressClientImportValues,
  detectedFields: Array<keyof AddressClientImportValues>,
  field: K,
  value: AddressClientImportValues[K],
) => {
  if (value === undefined) return;
  values[field] = value;
  detectedFields.push(field);
};

export const parseAddressClientImport = (
  rawText: string,
  technology: AddressClientTechnology,
): AddressClientImportResult => {
  const text = rawText.replace(/\r\n/g, "\n").replace(/\u00a0/g, " ");
  const lines = text.split("\n").map(cleanLine);
  const flattened = lines.filter(Boolean).join("\n");

  const values: AddressClientImportValues = {};
  const detectedFields: Array<keyof AddressClientImportValues> = [];

  if (technology === "cuivre") {
    const na = firstMatch(flattened, [
      /\bLine\s*Number\b\s*:?\s*\n?\s*(\d{8,})/i,
      /\bInput\s*:\s*(\d{8,})\s*\(Connected\s+DN\)/i,
    ]);
    const cid = firstMatch(flattened, [
      /\bCircuit\s*ID\b\s*:?\s*\n?\s*(\d{8,})/i,
    ]);

    if (na) addDetectedValue(values, detectedFields, "na", na);
    if (cid) addDetectedValue(values, detectedFields, "cid", cid);
  } else {
    const cid = firstMatch(flattened, [
      /\bFCID\b\s*:?\s*\n?\s*(\d{8,})/i,
    ]);
    const rawUtac = firstMatch(flattened, [
      /\bBSS\s*Position\s*:?\s*([0-9]+(?:\s*-\s*[0-9]+)+)/i,
    ]);

    if (rawUtac) {
      addDetectedValue(values, detectedFields, "utac", compactPosition(rawUtac));
    }
    if (cid) addDetectedValue(values, detectedFields, "cid", cid);
  }

  const provider = extractNetworkServiceProvider(lines);
  const operator = provider
    ? normalizeNetwork(provider)
    : detectBrandFallback(flattened, lines);

  if (operator) addDetectedValue(values, detectedFields, "operator", operator);

  const numericCustomerId = firstMatch(flattened, [
    /\bCustomer\s*ID\b\s*:?\s*\n?\s*(\d{4,})/i,
  ]);

  // Per specification, Mobile Vikings and every other OLO must have an empty
  // client ID. Keeping the field in detectedFields is intentional: importing
  // such a client must also clear a previously entered ID Client.
  if (operator === "Mobile Vikings" || operator === "Autre OLO") {
    addDetectedValue(values, detectedFields, "clientId", "");
  } else if (numericCustomerId) {
    addDetectedValue(values, detectedFields, "clientId", numericCustomerId);
  }

  const sourceType =
    operator === "Mobile Vikings"
      ? "SALY/xACTO Mobile Vikings"
      : operator === "Autre OLO"
        ? "SALY/xACTO Autre OLO"
        : technology === "cuivre"
          ? "SALY/xACTO Cuivre"
          : "SALY/xACTO Fibre";

  return {
    values,
    detectedFields,
    sourceType,
  };
};
