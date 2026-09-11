import { describe, expect, it } from "vitest";
import {
  composeMainAddress,
  normalizeNaNumber,
  parseMainAddress,
  parsePastedNpsAddress,
} from "./interventionAddress";

describe("intervention address helpers", () => {
  it("composes a two-line Belgian address into the stored compact form", () => {
    expect(composeMainAddress({
      streetName: "Rue Emile Vandervelde",
      streetNumber: "152",
      streetAlpha: "A",
      postalCode: "4860",
      city: "Wegnez",
    })).toBe("Rue Emile Vandervelde 152A, 4860 Wegnez");
  });

  it("parses the compact address form", () => {
    expect(parseMainAddress("Rue Emile Vandervelde 152A, 4860 Wegnez")).toEqual({
      streetName: "Rue Emile Vandervelde",
      streetNumber: "152",
      streetAlpha: "A",
      postalCode: "4860",
      city: "Wegnez",
    });
  });

  it("parses the NPS clipboard order", () => {
    expect(parsePastedNpsAddress("4860 Wegnez Rue Emile Vandervelde 152 A")).toEqual({
      streetName: "Rue Emile Vandervelde",
      streetNumber: "152",
      streetAlpha: "A",
      postalCode: "4860",
      city: "Wegnez",
    });
  });

  it("normalizes NA to exactly one leading zero", () => {
    expect(normalizeNaNumber("001234")).toBe("01234");
    expect(normalizeNaNumber("1234")).toBe("01234");
    expect(normalizeNaNumber("   ")).toBe("");
  });
});
