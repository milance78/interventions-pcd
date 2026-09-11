import type { AddressClient } from "../domain/intervention/types";
import { addressClientHasData, normalizeAddressClientMode, normalizePersonName } from "../domain/addressClients/normalize";
import { formatAddressClientsForComment } from "../domain/addressClients/commentFormatter";

export { addressClientHasData, normalizeAddressClientMode, normalizePersonName } from "../domain/addressClients/normalize";
export { formatAddressClientsForComment } from "../domain/addressClients/commentFormatter";

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



/**
 * Converts the legacy free-text clientsOnAddress value into structured
 * addressClients records. Kept here as a compatibility export for existing
 * Firebase migration/read paths.
 */
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

export const serializeAddressClients = (
  clients: AddressClient[],
  infrastructure: string,
) =>
  clients
    .filter(addressClientHasData)
    .map((client, index) => `${index + 1}. ${joinedDetails(client, infrastructure)};`)
    .join("\n");
