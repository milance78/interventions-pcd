import type { AddressClient, AddressClientMode } from "../redux/features/newInterventionSlice";

const clean = (value: string) => value.trim().replace(/;+$/, "");

export const createAddressClient = (id?: string): AddressClient => ({
  id: id ?? `address-client-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  mode: "base",
  fullName: "",
  operator: "",
  naInService: "",
  addressDetails: "",
  utac: "",
  clientId: "",
  na: "",
  cid: "",
  voip: "",
  isFuture: false,
  isSameClient: false,
});

export const normalizePersonName = (value: string) => {
  const normalized = value.replace(/\s+/g, " ").replace(/^\s+/, "");
  if (!normalized) return "";

  const capitalizeSegment = (segment: string) =>
    segment
      ? `${segment.charAt(0).toLocaleUpperCase("fr-FR")}${segment
          .slice(1)
          .toLocaleLowerCase("fr-FR")}`
      : "";

  return normalized
    .split(" ")
    .map((part) => part.split("-").map(capitalizeSegment).join("-"))
    .join(" ");
};

export const addressClientHasData = (client: AddressClient) =>
  Object.entries(client).some(
    ([key, value]) =>
      key !== "id" &&
      key !== "mode" &&
      key !== "isFuture" &&
      key !== "isSameClient" &&
      key !== "naInService" &&
      typeof value === "string" &&
      value.trim().length > 0,
  );

export const parseLegacyAddressClients = (value: string): AddressClient[] => {
  const names = value
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/^\s*\d+\.\s*/, ""))
    .map(clean)
    .filter(Boolean);

  return names.map((fullName, index) => ({
    ...createAddressClient(`legacy-address-client-${index + 1}`),
    fullName: normalizePersonName(fullName),
  }));
};

const sentenceCaseDetail = (label: string, value: string, keepCaps = false) => {
  const cleanedValue = clean(value);
  if (!cleanedValue) return "";

  if (keepCaps) {
    return `${label.toLocaleUpperCase("fr-FR")}: ${cleanedValue}`;
  }

  const normalizedLabel =
    label.charAt(0).toLocaleLowerCase("fr-FR") + label.slice(1);
  return `${normalizedLabel}: ${cleanedValue}`;
};

const joinedDetails = (client: AddressClient, infrastructure: string) => {
  const isCopper = /^(?:copper|cuivre)$/i.test(infrastructure.trim());
  const values = isCopper
    ? [
        normalizePersonName(client.fullName),
        sentenceCaseDetail("Opérateur", client.operator),
        sentenceCaseDetail("NA", client.na, true),
        sentenceCaseDetail("ID", client.clientId, true),
        sentenceCaseDetail("CID", client.cid, true),
        sentenceCaseDetail("VOIP", client.voip, true),
      ]
    : [
        normalizePersonName(client.fullName),
        sentenceCaseDetail("Opérateur", client.operator),
        sentenceCaseDetail("Détail d'adresse", client.addressDetails),
        sentenceCaseDetail("UTAC", client.utac, true),
        sentenceCaseDetail("ID", client.clientId, true),
        sentenceCaseDetail("CID", client.cid, true),
        sentenceCaseDetail("VOIP", client.voip, true),
      ];

  return values.filter(Boolean).join(", ");
};

const simpleClientCommentDetails = (client: AddressClient, infrastructure: string) => {
  const isCopper = /^(?:copper|cuivre)$/i.test(infrastructure.trim());
  const operator = clean(client.operator);
  const normalizedOperator = operator.toLocaleLowerCase("fr-FR");
  const isMobileVikings = normalizedOperator === "mobile vikings";
  const isAutreOlo = normalizedOperator === "autre olo";
  const serviceValue = clean(isCopper ? client.na : client.utac);
  const fullName = normalizePersonName(client.fullName);

  // Mobile Vikings / Autre OLO are special cases: the operator name replaces
  // the unavailable client name, and "chez <Réseau>" is deliberately omitted.
  const displayName = isMobileVikings
    ? "Mobile Vikings"
    : isAutreOlo
      ? "Autre OLO"
      : fullName;

  if (isCopper) {
    const parts: string[] = [];
    if (displayName) parts.push(displayName);
    if (serviceValue) parts.push(`NA: ${serviceValue}`);
    if (operator && !isMobileVikings && !isAutreOlo) parts.push(`chez ${operator}`);
    return parts.join(", ");
  }

  if (isMobileVikings) {
    return serviceValue ? `Mobile Vikings, UTAC: ${serviceValue}` : "Mobile Vikings";
  }
  if (isAutreOlo) {
    return serviceValue ? `Autre OLO, UTAC: ${serviceValue}` : "Autre OLO";
  }

  const parts: string[] = [];
  if (displayName) parts.push(displayName);
  if (serviceValue) parts.push(`UTAC: ${serviceValue}`);
  if (operator) parts.push(`chez ${operator}`);
  return parts.join(", ");
};

export const serializeAddressClients = (
  clients: AddressClient[],
  infrastructure: string,
) =>
  clients
    .filter(addressClientHasData)
    .map((client, index) => `${index + 1}. ${joinedDetails(client, infrastructure)};`)
    .join("\n");

export const formatAddressClientsForComment = (
  clients: AddressClient[],
  infrastructure: string,
) => {
  const active = clients.filter(addressClientHasData);
  if (!active.length) return "";

  const isCopper = /^(?:copper|cuivre)$/i.test(infrastructure.trim());

  if (active.length === 1) {
    const client = active[0];
    const operator = clean(client.operator);
    const normalizedOperator = operator.toLocaleLowerCase("fr-FR");
    const isMobileVikings = normalizedOperator === "mobile vikings";
    const isAutreOlo = normalizedOperator === "autre olo";

    if (isCopper) {
      const na = clean(client.na);
      const name = isMobileVikings
        ? "Mobile Vikings"
        : isAutreOlo
          ? "Autre OLO"
          : normalizePersonName(client.fullName);
      const parts = [name, na ? `NA: ${na}` : ""].filter(Boolean);
      if (!isMobileVikings && !isAutreOlo && operator) parts.push(`chez ${operator}`);
      return `Un TF à l'adresse: ${parts.join(", ")};`;
    }

    const utac = clean(client.utac);
    if (isMobileVikings) {
      return `L'UTAC à l'adresse ${utac} est occupé par un Mobile Vikings;`;
    }
    if (isAutreOlo) {
      return `L'UTAC à l'adresse ${utac} est occupé par autre OLO;`;
    }

    const name = normalizePersonName(client.fullName);
    const occupant = [name, operator ? `chez ${operator}` : ""].filter(Boolean).join(", ");
    return `L'UTAC à l'adresse ${utac} est occupé par ${occupant};`;
  }

  const lines = active.map((client, index) => {
    const details = simpleClientCommentDetails(client, infrastructure);
    return `${index + 1}. ${details}${details ? ";" : ""}`;
  });

  return isCopper
    ? `Clients TF à l'adresse:\n${lines.join("\n")}`
    : `Les UTAC à l'adresse occupés par:\n${lines.join("\n")}`;
};

export const normalizeAddressClientMode = (
  value: unknown,
): AddressClientMode => (value === "plus" ? "plus" : "base");
