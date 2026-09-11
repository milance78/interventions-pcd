import { describe, expect, it } from "vitest";
import { emptyInterventionData } from "./defaults";
import { applyInterventionFieldUpdate } from "./fieldUpdate";
import type { Intervention } from "./types";

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
  draftState: {
    active: null,
    displaced: null,
  },
});

describe("applyInterventionFieldUpdate", () => {
  it("normalizes NA and client name", () => {
    const state = makeState();
    applyInterventionFieldUpdate(state, "na", "NA 123 / 45");
    applyInterventionFieldUpdate(state, "clientName", "  jean  dupont ");

    expect(state.na).not.toBe("NA 123 / 45");
    expect(state.clientName).toBe("Jean Dupont");
  });

  it("rebuilds the structured main address when address parts change", () => {
    const state = makeState();
    state.streetName = "Rue de Paris";
    state.streetNumber = "12";
    state.streetAlpha = "B";
    state.postalCode = "75001";
    state.city = "Paris";

    applyInterventionFieldUpdate(state, "city", "Lyon");

    expect(state.mainAddress).toContain("Rue de Paris");
    expect(state.mainAddress).toContain("Lyon");
  });

  it("splits a legacy main address when it is pasted", () => {
    const state = makeState();
    applyInterventionFieldUpdate(
      state,
      "mainAddress",
      "12 Rue de Paris, 75001 Paris",
    );

    expect(state.streetName).toBeTruthy();
    expect(state.mainAddress).toBeTruthy();
  });

  it("timestamps Snow only on the first transition from empty", () => {
    const state = makeState();

    applyInterventionFieldUpdate(
      state,
      "snowReceived",
      "first",
      { now: "2026-09-11T10:00:00.000Z" },
    );
    applyInterventionFieldUpdate(
      state,
      "snowReceived",
      "second",
      { now: "2026-09-11T11:00:00.000Z" },
    );

    expect(state.snowReceivedCreatedAt).toBe("2026-09-11T10:00:00.000Z");
  });

  it("updates the derived Snow pending flag", () => {
    const state = makeState();
    applyInterventionFieldUpdate(state, "isSnowReceivedPending", true);
    expect(state.isSnow).toBe(true);

    applyInterventionFieldUpdate(state, "isSnowReceivedPending", false);
    expect(state.isSnow).toBe(false);
  });

  it("maintains cure pending timestamp semantics", () => {
    const state = makeState();

    applyInterventionFieldUpdate(
      state,
      "cure",
      "firstCure",
      { now: "2026-09-11T12:00:00.000Z" },
    );
    expect(state.curePendingSince).toBe("2026-09-11T12:00:00.000Z");

    applyInterventionFieldUpdate(
      state,
      "cure",
      "noCure",
      { now: "2026-09-11T13:00:00.000Z" },
    );
    expect(state.curePendingSince).toBeNull();
  });
});
