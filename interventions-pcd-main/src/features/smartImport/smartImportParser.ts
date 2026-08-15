import type { InterventionData } from "../../redux/features/newInterventionSlice";

export type SmartImportResult = {
  values: Partial<InterventionData>;
  detectedFields: string[];
  sourceType: "NPS" | "SNOW" | "ISIS" | "SAFE" | "UNKNOWN";
};

type ParsedSource = Partial<InterventionData> & {
  descriptionFr?: string;
  descriptionEn?: string;
};

const clean = (value: string | undefined) =>
  (value ?? "")
    .replace(/\u00a0/g, " ")
    .replace(/\uFFFD/g, "'")
    .replace(/[ \t]+/g, " ")
    .trim();

const meaningful = (value: string | undefined) => {
  const result = clean(value);
  return result && result !== "--" && result !== "-" ? result : "";
};

const isPlaceholderValue = (value: string | undefined) =>
  /^(?:preemptive_first_name\s+preemptive_last_name|nom de famille|last name|first name|action)$/i.test(
    clean(value),
  );

const meaningfulBusinessValue = (value: string | undefined) => {
  const result = meaningful(value);
  return result && !isPlaceholderValue(result) ? result : "";
};

const first = (...values: Array<string | undefined>) =>
  values.map(meaningful).find(Boolean) ?? "";

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const normalizeText = (rawText: string) =>
  rawText.replace(/\r/g, "").replace(/\u00a0/g, " ").replace(/\uFFFD/g, "'");

const detectSource = (text: string): SmartImportResult["sourceType"] => {
  const upper = text.toUpperCase();
  if (upper.includes("SNOW_ID") || upper.includes("SNOW_TITLE")) return "SNOW";
  if (upper.includes("WORK ITEM TREATMENT") || upper.includes("NPS_EXCEPTION_CD")) return "NPS";
  if (upper.includes("ORDER VIEWER LINKS") || upper.includes("MISE À JOUR INTERVENTION")) return "SAFE";
  if (upper.includes("FISISINTV") || upper.includes("SERVICE ORDER")) return "ISIS";
  return "UNKNOWN";
};

const section = (text: string, start: RegExp, ends: RegExp[]): string => {
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

const splitLoose = (line: string) =>
  line
    .split(/\t+| {2,}/)
    .map(clean)
    .filter(Boolean);

const extractLabelValue = (text: string, labels: string[]): string => {
  const allLines = text.split("\n");

  for (const label of labels) {
    const escaped = escapeRegExp(label);

    for (const line of allLines) {
      const direct = line.match(new RegExp(`(?:^|\\s{2,}|\\t)${escaped}\\s*(?:\\t+| {2,}|:)\\s*(.+)$`, "i"));
      if (direct) {
        const tail = splitLoose(direct[1]);
        const value = meaningful(tail[0]);
        if (value) return value;
      }

      const cells = splitLoose(line);
      const index = cells.findIndex((cell) => cell.toLowerCase() === label.toLowerCase());
      if (index >= 0) {
        const value = meaningful(cells[index + 1]);
        if (value) return value;
      }
    }

    const nextLine = text.match(new RegExp(`(?:^|\\n)\\s*${escaped}\\s*\\n\\s*([^\\n]+)`, "i"));
    const value = meaningful(nextLine?.[1]);
    if (value) return value;
  }

  return "";
};

const extractBusinessLabelValue = (text: string, labels: string[]) => {
  let remaining = text;

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = extractLabelValue(remaining, labels);
    if (!candidate) return "";

    const validCandidate = meaningfulBusinessValue(candidate);
    if (validCandidate) return validCandidate;

    const candidateIndex = remaining
      .toLocaleLowerCase("fr-FR")
      .indexOf(candidate.toLocaleLowerCase("fr-FR"));
    if (candidateIndex < 0) return "";
    remaining = remaining.slice(candidateIndex + candidate.length);
  }

  return "";
};

/** Reads a browser-copied table by using header character positions. */
const extractFixedColumns = (
  text: string,
  requiredHeaders: string[],
  allHeaders: string[],
): Record<string, string> => {
  const lines = text.split("\n");
  const headerIndex = lines.findIndex((line) =>
    requiredHeaders.every((header) => line.toLowerCase().includes(header.toLowerCase())),
  );
  if (headerIndex < 0) return {};

  const headerLine = lines[headerIndex];
  const positions = allHeaders
    .map((header) => ({ header, index: headerLine.toLowerCase().indexOf(header.toLowerCase()) }))
    .filter((item) => item.index >= 0)
    .sort((a, b) => a.index - b.index);
  if (!positions.length) return {};

  const valueLine = lines.slice(headerIndex + 1, headerIndex + 5).find((line) => line.trim());
  if (!valueLine) return {};

  const output: Record<string, string> = {};
  positions.forEach((position, index) => {
    const end = positions[index + 1]?.index ?? valueLine.length;
    output[position.header] = meaningful(valueLine.slice(position.index, end));
  });
  return output;
};

const extractNewAddressSection = (text: string) =>
  section(
    text,
    /(?:^|\n)\s*Nouvelle adresse\b/i,
    [
      /(?:^|\n)\s*Ancienne adresse\b/i,
      /(?:^|\n)\s*Manual TSI\/Design reason\b/i,
      /(?:^|\n)\s*Stop Servicing Copper Date\b/i,
      /(?:^|\n)\s*Order Viewer Links\b/i,
    ],
  );


const getFirstDataLineAfterHeaders = (block: string, requiredHeaders: string[]) => {
  const lines = block.split("\n");
  const headerIndex = lines.findIndex((line) =>
    requiredHeaders.every((header) => line.toLowerCase().includes(header.toLowerCase())),
  );
  if (headerIndex < 0) return { headerLine: "", valueLine: "" };

  const valueLine = lines
    .slice(headerIndex + 1, headerIndex + 6)
    .map((line) => line.trim())
    .find((line) => line.length > 0) ?? "";

  return { headerLine: lines[headerIndex], valueLine };
};

const parseCustomerSection = (text: string) => {
  const block = section(
    text,
    /(?:^|\n)\s*Information client\b/i,
    [/(?:^|\n)\s*Contact Client\b/i, /(?:^|\n)\s*Informations d'intervention\b/i],
  );
  const { valueLine } = getFirstDataLineAfterHeaders(block, ["ID client", "Partner Account ID"]);
  const values = splitLoose(valueLine);

  return {
    clientID: meaningful(values[0]),
    firstName: meaningful(values[3]),
    lastName: meaningful(values[2]),
  };
};

const normalizeBelgianMobile = (value: string) => {
  const digits = value.replace(/\D/g, "");
  if (/^00324\d{8}$/.test(digits)) return `0${digits.slice(4)}`;
  if (/^324\d{8}$/.test(digits)) return `0${digits.slice(3)}`;
  if (/^04\d{8}$/.test(digits)) return digits;
  return "";
};

const extractPreferredContactPhone = (block: string) => {
  const compactCandidates = block.match(/(?:\+32|0032)4\d{8}\b|\b04\d{8}\b/g) ?? [];
  for (const candidate of compactCandidates) {
    const normalized = normalizeBelgianMobile(candidate);
    if (normalized && !/^0+$/.test(normalized)) return normalized;
  }

  const candidates = block.match(/(?:\+32|0032|0)\s*4(?:[\s./()-]*\d){8}/g) ?? [];
  for (const candidate of candidates) {
    const normalized = normalizeBelgianMobile(candidate);
    if (normalized && !/^0+$/.test(normalized)) return normalized;
  }

  const generic = block.match(/(?:\+|00)?\d[\d\s()./-]{7,}\d/g) ?? [];
  for (const candidate of generic) {
    const digits = candidate.replace(/\D/g, "");
    if (digits.length >= 9 && !/^0+$/.test(digits)) return digits;
  }
  return "";
};

const extractFiberServiceId = (text: string) => {
  const matches = [...text.matchAll(/Access\s+TYPE\s*=\s*Fiber[\s\S]{0,260}?Service\s+ID\s*=\s*(\d{9,15})/gi)];
  return meaningful(matches[0]?.[1]);
};

const parseServiceOrderAddress = (text: string): ParsedSource => {
  const block = section(
    text,
    /(?:^|\n)\s*Informations ['’]Service Order['’]/i,
    [
      /(?:^|\n)\s*Stop Servicing Copper Date\b/i,
      /(?:^|\n)\s*Actions d'ordre\b/i,
      /(?:^|\n)\s*Order Viewer Links\b/i,
    ],
  );
  if (!block) return {};

  const addressMatch = block.match(
    /Nouvelle adresse\s+Nom de la rue\s+(.+?)\s*,\s*N[°o] de maison\s+([^\n,]+)[\s\S]{0,160}?Code postal\s+(\d{4})\s*,\s*Nom de la ville\s+([^\n,]+)/i,
  );
  if (!addressMatch) return {};

  const streetName = meaningful(addressMatch[1]);
  const houseRaw = meaningful(addressMatch[2]);
  const streetNumber = meaningful(houseRaw.match(/^\d+/)?.[0]);
  const streetAlpha = meaningful(houseRaw.replace(/^\d+/, ""));
  const postalCode = meaningful(addressMatch[3]);
  const city = meaningful(addressMatch[4].replace(/\s*,\s*Pays.*$/i, ""));
  const LOMKey = meaningful(block.match(/LOM Key\s*:\s*([^\n]+)/i)?.[1]);
  const house = `${streetNumber}${streetAlpha}`;
  const firstLine = clean(`${streetName} ${house}`);
  const secondLine = clean(`${postalCode} ${city}`);

  return {
    infrastructure: "fiber",
    streetName,
    streetNumber,
    streetAlpha,
    postalCode,
    city,
    mainAddress: firstLine && secondLine ? `${firstLine}, ${secondLine}` : first(firstLine, secondLine),
    LOMKey,
  };
};

const parseContactSection = (text: string) => {
  const block = section(
    text,
    /(?:^|\n)\s*Contact Client\b/i,
    [/(?:^|\n)\s*Informations d'intervention\b/i, /(?:^|\n)\s*Adresse d'installation\b/i],
  );
  const { valueLine } = getFirstDataLineAfterHeaders(block, ["Nom de la personne de contact", "N° de GSM"]);
  const phone = extractPreferredContactPhone(block);
  const emailIndex = valueLine.search(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/);
  const firstRawPhone = valueLine.match(/(?:\+|00)?\d[\d\s()./-]{7,}\d/)?.[0] ?? "";
  const beforePhone = firstRawPhone ? valueLine.slice(0, valueLine.indexOf(firstRawPhone)) : emailIndex >= 0 ? valueLine.slice(0, emailIndex) : valueLine;
  const cells = splitLoose(beforePhone);
  const contactName = meaningful(cells.length >= 3 ? cells[cells.length - 1] : "");

  return { contactName, phone };
};

const streetStartPattern = /\b(Rue|Avenue|Boulevard|Chaussée|Chaussee|Square|Clos|Place|Quai|Route|Chemin|Allée|Allee|Drève|Dreve|Sentier|Impasse|Laan|Straat|Steenweg|Weg|Plein)\b/i;

const parseCollapsedAddressRow = (valueLine: string) => {
  const line = clean(valueLine);
  const zipMatch = line.match(/\b(\d{4})\b/);
  if (!zipMatch || zipMatch.index == null) return {} as Record<string, string>;

  const afterZip = line.slice(zipMatch.index + zipMatch[0].length).trim();
  const streetMatch = streetStartPattern.exec(afterZip);
  if (!streetMatch || streetMatch.index == null) return {} as Record<string, string>;

  const city = meaningful(afterZip.slice(0, streetMatch.index));
  const fromStreet = afterZip.slice(streetMatch.index).trim();

  // Right side is stable: house number, optional address details, LOM, subArea, MDU/SDU, zone.
  const rightMatch = fromStreet.match(/^(.*?)\s+(\d+[A-Za-z]?)\s+(?:(.*?)\s+)?(\d{5,})\s+([A-Z0-9]+)\s+(SDU|MDU)\s+(.+)$/i);
  if (!rightMatch) return {} as Record<string, string>;

  const detailTokens = splitLoose(rightMatch[3] ?? "");
  return {
    "Code postal": zipMatch[1],
    "Nom de la ville": city,
    "Nom de la rue": meaningful(rightMatch[1]),
    "N° de maison": meaningful(rightMatch[2].match(/^\d+/)?.[0]),
    "N° de maison alphanumérique": meaningful(rightMatch[2].replace(/^\d+/, "")),
    "Mail Box": meaningful(detailTokens[0]),
    Etage: meaningful(detailTokens[1]),
    Appartement: meaningful(detailTokens[2]),
    "N° de bloc": meaningful(detailTokens[3]),
    "LOM Key": meaningful(rightMatch[4]),
    subArea: meaningful(rightMatch[5]),
    "Indicateur MDU/SDU": meaningful(rightMatch[6]),
    "ZONE:": meaningful(rightMatch[7]),
  };
};

const parseNewAddress = (text: string): ParsedSource => {
  const block = extractNewAddressSection(text);
  if (!block) return {};

  const infrastructureMatch = block.match(/(?:^|\n|\s)(Fiber|Fibre|Copper|Cuivre)(?=\s|\n|$)/i);
  const infrastructure = infrastructureMatch
    ? /fiber|fibre/i.test(infrastructureMatch[1])
      ? "fiber"
      : "copper"
    : "";

  const headers = [
    "Pays",
    "Code postal",
    "Nom de la ville",
    "Nom de la rue",
    "N° de maison",
    "N° de maison alphanumérique",
    "Mail Box",
    "Etage",
    "Appartement",
    "N° de bloc",
    "LOM Key",
    "subArea",
    "Indicateur MDU/SDU",
    "ZONE:",
  ];

  const { headerLine, valueLine } = getFirstDataLineAfterHeaders(block, ["Nom de la rue", "LOM Key"]);
  let row: Record<string, string> = {};

  // Browser copies with tabs preserve empty cells exactly.
  if (headerLine.includes("\t") && valueLine.includes("\t")) {
    const headerCells = headerLine.split("\t").map(clean);
    const valueCells = valueLine.split("\t").map(clean);
    for (const header of headers) {
      const index = headerCells.findIndex((cell) => cell.toLowerCase() === header.toLowerCase());
      if (index >= 0) row[header] = meaningful(valueCells[index]);
    }
  } else {
    row = parseCollapsedAddressRow(valueLine);
  }

  const street = meaningful(row["Nom de la rue"]);
  const number = meaningful(row["N° de maison"]);
  const alpha = meaningful(row["N° de maison alphanumérique"]);
  const zip = meaningful(row["Code postal"]);
  const city = meaningful(row["Nom de la ville"]);
  const house = `${number}${alpha}`;
  const firstLine = clean(`${street} ${house}`);
  const secondLine = clean(`${zip} ${city}`);

  return {
    infrastructure,
    streetName: street,
    streetNumber: number,
    streetAlpha: alpha,
    postalCode: zip,
    city,
    mainAddress: firstLine && secondLine ? `${firstLine}, ${secondLine}` : first(firstLine, secondLine),
    mailbox: meaningful(row["Mail Box"]),
    floor: meaningful(row.Etage),
    apartment: meaningful(row.Appartement),
    blockNumber: meaningful(row["N° de bloc"]),
    LOMKey: meaningful(row["LOM Key"]),
  };
};


const extractSafeFrenchDescription = (text: string): string => {
  const interventionBlock = section(
    text,
    /(?:^|\n)\s*Informations d'intervention\b/i,
    [
      /(?:^|\n)\s*Adresse d'installation\b/i,
      /(?:^|\n)\s*Order Viewer Links\b/i,
      /(?:^|\n)\s*Envoi Notification\b/i,
      /(?:^|\n)\s*Mise à jour intervention\b/i,
    ],
  );

  if (interventionBlock) {
    const lines = interventionBlock.split("\n");

    for (const line of lines) {
      const cells = splitLoose(line);
      const index = cells.findIndex((cell) =>
        /^(Descriptions|Description d'intervention)$/i.test(cell),
      );

      if (index >= 0) {
        const value = meaningful(cells[index + 1]);
        if (value && !/^(Date de création|Date souhaitée|Statut|Source|Priorité|Remarques)$/i.test(value)) {
          return value;
        }
      }
    }

    const multiline = interventionBlock.match(
      /(?:^|\n|\t| {2,})(?:Descriptions|Description d'intervention)\s*(?:\t+| {2,}|:)\s*([^\n\t]+?)(?=(?:\t+| {2,})(?:Date de création|Date souhaitée|Statut|Source|Priorité|Remarques)\b|$)/i,
    );
    const value = meaningful(multiline?.[1]);
    if (value) return value;
  }

  // Some SAFE pages copy the French description as the first standalone line.
  // Use it only when a SAFE-style "Descriptions" label exists somewhere in the text.
  if (/\bDescriptions\b/i.test(text)) {
    const firstStandalone = text
      .split("\n")
      .map(meaningful)
      .find((line) =>
        Boolean(line) &&
        !/^(powered by|Information client|Contact Client|Informations d'intervention|Adresse d'installation)/i.test(line) &&
        !/^[A-Z0-9_-]{6,}$/i.test(line),
      );
    if (firstStandalone) return firstStandalone;
  }

  return "";
};

const parseSafe = (text: string): ParsedSource => {
  const contact = parseContactSection(text);
  const customer = parseCustomerSection(text);

  const updateBlock = section(
    text,
    /(?:^|\n)\s*Mise à jour intervention\b/i,
    [/(?:^|\n)\s*Retour\b/i, /(?:^|\n)\s*Ajouter Tâche\b/i],
  );
  const remarksMatch = updateBlock.match(
    /(?:^|\n)\s*Remarques\s*(?:\t+| {2,}|\n)\s*([\s\S]*?)(?=(?:\t+| {2,}|\n)\s*(?:Action|Route vers|A la clôture|Client en ligne)\b|$)/i,
  );
  const remarksCandidate = meaningful(remarksMatch?.[1]);
  const remarks = /^Action\b/i.test(remarksCandidate) ? "" : remarksCandidate;

  const descriptionFr = extractSafeFrenchDescription(text);

  const explicitNaCid = extractLabelValue(text, ["NA / CID"]);
  const interventionId = extractLabelValue(text, ["ID d'intervention"]);
  const oagID = first(
    extractLabelValue(text, ["OAG_ID", "OAG ID", "Provisioning Order Id"]),
    extractLabelValue(text, ["ORDER_NUM"]),
  );

  const contactName = meaningful(contact.contactName);
  const fallbackName = clean(`${customer.firstName ?? ""} ${customer.lastName ?? ""}`);

  const standardAddress = parseNewAddress(text);
  const serviceOrderAddress = parseServiceOrderAddress(text);
  const address = meaningful(standardAddress.mainAddress) ? standardAddress : serviceOrderAddress;
  const fiberServiceId = extractFiberServiceId(text);

  return {
    ...address,
    interventionId,
    oagID,
    clientID: first(
      meaningfulBusinessValue(customer.clientID),
      extractBusinessLabelValue(text, ["ID client"]),
    ),
    na: explicitNaCid,
    cid: fiberServiceId,
    clientName: first(contactName, fallbackName),
    phone: meaningful(contact.phone),
    descriptionFr,
    comment: remarks ? `Remarque préexistante:\n"${remarks}"` : "",
  };
};

const parseWorkItem = (text: string): ParsedSource => {
  const snowMentioned = extractLabelValue(text, ["SNOW_ID"]);
  const infrastructureRaw = extractLabelValue(text, ["TECHNOLOGY"]);
  const infrastructure = /fiber|fibre/i.test(infrastructureRaw)
    ? "fiber"
    : /copper|cuivre/i.test(infrastructureRaw)
      ? "copper"
      : "";

  return {
    interventionId: extractLabelValue(text, ["INTERVENTION_ID"]),
    snowMentioned,
    oagID: first(
      extractLabelValue(text, ["OAG_ID"]),
      extractLabelValue(text, ["ORDER_NUM"]),
    ),
    clientID: first(
      extractBusinessLabelValue(text, ["CUSTOMER_ID"]),
      extractBusinessLabelValue(text, ["CUST_NUM"]),
    ),
    na: extractLabelValue(text, ["NA"]),
    descriptionEn: first(
      extractLabelValue(text, ["INTERVENTION_DESCRIPTION"]),
      extractLabelValue(text, ["NPS_EXC_DESCRIPTION"]),
    ),
    clientName:
      /MOBILE\s*VIKINGS/i.test(text) ||
      /LIST_FILTER\s*[:\t ]+.*MOBILE\s*VIKINGS/i.test(text)
        ? extractBusinessLabelValue(text, ["SCOPE"])
        : "",
    infrastructure,
  };
};

const normalizeNetwork = (text: string) => {
  // Only explicit operator fields are authoritative. Product names such as
  // "CFS_Scarlet internet" inside Order Items must never select the network.
  const listFilter = extractLabelValue(text, ["LIST_FILTER"]).toUpperCase();
  const explicitOperator = first(
    extractLabelValue(text, ["Opérateur", "Operateur", "Operator", "Réseau", "Reseau"]),
    listFilter,
  ).toUpperCase();

  if (explicitOperator.includes("MOBILE VIKINGS")) return "mobileVikings";
  if (explicitOperator.includes("SCARLET")) return "scarlet";
  if (/\bOLO\b/.test(explicitOperator)) return "otherOlo";
  if (explicitOperator === "PXS" || explicitOperator.includes("PROXIMUS")) return "proximus";
  return "";
};

const normalizeStatus = (text: string) => {
  const raw = first(
    extractLabelValue(text, ["Status"]),
    extractLabelValue(text, ["Statut"]),
    extractLabelValue(text, ["NPS_STATUS"]),
  ).toUpperCase();
  if (/DONE|TERMIN|CLOSED|RESOLVED/.test(raw)) return "completed";
  if (/WAIT|PENDING|HOLD|CURE CONTACT|INPROGRESS|IN PROGRESS/.test(raw)) return "on hold";
  if (/ROUTE|TRANSFER|TRANSMIS/.test(raw)) return "transferred";
  return "";
};

const merge = (safe: ParsedSource, work: ParsedSource, text: string): Partial<InterventionData> => {
  const infrastructure = first(safe.infrastructure, work.infrastructure);
  const network = normalizeNetwork(text);
  const rawClientID = first(
    meaningfulBusinessValue(work.clientID),
    meaningfulBusinessValue(safe.clientID),
  );
  const clientID =
    network === "mobileVikings" && rawClientID === "611347052"
      ? `Identifiant commun ${rawClientID}`
      : rawClientID;
  const clientName =
    network === "mobileVikings"
      ? first(
          meaningfulBusinessValue(work.clientName),
          meaningfulBusinessValue(safe.clientName),
        )
      : first(
          meaningfulBusinessValue(safe.clientName),
          meaningfulBusinessValue(work.clientName),
        );
  // A French SAFE/NPS description is authoritative whenever it exists.
  // English Work Item descriptions are used only as a fallback.
  const description = meaningful(safe.descriptionFr) || meaningful(work.descriptionEn);
  const na = infrastructure === "fiber" ? "" : first(safe.na, work.na);
  const cid = infrastructure === "fiber" ? first(safe.cid) : first(safe.cid);
  const hasAnyAddressDetail = Boolean(
    meaningful(safe.mailbox) ||
      meaningful(safe.floor) ||
      meaningful(safe.apartment) ||
      meaningful(safe.blockNumber),
  );
  const shouldIgnoreCopperLom =
    infrastructure === "copper" && hasAnyAddressDetail;

  return {
    interventionId: first(work.interventionId, safe.interventionId),
    snowMentioned: work.snowMentioned ?? "",
    oagID: first(work.oagID, safe.oagID),
    clientID,
    na,
    cid,
    clientName,
    interventionDescription: description,
    mainAddress: safe.mainAddress ?? "",
    streetName: safe.streetName ?? "",
    streetNumber: safe.streetNumber ?? "",
    streetAlpha: safe.streetAlpha ?? "",
    postalCode: safe.postalCode ?? "",
    city: safe.city ?? "",
    addressDetails: "",
    mailbox: safe.mailbox ?? "",
    floor: safe.floor ?? "",
    apartment: safe.apartment ?? "",
    blockNumber: safe.blockNumber ?? "",
    LOMKey: shouldIgnoreCopperLom ? "" : safe.LOMKey ?? "",
    phone: safe.phone ?? "",
    infrastructure,
    network,
    status: normalizeStatus(text),
    comment: safe.comment ?? "",
    additionalInformation: "",
    isSnow: false,
    displayAllFields: true,
  };
};

export const parseSmartImport = (rawText: string): SmartImportResult => {
  const text = normalizeText(rawText);
  const sourceType = detectSource(text);
  const safe = parseSafe(text);
  const work = parseWorkItem(text);
  const values = merge(safe, work, text);

  const filteredValues = Object.fromEntries(
    Object.entries(values).filter(([, value]) => {
      if (typeof value === "string") return value.trim().length > 0;
      return value !== undefined;
    }),
  ) as Partial<InterventionData>;

  return {
    values: filteredValues,
    detectedFields: Object.keys(filteredValues),
    sourceType,
  };
};
