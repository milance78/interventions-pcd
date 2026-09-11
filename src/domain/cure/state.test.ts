import { describe, expect, it } from "vitest";
import { clearTodaysCureState, recordCureState, updateRecordedCureSmsState } from "./state";
import type { Intervention } from "../intervention/types";

const base = (): Pick<Intervention, "cure" | "cureRecords" | "curePendingSince" | "comment" | "commentActionCure"> => ({
  cure: "noCure",
  cureRecords: { firstCure: null, secondCure: null, thirdCure: null },
  curePendingSince: null,
  comment: "Adresse OK;",
  commentActionCure: "",
});

describe("cure state domain", () => {
  it("records a new CURE and updates comment data", () => {
    const result = recordCureState(base(), {
      cure: "firstCure",
      recordedAt: "2026-09-11T10:20:00.000Z",
      smsEnabled: true,
    });
    expect(result.cure).toBe("firstCure");
    expect(result.cureRecords.firstCure?.smsEnabled).toBe(true);
    expect(result.comment).toContain("1er CURE + SMS fait le");
    expect(result.commentActionCure).toContain("1er CURE + SMS fait le");
  });

  it("does not overwrite a previous-day CURE record", () => {
    const current = { ...base(), cureRecords: {
      firstCure: { date: "2026-09-10", time: "09:00", recordedAt: "2026-09-10T07:00:00.000Z", smsEnabled: false },
      secondCure: null, thirdCure: null,
    }};
    const result = recordCureState(current, { cure: "firstCure", recordedAt: "2026-09-11T10:20:00.000Z", smsEnabled: true });
    expect(result.cureRecords.firstCure?.date).toBe("2026-09-10");
  });

  it("changes SMS only for today's record", () => {
    const current = recordCureState(base(), { cure: "secondCure", recordedAt: "2026-09-11T10:20:00.000Z", smsEnabled: false });
    const result = updateRecordedCureSmsState(current, { cure: "secondCure", smsEnabled: true }, new Date("2026-09-11T12:00:00"));
    expect(result?.cureRecords.secondCure?.smsEnabled).toBe(true);
  });

  it("refuses SMS changes for an older record", () => {
    const current = { ...base(), cureRecords: {
      firstCure: { date: "2026-09-10", time: "09:00", recordedAt: "2026-09-10T07:00:00.000Z", smsEnabled: false },
      secondCure: null, thirdCure: null,
    }};
    expect(updateRecordedCureSmsState(current, { cure: "firstCure", smsEnabled: true }, new Date("2026-09-11T12:00:00"))).toBeNull();
  });

  it("clears today's records but preserves older CURE records", () => {
    const current = { ...base(), cure: "thirdCure" as const, cureRecords: {
      firstCure: { date: "2026-09-10", time: "09:00", recordedAt: "2026-09-10T07:00:00.000Z", smsEnabled: false },
      secondCure: { date: "2026-09-11", time: "10:00", recordedAt: "2026-09-11T08:00:00.000Z", smsEnabled: false },
      thirdCure: { date: "2026-09-11", time: "11:00", recordedAt: "2026-09-11T09:00:00.000Z", smsEnabled: false },
    }, comment: "1er CURE fait le 10/09/2026 à 09:00h;\n2eme CURE fait le 11/09/2026 à 10:00h;\n3eme CURE fait le 11/09/2026 à 11:00h;" };
    const result = clearTodaysCureState(current, new Date("2026-09-11T12:00:00"));
    expect(result.cureRecords.firstCure).not.toBeNull();
    expect(result.cureRecords.secondCure).toBeNull();
    expect(result.cureRecords.thirdCure).toBeNull();
    expect(result.cure).toBe("firstCure");
    expect(result.comment).toContain("1er CURE");
    expect(result.comment).not.toContain("2eme CURE");
  });
});
