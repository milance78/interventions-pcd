import type { Intervention, InterventionData } from "./types";
import { emptyInterventionData } from "./defaults";

export const hasMeaningfulDraft = (
  intervention: Partial<InterventionData> | null | undefined,
) => {
  if (!intervention) return false;

  // A brouillon exists as soon as the user has changed any intervention value
  // from the pristine form. UI-only expansion and the globally persistent SMS
  // preference are deliberately excluded. If every value is put back to its
  // pristine value, the brouillon disappears again.
  const ignored = new Set<keyof InterventionData>([
    "documentId",
    "createdAt",
    "updatedAt",
    "dateKey",
    "displayAllFields",
    "smsEnabled",
  ]);

  return (Object.keys(emptyInterventionData) as Array<keyof InterventionData>).some(
    (key) => {
      if (ignored.has(key)) return false;

      const current = intervention[key] ?? emptyInterventionData[key];
      const initial = emptyInterventionData[key];

      if (Array.isArray(current) || typeof current === "object") {
        return JSON.stringify(current) !== JSON.stringify(initial);
      }

      return current !== initial;
    },
  );
};

export const extractData = (state: Intervention): InterventionData => ({
  documentId: state.documentId,
  interventionId: state.interventionId,
  network: state.network,
  infrastructure: state.infrastructure,
  oagID: state.oagID,
  na: state.na,
  cid: state.cid,
  clientName: state.clientName,
  interventionDescription: state.interventionDescription,
  clientID: state.clientID,
  mainAddress: state.mainAddress,
  streetName: state.streetName,
  streetNumber: state.streetNumber,
  streetAlpha: state.streetAlpha,
  postalCode: state.postalCode,
  city: state.city,
  addressDetails: state.addressDetails,
  mailbox: state.mailbox,
  floor: state.floor,
  apartment: state.apartment,
  blockNumber: state.blockNumber,
  clientsOnAddress: state.clientsOnAddress,
  addressClients: state.addressClients,
  LOMKey: state.LOMKey,
  phone: state.phone,
  wctLink: state.wctLink,
  displayAllFields: state.displayAllFields,
  snowReceived: state.snowReceived,
  snowSent: state.snowSent,
  snowMentioned: state.snowMentioned,
  snowMentionedCreatedAt: state.snowMentionedCreatedAt,
  snowReceivedCreatedAt: state.snowReceivedCreatedAt,
  snowSentCreatedAt: state.snowSentCreatedAt,
  isSnowReceivedPending: state.isSnowReceivedPending,
  isSnowSentPending: state.isSnowSentPending,
  snowStatus: state.snowStatus,
  isResPending: state.isResPending,
  resConsultedDate: state.resConsultedDate,
  snowReceivedConsultedDate: state.snowReceivedConsultedDate,
  snowSentConsultedDate: state.snowSentConsultedDate,
  resReviewedDate: state.resReviewedDate,
  snowReceivedReviewedDate: state.snowReceivedReviewedDate,
  snowSentReviewedDate: state.snowSentReviewedDate,
  otherReviewedDate: state.otherReviewedDate,
  cureReviewedDate: state.cureReviewedDate,
  questionReviewedDate: state.questionReviewedDate,
  isUnclear: state.isUnclear,
  addressConfirmation: state.addressConfirmation,
  isGoodExample: state.isGoodExample,
  isSnow: state.isSnow,
  comment: state.comment,
  commentSegmentAddressConfirmation: state.commentSegmentAddressConfirmation,
  commentSegmentTechDetailOnAddress: state.commentSegmentTechDetailOnAddress,
  commentSegmentClientsOnAddress: state.commentSegmentClientsOnAddress,
  commentSegmentGeneralInfo: state.commentSegmentGeneralInfo,
  commentActionCure: state.commentActionCure,
  commentActionResiliation: state.commentActionResiliation,
  commentActionSnowReceived: state.commentActionSnowReceived,
  commentActionSnowSent: state.commentActionSnowSent,
  commentActionBci: state.commentActionBci,
  commentActionTache173: state.commentActionTache173,
  commentActionTache79: state.commentActionTache79,
  commentActionTache96: state.commentActionTache96,
  bciNumber: state.bciNumber,
  wioNumber: state.wioNumber,
  tache173Content: state.tache173Content,
  tache79Content: state.tache79Content,
  tache79JobId: state.tache79JobId,
  tache96Content: state.tache96Content,
  tache96SnowId: state.tache96SnowId,
  additionalInformation: state.additionalInformation,
  cure: state.cure,
  cureRecords: state.cureRecords,
  curePendingSince: state.curePendingSince,
  smsEnabled: state.smsEnabled,
  status: state.status,
  postponedDate: state.postponedDate,
  createdAt: state.createdAt,
  updatedAt: state.updatedAt,
  lastRevuAt: state.lastRevuAt,
  dateKey: state.dateKey,
});

export const isSameInterventionData = (
  firstValue: Partial<InterventionData> | null | undefined,
  secondValue: Partial<InterventionData> | null | undefined,
) => {
  if (!firstValue || !secondValue) return false;
  const ignored = new Set<keyof InterventionData>(["updatedAt"]);
  return (Object.keys(emptyInterventionData) as Array<keyof InterventionData>).every((key) => {
    if (ignored.has(key)) return true;
    const firstItem = firstValue[key] ?? emptyInterventionData[key];
    const secondItem = secondValue[key] ?? emptyInterventionData[key];
    if (typeof firstItem === "object" || typeof secondItem === "object") {
      return JSON.stringify(firstItem) === JSON.stringify(secondItem);
    }
    return firstItem === secondItem;
  });
};
