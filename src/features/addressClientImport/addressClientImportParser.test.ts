import { describe, expect, it } from "vitest";
import { parseAddressClientImport } from "./addressClientImportParser";

describe("parseAddressClientImport", () => {
  it("parses copper NA and CID", () => {
    const result = parseAddressClientImport("Line Number: 0123456789\nCircuit ID: 987654321", "cuivre");
    expect(result.values).toEqual({ na: "0123456789", cid: "987654321" });
    expect(result.sourceType).toBe("SALY/xACTO Cuivre");
  });

  it("parses fibre FCID and normalized UTAC", () => {
    const result = parseAddressClientImport("FCID: 12345678\nBSS Position: 12 - 034 - 56", "fibre");
    expect(result.values).toEqual({ cid: "12345678", utac: "12-034-56" });
  });

  it("prioritizes provider and clears client ID for Mobile Vikings", () => {
    const result = parseAddressClientImport(
      "Network service provider: MOBILE VIKINGS - X0270\nCustomer ID: 123456",
      "fibre",
    );
    expect(result.values).toEqual({ operator: "Mobile Vikings", clientId: "" });
    expect(result.detectedFields).toContain("clientId");
  });

  it("detects Scarlet fallback", () => {
    const result = parseAddressClientImport("Brand: Scarlet Proximus\nInternet LOCO", "fibre");
    expect(result.values.operator).toBe("Scarlet");
  });
});
