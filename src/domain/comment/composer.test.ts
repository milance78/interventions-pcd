import { describe, expect, it } from "vitest";
import {
  removeAutomaticAddressLines,
  replaceActionCommentLine,
  replaceCommentSegment,
  replaceResiliationBciLine,
} from "./composer";

describe("comment composer", () => {
  it("replaces a logical segment without disturbing other paragraphs", () => {
    expect(replaceCommentSegment("A\n\nOLD\n\nB", "OLD", "NEW")).toBe("A\n\nB\n\nNEW");
  });

  it("can place a segment immediately after the first paragraph", () => {
    expect(replaceCommentSegment("A\n\nB", "", "X", true)).toBe("A\n\nX\n\nB");
  });

  it("replaces action lines by prefix", () => {
    expect(replaceActionCommentLine("A\n\nT173: old\n\nB", ["T173:"], "T173: new"))
      .toBe("A\n\nB\n\nT173: new");
  });

  it("removes generated address confirmation lines only", () => {
    expect(removeAutomaticAddressLines("Adresse confirmée\n\nNote\n\nAdresse pas confirmée"))
      .toBe("Note");
  });

  it("updates an existing RES line with the BCI reference", () => {
    expect(replaceResiliationBciLine("RES en attente: client\n\nX", "123")).toEqual({
      comment: "RES en attente: client, BCI: 123\n\nX",
      line: "RES en attente: client, BCI: 123",
    });
  });

  it("appends BCI when no RES line exists", () => {
    expect(replaceResiliationBciLine("X", "123")).toEqual({
      comment: "X\n\nBCI: 123",
      line: "BCI: 123",
    });
  });
});
