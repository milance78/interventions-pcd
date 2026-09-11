import { describe, expect, it } from "vitest";
import { emptyInterventionData } from "./defaults";
import {
  captureDraftBeforeNavigation,
  getCanonicalDraftState,
  makeDraftRecord,
  refreshDraftState,
} from "./draftState";
import type { Intervention } from "./types";

const makeIntervention = (overrides: Partial<Intervention> = {}): Intervention => ({
  ...emptyInterventionData,
  isEditing: false,
  isHistoryView: false,
  mode: "NEW",
  draftSnapshot: null,
  draftMode: null,
  draftEditSnapshot: null,
  editSnapshot: null,
  hasDraft: false,
  ...overrides,
});

const withClient = (name: string): Intervention =>
  makeIntervention({ clientName: name });

describe("draft state machine", () => {
  it("does not create an active draft for a pristine NEW form", () => {
    const state = makeIntervention();
    expect(refreshDraftState(state)).toEqual({ active: null, displaced: null });
  });

  it("creates an active draft on the smallest meaningful NEW change", () => {
    const state = withClient("Jean");
    const next = refreshDraftState(state);
    expect(next.active?.snapshot.clientName).toBe("Jean");
    expect(next.active?.mode).toBe("DRAFT");
    expect(next.displaced).toBeNull();
  });

  it("moves the displayed draft to displaced when another intervention is opened", () => {
    const draft = withClient("Jean");
    const state = makeIntervention({
      ...draft,
      mode: "DRAFT",
      hasDraft: true,
      draftState: { active: makeDraftRecord(draft, "DRAFT"), displaced: null },
    });

    const next = captureDraftBeforeNavigation(state);
    expect(next.active).toBeNull();
    expect(next.displaced?.snapshot.clientName).toBe("Jean");
  });

  it("creates a displaced draft when leaving a modified saved intervention", () => {
    const baseline = withClient("Jean");
    const edited = withClient("Paul");
    const state = makeIntervention({
      ...edited,
      mode: "TODAY_EDIT",
      isEditing: true,
      editSnapshot: { ...baseline },
    });

    const next = captureDraftBeforeNavigation(state);
    expect(next.active).toBeNull();
    expect(next.displaced?.snapshot.clientName).toBe("Paul");
    expect(next.displaced?.editSnapshot?.clientName).toBe("Jean");
    expect(next.displaced?.mode).toBe("TODAY_EDIT");
  });

  it("keeps an existing displaced draft when a saved intervention is opened without edits", () => {
    const draft = withClient("Jean");
    const state = makeIntervention({
      ...withClient("Paul"),
      mode: "TODAY_EDIT",
      isEditing: true,
      editSnapshot: { ...withClient("Paul") },
      draftState: { active: null, displaced: makeDraftRecord(draft, "DRAFT") },
    });

    const next = captureDraftBeforeNavigation(state);
    expect(next.active).toBeNull();
    expect(next.displaced?.snapshot.clientName).toBe("Jean");
  });

  it("does not lose a displaced draft when the current intervention is edited", () => {
    const displaced = makeDraftRecord(withClient("Jean"), "DRAFT");
    const state = makeIntervention({
      ...withClient("Paul"),
      mode: "TODAY_EDIT",
      isEditing: true,
      editSnapshot: { ...withClient("Paul") },
      draftState: { active: null, displaced },
    });
    const edited = { ...state, clientName: "Pierre" };

    const next = refreshDraftState(edited);
    expect(next.active?.snapshot.clientName).toBe("Pierre");
    expect(next.displaced?.snapshot.clientName).toBe("Jean");
  });

  it("removes the active edit draft when the saved baseline is restored", () => {
    const baseline = withClient("Jean");
    const state = makeIntervention({
      ...baseline,
      mode: "TODAY_EDIT",
      isEditing: true,
      editSnapshot: { ...baseline },
      draftState: {
        active: makeDraftRecord(withClient("Paul"), "TODAY_EDIT", { ...baseline }),
        displaced: makeDraftRecord(withClient("Marc"), "DRAFT"),
      },
    });

    const next = refreshDraftState(state);
    expect(next.active).toBeNull();
    expect(next.displaced?.snapshot.clientName).toBe("Marc");
  });

  it("migrates a legacy displayed draft without treating it as displaced", () => {
    const draft = withClient("Jean");
    const state = makeIntervention({
      ...draft,
      hasDraft: true,
      draftSnapshot: draft,
      draftMode: "DRAFT",
    });
    expect(getCanonicalDraftState(state).active?.snapshot.clientName).toBe("Jean");
    expect(getCanonicalDraftState(state).displaced).toBeNull();
  });
});
