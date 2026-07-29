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
});

export const normalizePersonName = (value: string) => {
  const normalized = clean(value).replace(/\s+/g, " ");
  if (!normalized) return "";
  return normalized
    .split(" ")
    .map((part) => part ? `${part.charAt(0).toLocaleUpperCase("fr-FR")}${part.slice(1).toLocaleLowerCase("fr-FR")}` : "")
    .join(" ");
};

export const addressClientHasData = (client: AddressClient) =>
  Object.entries(client).some(([key, value]) => key !== "id" && key !== "mode" && String(value).trim().length > 0);

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

const joinedDetails = (client: AddressClient, infrastructure: string) => {
  const isCopper = /^(?:copper|cuivre)$/i.test(infrastructure.trim());
  const values = isCopper
    ? [
        client.fullName,
        client.operator && `Opérateur: ${client.operator}`,
        client.naInService && `NA en service: ${client.naInService}`,
        client.clientId && `ID client: ${client.clientId}`,
        client.na && `NA: ${client.na}`,
        client.cid && `CID: ${client.cid}`,
        client.voip && `VOIP: ${client.voip}`,
      ]
    : [
        client.fullName,
        client.operator && `Opérateur: ${client.operator}`,
        client.addressDetails && `Détail d'adresse: ${client.addressDetails}`,
        client.utac && `UTAC: ${client.utac}`,
        client.cid && `CID: ${client.cid}`,
        client.clientId && `ID client: ${client.clientId}`,
        client.voip && `VOIP: ${client.voip}`,
      ];
  return values.filter(Boolean).join(" — ");
};

export const serializeAddressClients = (clients: AddressClient[], infrastructure: string) =>
  clients
    .filter(addressClientHasData)
    .map((client, index) => `${index + 1}. ${joinedDetails(client, infrastructure)};`)
    .join("\n");

export const formatAddressClientsForComment = (clients: AddressClient[], infrastructure: string) => {
  const active = clients.filter(addressClientHasData);
  if (!active.length) return "";

  const lines = active.map((client, index) => `${index + 1}. ${joinedDetails(client, infrastructure)};`);
  const isCopper = /^(?:copper|cuivre)$/i.test(infrastructure.trim());

  if (isCopper && active.length === 1) {
    return `Un client TF à l'adresse: ${joinedDetails(active[0], infrastructure)};`;
  }

  return `${isCopper ? "Clients TF à l'adresse:" : "Clients à l'adresse:"}\n${lines.join("\n")}`;
};

export const normalizeAddressClientMode = (value: unknown): AddressClientMode =>
  value === "plus" ? "plus" : "base";
