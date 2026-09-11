import { describe, expect, it } from "vitest";
import { emptyInterventionData } from "./defaults";
import type { Intervention } from "./types";
import {
  cancelDraft,
  clearCurrentForm,
  clearTask,
  loadDraft,
  loadInterventionForEdit,
  loadInterventionFromHistory,
  loadInterventionFromSearch,
  resumeDraft,
  startNewIntervention,
} from "./lifecycle";

const makeState = (overrides: Partial<Intervention> = {}): Intervention => ({
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
  ...overrides,
});

describe("intervention lifecycle", () => {
  it("does not create a draft when loading an empty draft", () => {
    const result = loadDraft({});
    expect(result.mode).toBe("NEW");
    expect(result.hasDraft).toBe(false);
    expect(result.draftState).toEqual({ active: null, displaced: null });
  });

  it("creates an active draft as soon as a new intervention has meaningful input", () => {
    const result = loadDraft({ interventionDescription: "test" });
    expect(result.mode).toBe("DRAFT");
    expect(result.draftState?.active?.snapshot.interventionDescription).toBe("test");
    expect(result.draftState?.displaced).toBeNull();
  });

  it("moves the active draft to displaced when starting a new intervention", () => {
    const current = loadDraft({ interventionDescription: "draft A" });
    const result = startNewIntervention(current);
    expect(result.mode).toBe("NEW");
    expect(result.draftState?.active).toBeNull();
    expect(result.draftState?.displaced?.snapshot.interventionDescription).toBe("draft A");
    expect(result.hasDraft).toBe(true);
  });

  it("captures unsaved edits before opening today/history/search", () => {
    const saved = makeState({
      mode: "TODAY_EDIT",
      isEditing: true,
      interventionId: "saved-1",
      interventionDescription: "saved",
      editSnapshot: { ...emptyInterventionData, interventionId: "saved-1", interventionDescription: "saved" },
    });
    const edited = { ...saved, interventionDescription: "changed" };

    for (const loader of [loadInterventionForEdit, loadInterventionFromHistory, loadInterventionFromSearch]) {
      const result = loader(edited, makeState({ interventionId: "destination" }));
      expect(result.draftState?.displaced?.snapshot.interventionDescription).toBe("changed");
    }
  });

  it("resumes the displaced draft and consumes only the displaced slot", () => {
    const draft = loadDraft({ interventionDescription: "original" });
    const displaced = startNewIntervention(draft);
    const result = resumeDraft(displaced);
    expect(result.mode).toBe("DRAFT");
    expect(result.interventionDescription).toBe("original");
    expect(result.draftState?.active?.snapshot.interventionDescription).toBe("original");
    expect(result.draftState?.displaced).toBeNull();
  });

  it("cancelDraft removes both active and displaced drafts", () => {
    const draft = loadDraft({ interventionDescription: "draft" });
    const displaced = startNewIntervention(draft);
    const result = cancelDraft(displaced);
    expect(result.hasDraft).toBe(false);
    expect(result.draftState).toEqual({ active: null, displaced: null });
  });

  it("clearCurrentForm preserves a displaced draft while clearing the displayed new form", () => {
    const draft = loadDraft({ interventionDescription: "draft" });
    const state = startNewIntervention(draft);
    const result = clearCurrentForm(state);
    expect(result.mode).toBe("NEW");
    expect(result.interventionDescription).toBe("");
    expect(result.draftState?.displaced?.snapshot.interventionDescription).toBe("draft");
  });

  it("clearTask consumes the active draft but preserves a different displaced draft", () => {
    const displaced = startNewIntervention(loadDraft({ interventionDescription: "background" }));
    const active = loadDraft({ interventionDescription: "current" });
    const state = { ...active, draftState: { active: active.draftState!.active, displaced: displaced.draftState!.displaced } };
    const result = clearTask(state);
    expect(result.draftState?.active).toBeNull();
    expect(result.draftState?.displaced?.snapshot.interventionDescription).toBe("background");
  });
});
