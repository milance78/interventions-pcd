import { describe, expect, it } from "vitest";
import { emptyInterventionData } from "../intervention/defaults";
import {
  addAddressClientState,
  removeAddressClientState,
  setAddressClientsState,
  updateAddressClientState,
} from "./state";
import type { Intervention, AddressClient } from "../intervention/types";

const makeState = (): Intervention => ({
  ...emptyInterventionData,
  isEditing: false,
  isHistoryView: false,
  mode: "NEW",
  draftSnapshot: null,
  draftMode: null,
  draftEditSnapshot: null,
  editSnapshot: null,
  hasDraft: false,
  draftState: { active: null, displaced: null },
});

const client: AddressClient = {
  id: "1",
  fullName: "  Jean Dupont  ",
  na: "123",
  operator: "Orange",
  naInService: "",
  addressDetails: "",
  clientId: "",
  cid: "",
  voip: "",
  mode: "base",
  utac: "",
  isFuture: false,
  isSameClient: true,
};

describe("address client state", () => {
  it("normalizes and adds a client while synchronizing serialized/comment forms", () => {
    const state = makeState();
    addAddressClientState(state, client);
    expect(state.addressClients[0].fullName).toBe("Jean Dupont");
    expect(state.addressClients[0].na).toBe("0123");
    expect(state.clientsOnAddress).toContain("Jean Dupont");
    expect(state.commentSegmentClientsOnAddress).toContain("Jean Dupont");
  });

  it("updates an existing client and returns false for an unknown id", () => {
    const state = makeState();
    addAddressClientState(state, client);
    expect(updateAddressClientState(state, { id: "1", field: "fullName", value: "Marie" })).toBe(true);
    expect(state.addressClients[0].fullName).toBe("Marie");
    expect(updateAddressClientState(state, { id: "missing", field: "fullName", value: "X" })).toBe(false);
  });

  it("removes a client", () => {
    const state = makeState();
    addAddressClientState(state, client);
    removeAddressClientState(state, "1");
    expect(state.addressClients).toEqual([]);
    expect(state.clientsOnAddress).toBe("");
  });

  it("replaces the complete client collection", () => {
    const state = makeState();
    setAddressClientsState(state, [client]);
    expect(state.addressClients).toHaveLength(1);
    expect(state.clientsOnAddress).toContain("Jean Dupont");
  });
});
