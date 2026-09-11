import { describe, expect, it } from "vitest";
import { mapIntervention, normalizeLegacyFields, stripUiFields } from "./serialization";

describe("intervention serialization", () => {
  it("normalizes legacy address and snow fields", () => {
    const data = normalizeLegacyFields({
      mainAddress: "12 rue Test, 75001 Paris",
      clientsOnAddress: "Jean Dupont",
      snowReference: "SNOW-1",
      Cure: "CURE2",
      isAddressConfirmed: true,
    });

    expect(data.addressConfirmation).toBe("confirmed");
    expect(data.snowReceived).toBe("SNOW-1");
    expect(data.cure).toBe("secondCure");
    expect(data.addressClients).toHaveLength(1);
  });

  it("maps persisted data to a clean view intervention", () => {
    const result = mapIntervention("doc-1", "2026-09-11", {
      comment: "test",
      createdAt: "2026-09-11T10:00:00.000Z",
      updatedAt: "2026-09-11T11:00:00.000Z",
    });

    expect(result.documentId).toBe("doc-1");
    expect(result.dateKey).toBe("2026-09-11");
    expect(result.mode).toBe("VIEW_HISTORY");
    expect(result.isEditing).toBe(false);
    expect(result.draftState).toEqual({ active: null, displaced: null });
  });

  it("removes UI-only fields before persistence", () => {
    const intervention = mapIntervention("doc-1", "2026-09-11", { comment: "test" });
    const persisted = stripUiFields(intervention);

    expect(persisted).not.toHaveProperty("documentId");
    expect(persisted).not.toHaveProperty("draftState");
    expect(persisted).not.toHaveProperty("mode");
    expect(persisted).not.toHaveProperty("isEditing");
    expect(persisted.comment).toBe("test");
  });
});
