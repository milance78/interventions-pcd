import { describe, expect, it } from "vitest";
import { parseSmartImport } from "./smartImportParser";

describe("parseSmartImport", () => {
  it("detects SNOW and extracts common fields", () => {
    const result = parseSmartImport("SNOW_ID: INC123\nSNOW_TITLE: Fibre outage\nOAG ID: OAG999");
    expect(result.sourceType).toBe("SNOW");
    expect(result.detectedFields.length).toBeGreaterThan(0);
    expect(JSON.stringify(result.values)).toContain("INC123");
  });

  it("returns UNKNOWN for unrelated text", () => {
    const result = parseSmartImport("hello world");
    expect(result.sourceType).toBe("UNKNOWN");
    expect(result.detectedFields).toEqual(['isSnow', 'snowStatus', 'displayAllFields']);
  });

  it("normalizes copied whitespace", () => {
    const result = parseSmartImport("SNOW_ID:\u00a0ABC\r\nSNOW_TITLE:\u00a0Test");
    expect(JSON.stringify(result.values)).toContain("ABC");
  });
});
