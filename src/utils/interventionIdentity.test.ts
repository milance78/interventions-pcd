import { describe, expect, it } from "vitest";
import { interventionActivityValue, interventionLogicalKey, isSameLogicalIntervention } from "./interventionIdentity";

describe("intervention identity", () => {
  it("prefers Intervention ID, then OAG, then document ID", () => {
    expect(interventionLogicalKey({ documentId: "D", interventionId: " INT-1 ", oagID: "O" })).toBe("intervention:int-1");
    expect(interventionLogicalKey({ documentId: "D", interventionId: "", oagID: " O-1 " })).toBe("oag:o-1");
    expect(interventionLogicalKey({ documentId: "D", interventionId: "", oagID: "" })).toBe("document:D");
  });

  it("uses document ID as immutable identity when both have it", () => {
    expect(isSameLogicalIntervention(
      { documentId: "D", interventionId: "A", oagID: "1" },
      { documentId: "D", interventionId: "B", oagID: "2" },
    )).toBe(true);
  });

  it("uses updatedAt as activity before createdAt and dateKey", () => {
    expect(interventionActivityValue({ updatedAt: "u", createdAt: "c", dateKey: "d" })).toBe("u");
    expect(interventionActivityValue({ updatedAt: null, createdAt: "c", dateKey: "d" })).toBe("c");
  });
});
