import { describe, expect, it } from "vitest";
import { emptyInterventionData } from "./defaults";
import { getDraftPresentation, hasDisplacedDraft, isDisplayedDraft } from "./draftSelectors";
import type { Intervention } from "./types";

const makeIntervention = (overrides: Partial<Intervention>): Intervention => ({
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

describe("draftSelectors", () => {
  it("returns none when there is no draft", () => {
    expect(getDraftPresentation(makeIntervention({}))).toBe("none");
  });

  it("returns none for a stale empty draft snapshot", () => {
    expect(
      getDraftPresentation(
        makeIntervention({ hasDraft: true, draftSnapshot: { ...emptyInterventionData }, draftState: { active: null, displaced: null } }),
      ),
    ).toBe("none");
  });

  it("recognizes the draft currently displayed", () => {
    const draftSnapshot = { ...emptyInterventionData, clientName: "Jean" };
    const intervention = makeIntervention({
      ...draftSnapshot,
      hasDraft: true,
      draftSnapshot,
      draftState: { active: { snapshot: draftSnapshot, mode: "DRAFT", editSnapshot: null }, displaced: null },
    });

    expect(getDraftPresentation(intervention)).toBe("displayed");
    expect(isDisplayedDraft(intervention)).toBe(true);
    expect(hasDisplacedDraft(intervention)).toBe(false);
  });

  it("recognizes a draft displaced by another intervention", () => {
    const draftSnapshot = { ...emptyInterventionData, clientName: "Jean" };
    const intervention = makeIntervention({
      clientName: "Paul",
      hasDraft: true,
      draftSnapshot,
      draftState: { active: null, displaced: { snapshot: draftSnapshot, mode: "DRAFT", editSnapshot: null } },
    });

    expect(getDraftPresentation(intervention)).toBe("displaced");
    expect(isDisplayedDraft(intervention)).toBe(false);
    expect(hasDisplacedDraft(intervention)).toBe(true);
  });
});
