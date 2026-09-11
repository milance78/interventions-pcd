import type { CureKey, CureRecords, Intervention } from "../intervention/types";
import { cureOrder, emptyCureRecords, localDateKey, localTimeKey, removeCureLines, upsertCureLine } from "../../utils/cureRecords";

export interface CureStatePatch {
  cure: Intervention["cure"];
  cureRecords: CureRecords;
  curePendingSince: string | null;
  comment: string;
  commentActionCure: string;
}

const buildCommentActionCure = (records: CureRecords): string =>
  cureOrder.map((key) => records[key]).filter(Boolean).map((record, index) => {
    const cure = cureOrder[index];
    return record ? upsertCureLine("", cure, { ...emptyCureRecords(), [cure]: record }) : "";
  }).filter(Boolean).join("\n");

const pendingSinceFor = (cure: Intervention["cure"], records: CureRecords): string | null =>
  cure === "firstCure" || cure === "secondCure" ? records[cure]?.recordedAt ?? null : null;

export const recordCureState = (
  current: Pick<Intervention, "cure" | "cureRecords" | "curePendingSince" | "comment" | "commentActionCure">,
  payload: { cure: CureKey; recordedAt: string; smsEnabled: boolean },
): CureStatePatch => {
  const now = new Date(payload.recordedAt);
  const todayKey = localDateKey(now);
  const existing = current.cureRecords[payload.cure];
  const nextRecords: CureRecords = {
    ...current.cureRecords,
    [payload.cure]: existing && existing.date !== todayKey ? existing : {
      date: todayKey, time: localTimeKey(now), recordedAt: payload.recordedAt, smsEnabled: payload.smsEnabled,
    },
  };
  return {
    cure: payload.cure,
    cureRecords: nextRecords,
    curePendingSince: pendingSinceFor(payload.cure, nextRecords),
    comment: upsertCureLine(current.comment, payload.cure, nextRecords),
    commentActionCure: buildCommentActionCure(nextRecords),
  };
};

export const updateRecordedCureSmsState = (
  current: Pick<Intervention, "cure" | "cureRecords" | "curePendingSince" | "comment" | "commentActionCure">,
  payload: { cure: CureKey; smsEnabled: boolean },
  today = new Date(),
): CureStatePatch | null => {
  const existing = current.cureRecords[payload.cure];
  if (!existing || existing.date !== localDateKey(today)) return null;
  const nextRecords: CureRecords = { ...current.cureRecords, [payload.cure]: { ...existing, smsEnabled: payload.smsEnabled } };
  return {
    cure: current.cure,
    cureRecords: nextRecords,
    curePendingSince: pendingSinceFor(current.cure, nextRecords),
    comment: upsertCureLine(current.comment, payload.cure, nextRecords),
    commentActionCure: buildCommentActionCure(nextRecords),
  };
};

export const clearTodaysCureState = (
  current: Pick<Intervention, "cure" | "cureRecords" | "curePendingSince" | "comment" | "commentActionCure">,
  today = new Date(),
): CureStatePatch => {
  const todayKey = localDateKey(today);
  const curesToDelete = cureOrder.filter((cure) => current.cureRecords[cure]?.date === todayKey);
  const recordsBeforeDelete: CureRecords = {
    firstCure: current.cureRecords.firstCure ? { ...current.cureRecords.firstCure } : null,
    secondCure: current.cureRecords.secondCure ? { ...current.cureRecords.secondCure } : null,
    thirdCure: current.cureRecords.thirdCure ? { ...current.cureRecords.thirdCure } : null,
  };
  const nextRecords: CureRecords = { ...current.cureRecords };
  for (const cure of curesToDelete) nextRecords[cure] = null;
  const latestRemainingCure = [...cureOrder].reverse().find((cure) => Boolean(nextRecords[cure])) ?? null;
  return {
    cure: latestRemainingCure ?? "noCure",
    cureRecords: nextRecords,
    curePendingSince: latestRemainingCure ? pendingSinceFor(latestRemainingCure, nextRecords) : null,
    comment: removeCureLines(current.comment, curesToDelete, recordsBeforeDelete),
    commentActionCure: buildCommentActionCure(nextRecords),
  };
};
