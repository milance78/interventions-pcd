export interface StructuredMainAddress {
  streetName: string;
  streetNumber: string;
  streetAlpha: string;
  postalCode: string;
  city: string;
}

const cleanPart = (value: string | null | undefined) =>
  String(value ?? "").replace(/\s+/g, " ").trim();

export const emptyStructuredMainAddress = (): StructuredMainAddress => ({
  streetName: "",
  streetNumber: "",
  streetAlpha: "",
  postalCode: "",
  city: "",
});

export const composeMainAddress = (
  address: Partial<StructuredMainAddress>,
): string => {
  const streetName = cleanPart(address.streetName);
  const streetNumber = cleanPart(address.streetNumber);
  const streetAlpha = cleanPart(address.streetAlpha);
  const postalCode = cleanPart(address.postalCode);
  const city = cleanPart(address.city);

  const house = `${streetNumber}${streetAlpha}`.trim();
  const firstLine = [streetName, house].filter(Boolean).join(" ");
  const secondLine = [postalCode, city].filter(Boolean).join(" ");

  return [firstLine, secondLine].filter(Boolean).join(", ");
};

/** Best-effort migration for interventions that only contain mainAddress. */
export const parseMainAddress = (value: string): StructuredMainAddress => {
  const normalized = cleanPart(value);
  if (!normalized) return emptyStructuredMainAddress();

  let firstLine = normalized;
  let postalCode = "";
  let city = "";

  const postalMatch = normalized.match(/(?:,\s*|\s+)(\d{4})\s+(.+)$/u);
  if (postalMatch?.index !== undefined) {
    firstLine = normalized.slice(0, postalMatch.index).replace(/,\s*$/, "").trim();
    postalCode = postalMatch[1];
    city = postalMatch[2].trim();
  }

  let streetName = firstLine;
  let streetNumber = "";
  let streetAlpha = "";
  const houseMatch = firstLine.match(/^(.*?)[,\s]+(\d+)\s*([\p{L}]*)$/u);
  if (houseMatch) {
    streetName = houseMatch[1].replace(/,\s*$/, "").trim();
    streetNumber = houseMatch[2];
    streetAlpha = houseMatch[3] ?? "";
  }

  return { streetName, streetNumber, streetAlpha, postalCode, city };
};

export const normalizeNaNumber = (value: string): string => {
  const trimmedLeft = value.replace(/^\s+/, "");
  if (!trimmedLeft) return "";

  // Keep the user's content, but guarantee exactly one leading zero.
  const withoutLeadingZeros = trimmedLeft.replace(/^0+/, "");
  return `0${withoutLeadingZeros}`;
};
