import { normalizePersonName, parseLegacyAddressClients, serializeAddressClients } from "../../utils/addressClients";
import { composeMainAddress, normalizeNaNumber, parseMainAddress } from "../../utils/interventionAddress";
import type { AddressClient, InterventionData, InterventionField } from "./types";

export type ImportedData = Partial<InterventionData>;

const normalizeImportedNa = (value: unknown) => String(value ?? "").replace(/\D/g, "").replace(/^0+/, "");

const normalizeAddressClients = (clients: AddressClient[]) =>
  clients.map((client) => ({
    ...client,
    isFuture: Boolean(client.isFuture),
    isSameClient: Boolean(client.isSameClient),
    na: normalizeImportedNa(client.na),
  }));

/**
 * Converts parser output into the canonical intervention representation.
 * This function contains no Redux/Immer logic and is therefore safe to test
 * independently from the UI.
 */
export const prepareImportedIntervention = (
  current: InterventionData,
  imported: ImportedData,
  importedAt: string,
): Partial<InterventionData> => {
  const patch: Partial<InterventionData> = {};

  for (const [key, value] of Object.entries(imported)) {
    if (value === undefined || value === null) continue;
    patch[key as InterventionField] = value as never;
  }

  if (imported.snowMentioned?.trim() && !current.snowMentionedCreatedAt) {
    patch.snowMentionedCreatedAt = importedAt;
  }
  if (imported.snowReceived?.trim() && !current.snowReceivedCreatedAt) {
    patch.snowReceivedCreatedAt = importedAt;
  }
  if (imported.snowSent?.trim() && !current.snowSentCreatedAt) {
    patch.snowSentCreatedAt = importedAt;
  }

  patch.clientName = normalizePersonName(String(imported.clientName ?? current.clientName ?? ""));

  const hasStructuredAddress =
    imported.streetName !== undefined ||
    imported.streetNumber !== undefined ||
    imported.streetAlpha !== undefined ||
    imported.postalCode !== undefined ||
    imported.city !== undefined;

  const importedAddress = hasStructuredAddress
    ? {
        streetName: String(imported.streetName ?? current.streetName ?? ""),
        streetNumber: String(imported.streetNumber ?? current.streetNumber ?? ""),
        streetAlpha: String(imported.streetAlpha ?? current.streetAlpha ?? ""),
        postalCode: String(imported.postalCode ?? current.postalCode ?? ""),
        city: String(imported.city ?? current.city ?? ""),
      }
    : parseMainAddress(String(imported.mainAddress ?? current.mainAddress ?? ""));

  patch.streetName = importedAddress.streetName;
  patch.streetNumber = importedAddress.streetNumber;
  patch.streetAlpha = importedAddress.streetAlpha;
  patch.postalCode = importedAddress.postalCode;
  patch.city = importedAddress.city;
  patch.mainAddress = composeMainAddress(importedAddress);
  patch.na = normalizeImportedNa(imported.na ?? current.na);

  let addressClients = normalizeAddressClients(current.addressClients ?? []);
  if ((!imported.addressClients || imported.addressClients.length === 0) && imported.clientsOnAddress) {
    addressClients = parseLegacyAddressClients(imported.clientsOnAddress);
  } else if (imported.addressClients) {
    addressClients = normalizeAddressClients(imported.addressClients);
  }

  patch.addressClients = addressClients;
  patch.clientsOnAddress = serializeAddressClients(addressClients, imported.infrastructure ?? current.infrastructure ?? "");

  return patch;
};
