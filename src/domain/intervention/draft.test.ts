import { describe, expect, it } from "vitest";
import { emptyInterventionData } from "./defaults";
import { hasMeaningfulDraft, isSameInterventionData } from "./draft";

describe("draft predicates", () => {
  it("does not treat a pristine form as a brouillon", () => {
    expect(hasMeaningfulDraft(emptyInterventionData)).toBe(false);
  });

  it("treats the smallest real field entry as a brouillon", () => {
    expect(hasMeaningfulDraft({ ...emptyInterventionData, interventionId: "X" })).toBe(true);
  });

  it("ignores UI-only display state and timestamps", () => {
    expect(hasMeaningfulDraft({
      ...emptyInterventionData,
      displayAllFields: true,
      updatedAt: "2026-09-11T10:00:00.000Z",
    })).toBe(false);
  });

  it("detects a real change against the saved snapshot", () => {
    const saved = { ...emptyInterventionData, interventionId: "ABC" };
    expect(isSameInterventionData(saved, { ...saved, clientName: "Jean" })).toBe(false);
  });

  it("ignores updatedAt when comparing intervention snapshots", () => {
    const saved = { ...emptyInterventionData, interventionId: "ABC", updatedAt: "one" };
    expect(isSameInterventionData(saved, { ...saved, updatedAt: "two" })).toBe(true);
  });
});
