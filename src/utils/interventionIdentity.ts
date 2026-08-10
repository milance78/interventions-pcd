import type { Intervention } from "../redux/features/newInterventionSlice";

export const interventionLogicalKey = (
  intervention: Pick<
    Intervention,
    "documentId" | "interventionId" | "oagID"
  >,
) => {
  const interventionId =
    intervention.interventionId?.trim().toLowerCase();

  if (interventionId) {
    return `intervention:${interventionId}`;
  }

  const oagID = intervention.oagID?.trim().toLowerCase();

  if (oagID) {
    return `oag:${oagID}`;
  }

  return `document:${intervention.documentId}`;
};

export const isSameLogicalIntervention = (
  first: Pick<Intervention, "documentId" | "interventionId" | "oagID">,
  second: Pick<Intervention, "documentId" | "interventionId" | "oagID">,
) => {
  // documentId/caseId is immutable and therefore remains a reliable identity
  // even when Edit changes Intervention ID or OAG ID.
  if (first.documentId && second.documentId && first.documentId === second.documentId) {
    return true;
  }
  return interventionLogicalKey(first) === interventionLogicalKey(second);
};

export const interventionActivityValue = (
  intervention: Pick<
    Intervention,
    "updatedAt" | "createdAt" | "dateKey"
  >,
) =>
  intervention.updatedAt ??
  intervention.createdAt ??
  intervention.dateKey ??
  "";
