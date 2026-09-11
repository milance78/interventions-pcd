import { describe, expect, it } from "vitest";
import {
  emptyCureRecords,
  formatCureLine,
  localDateKey,
  localTimeKey,
  normalizeCureRecords,
  removeCureLines,
  upsertCureLine,
} from "./cureRecords";

describe("CURE records", () => {
  const record = {
    date: "2026-09-11",
    time: "08:05",
    recordedAt: "2026-09-11T08:05:00.000Z",
    smsEnabled: true,
  };

  it("formats local date and time keys", () => {
    const date = new Date(2026, 8, 11, 8, 5);
    expect(localDateKey(date)).toBe("2026-09-11");
    expect(localTimeKey(date)).toBe("08:05");
  });

  it("formats a CURE line with SMS when supported", () => {
    expect(formatCureLine("firstCure", record)).toBe("1er CURE + SMS fait le 11/09/2026 à 08:05h;");
  });

  it("does not append SMS to third CURE", () => {
    expect(formatCureLine("thirdCure", record)).toBe("3eme CURE fait le 11/09/2026 à 08:05h;");
  });

  it("upserts CURE lines without duplicating them", () => {
    const records = { ...emptyCureRecords(), firstCure: record };
    const once = upsertCureLine("Bonjour", "firstCure", records);
    const twice = upsertCureLine(once, "firstCure", records);
    expect(twice).toBe(once);
  });

  it("removes only the requested CURE lines", () => {
    const records = { ...emptyCureRecords(), firstCure: record };
    const comment = "Bonjour\n1er CURE fait le 11/09/2026 à 08:05h;\nTexte manuel";
    expect(removeCureLines(comment, ["firstCure"], records)).toBe("Bonjour\nTexte manuel");
  });

  it("normalizes persisted CURE records", () => {
    expect(normalizeCureRecords({ firstCure: record }, null, null).firstCure).toEqual(record);
  });
});
