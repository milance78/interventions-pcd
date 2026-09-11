import { describe, expect, it } from "vitest";
import { emptyInterventionData } from "./defaults";
import { prepareImportedIntervention } from "./importData";

const base = () => ({ ...emptyInterventionData, addressClients: [] });

describe("prepareImportedIntervention", () => {
  it("normalizes imported client and address data", () => {
    const result = prepareImportedIntervention(
      base(),
      {
        clientName: "  JEAN DUPONT  ",
        mainAddress: "Rue Test 12, 1000 Bruxelles",
        na: "12 34/56",
      },
      "2026-09-11T21:00:00.000Z",
    );

    expect(result.clientName).toBe("Jean Dupont");
    expect(result.mainAddress).toContain("Rue Test");
    expect(result.na).toBe("123456");
  });

  it("stamps Snow only when the existing timestamp is empty", () => {
    const current = {
      ...base(),
      snowMentionedCreatedAt: "2026-09-10T10:00:00.000Z",
    };
    const result = prepareImportedIntervention(
      current,
      { snowMentioned: "SNOW-123", snowReceived: "SNOW-456", snowSent: "SNOW-789" },
      "2026-09-11T21:00:00.000Z",
    );

    expect(result.snowMentionedCreatedAt).toBeUndefined();
    expect(result.snowReceivedCreatedAt).toBe("2026-09-11T21:00:00.000Z");
    expect(result.snowSentCreatedAt).toBe("2026-09-11T21:00:00.000Z");
  });

  it("uses structured imported address clients when supplied", () => {
    const clients = [{
      id: "1", mode: "base" as const, fullName: "Test Client", operator: "Vikings",
      naInService: "", addressDetails: "", utac: "", clientId: "", na: "12 34",
      cid: "", voip: "", isFuture: false, isSameClient: true,
    }];
    const result = prepareImportedIntervention(base(), { infrastructure: "Cuivre", addressClients: clients }, "2026-09-11T21:00:00.000Z");
    expect(result.addressClients?.[0].na).toBe("1234");
    expect(result.clientsOnAddress).toContain("Test Client");
  });

  it("falls back to legacy clientsOnAddress when structured clients are absent", () => {
    const result = prepareImportedIntervention(base(), { infrastructure: "Cuivre", clientsOnAddress: "1. Jean Dupont" }, "2026-09-11T21:00:00.000Z");
    expect(result.addressClients).toHaveLength(1);
    expect(result.addressClients?.[0].fullName).toBe("Jean Dupont");
  });
});
