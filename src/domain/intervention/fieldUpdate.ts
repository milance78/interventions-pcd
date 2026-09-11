import type {
  Intervention,
  InterventionData,
  InterventionField,
} from "./types";
import { formatAddressClientsForComment } from "../addressClients/commentFormatter";
import {
  normalizePersonName,
  parseLegacyAddressClients,
} from "../../utils/addressClients";
import {
  composeMainAddress,
  normalizeNaNumber,
  parseMainAddress,
} from "../../utils/interventionAddress";
import { serializeAddressClients } from "../../utils/addressClients";

export interface FieldUpdateContext {
  now?: string;
}

/**
 * Applies the domain rules that accompany a generic intervention field update.
 *
 * Keeping these rules outside the Redux reducer makes the reducer responsible
 * for state transitions while this module owns field normalization and
 * derived-field maintenance.
 */
export const applyInterventionFieldUpdate = (
  state: Intervention,
  field: InterventionField,
  value: InterventionData[InterventionField],
  context: FieldUpdateContext = {},
): void => {
  const now = context.now ?? new Date().toISOString();

  const previousCure = state.cure;
  const previousSnowMentioned = state.snowMentioned;
  const previousSnowReceived = state.snowReceived;
  const previousSnowSent = state.snowSent;

  (
    state as unknown as Record<
      InterventionField,
      InterventionData[InterventionField]
    >
  )[field] = value;

  if (
    field === "snowMentioned" &&
    typeof value === "string" &&
    !previousSnowMentioned.trim() &&
    value.trim() &&
    !state.snowMentionedCreatedAt
  ) {
    state.snowMentionedCreatedAt = now;
  }

  if (
    field === "snowReceived" &&
    typeof value === "string" &&
    !previousSnowReceived.trim() &&
    value.trim() &&
    !state.snowReceivedCreatedAt
  ) {
    state.snowReceivedCreatedAt = now;
  }

  if (
    field === "snowSent" &&
    typeof value === "string" &&
    !previousSnowSent.trim() &&
    value.trim() &&
    !state.snowSentCreatedAt
  ) {
    state.snowSentCreatedAt = now;
  }

  if (field === "na" && typeof value === "string") {
    state.na = normalizeNaNumber(value);
  }

  if (field === "clientName" && typeof value === "string") {
    state.clientName = normalizePersonName(value);
  }

  if (
    field === "streetName" ||
    field === "streetNumber" ||
    field === "streetAlpha" ||
    field === "postalCode" ||
    field === "city"
  ) {
    state.mainAddress = composeMainAddress(state);
  }

  if (field === "mainAddress" && typeof value === "string") {
    const parsed = parseMainAddress(value);
    state.streetName = parsed.streetName;
    state.streetNumber = parsed.streetNumber;
    state.streetAlpha = parsed.streetAlpha;
    state.postalCode = parsed.postalCode;
    state.city = parsed.city;
    state.mainAddress = composeMainAddress(parsed);
  }

  if (field === "comment" && typeof value === "string") {
    state.commentSegmentGeneralInfo = value;
  }

  if (field === "addressConfirmation") {
    state.commentSegmentAddressConfirmation =
      value === "confirmed"
        ? "Adresse confirmée"
        : value === "notConfirmed"
          ? "Adresse pas confirmée"
          : "";
  }

  if (field === "clientsOnAddress" && typeof value === "string") {
    state.addressClients = parseLegacyAddressClients(value);
    state.commentSegmentClientsOnAddress = formatAddressClientsForComment(
      state.addressClients,
      state.infrastructure,
    );
  }

  if (field === "addressClients" && Array.isArray(value)) {
    state.clientsOnAddress = serializeAddressClients(
      value,
      state.infrastructure,
    );
    state.commentSegmentClientsOnAddress = formatAddressClientsForComment(
      value,
      state.infrastructure,
    );
  }

  if (field === "infrastructure") {
    state.clientsOnAddress = serializeAddressClients(
      state.addressClients,
      String(value),
    );
    state.commentSegmentClientsOnAddress = formatAddressClientsForComment(
      state.addressClients,
      String(value),
    );
  }

  if (field === "cure") {
    const nextCure = value as Intervention["cure"];
    const isPendingCure =
      nextCure === "firstCure" || nextCure === "secondCure";

    if (!isPendingCure) {
      state.curePendingSince = null;
    } else if (previousCure !== nextCure || !state.curePendingSince) {
      state.curePendingSince = now;
    }
  }

  if (field === "isSnowReceivedPending" || field === "isSnowSentPending") {
    state.isSnow =
      state.isSnowReceivedPending || state.isSnowSentPending;
  }
};
