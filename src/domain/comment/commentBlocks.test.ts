import { describe, expect, it } from "vitest";
import { replaceCommentBlock } from "./commentBlocks";

describe("replaceCommentBlock", () => {
  it("replaces an existing paragraph", () => {
    expect(replaceCommentBlock("A\n\nB", "B", "C")).toBe("A\n\nC");
  });

  it("removes a paragraph when next is empty", () => {
    expect(replaceCommentBlock("A\n\nB", "B", "")).toBe("A");
  });

  it("inserts after the first paragraph when requested", () => {
    expect(replaceCommentBlock("A\n\nC", "", "B", true)).toBe("A\n\nB\n\nC");
  });

  it("normalizes CRLF and whitespace", () => {
    expect(replaceCommentBlock(" A\r\n\r\n B ", "B", " C ")).toBe("A\n\nC");
  });
});
