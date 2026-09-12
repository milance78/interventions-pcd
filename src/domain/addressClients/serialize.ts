import type { AddressClient } from "../intervention/types";
import { addressClientHasData, normalizePersonName } from "./normalize";

const clean = (value: unknown) => String(value ?? "").trim().replace(/;+$/, "");

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
