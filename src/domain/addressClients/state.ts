import { formatAddressClientsForComment } from "./commentFormatter";
import { replaceCommentSegment } from "../comment/composer";
import { normalizeNaNumber } from "../../utils/interventionAddress";
import { serializeAddressClients } from "../../utils/addressClients";
import type { AddressClient, AddressClientMode, Intervention } from "../intervention/types";

export interface UpdateAddressClientInput {
  id: string;
  field: keyof Omit<AddressClient, "id">;
  value: string | boolean | AddressClientMode;
}

const syncClientsComment = (state: Intervention, previousSegment: string) => {
  state.clientsOnAddress = serializeAddressClients(state.addressClients, state.infrastructure);
  state.commentSegmentClientsOnAddress = formatAddressClientsForComment(
    state.addressClients,
    state.infrastructure,
  );
  state.comment = replaceCommentSegment(
    state.comment,
    previousSegment,
    state.commentSegmentClientsOnAddress,
    state.commentSegmentAddressConfirmation.trim().length > 0,
  );
};

const normalizeClient = (client: AddressClient): AddressClient => ({
  ...client,
  isFuture: Boolean(client.isFuture),
  isSameClient: Boolean(client.isSameClient),
  na: normalizeNaNumber(client.na ?? ""),
});

export const addAddressClientState = (state: Intervention, client: AddressClient): void => {
  state.addressClients.push(normalizeClient(client));
  syncClientsComment(state, state.commentSegmentClientsOnAddress);
};

export const updateAddressClientState = (
  state: Intervention,
  input: UpdateAddressClientInput,
): boolean => {
  const client = state.addressClients.find((item) => item.id === input.id);
  if (!client) return false;

  // Keep raw input while typing. Field-specific normalization is handled by the UI on blur.
  (client as unknown as Record<string, unknown>)[input.field] = input.value;
  syncClientsComment(state, state.commentSegmentClientsOnAddress);
  return true;
};

export const removeAddressClientState = (state: Intervention, id: string): void => {
  state.addressClients = state.addressClients.filter((item) => item.id !== id);
  state.clientsOnAddress = serializeAddressClients(state.addressClients, state.infrastructure);
  state.commentSegmentClientsOnAddress = formatAddressClientsForComment(
    state.addressClients,
    state.infrastructure,
  );
};

export const setAddressClientsState = (
  state: Intervention,
  clients: AddressClient[],
): void => {
  const previousSegment = state.commentSegmentClientsOnAddress;
  state.addressClients = clients.map(normalizeClient);
  syncClientsComment(state, previousSegment);
};

