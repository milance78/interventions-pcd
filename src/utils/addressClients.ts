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

  return normalized
    .split(" ")
    .map((part) =>
      part
        ? `${part.charAt(0).toLocaleUpperCase("fr-FR")}${part
            .slice(1)
            .toLocaleLowerCase("fr-FR")}`
        : "",
    )
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

const copperCommentDetails = (client: AddressClient) => {
  const fullName = normalizePersonName(client.fullName);
  const values = [
    fullName ? `Nom: ${fullName}` : "",
    sentenceCaseDetail("NA", client.na, true),
    sentenceCaseDetail("Opérateur", client.operator),
    sentenceCaseDetail("ID", client.clientId, true),
    sentenceCaseDetail("CID", client.cid, true),
    sentenceCaseDetail("VOIP", client.voip, true),
  ];

  return values.filter(Boolean).join(", ");
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

  if (isCopper && active.length === 1) {
    return `Un TF à l'adresse, ${copperCommentDetails(active[0])};`;
  }

  const lines = active.map((client, index) =>
    isCopper
      ? `${index + 1}. ${copperCommentDetails(client)};`
      : `${index + 1}. ${joinedDetails(client, infrastructure)};`,
  );

  return isCopper
    ? `Les clients TF à l'adresse:\n${lines.join("\n")}`
    : `Clients à l'adresse:\n${lines.join("\n")}`;
};

export const normalizeAddressClientMode = (
  value: unknown,
): AddressClientMode => (value === "plus" ? "plus" : "base");
