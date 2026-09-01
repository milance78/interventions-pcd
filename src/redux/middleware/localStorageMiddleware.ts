import type { Middleware } from "@reduxjs/toolkit";

import {
  clearDraftFromStorage,
  loadCurrentSessionFromStorage,
  loadDraftFromStorage,
  saveCurrentSessionToStorage,
  saveDraftToStorage,
} from "../../localStorage/localStorage";
import {
  hasMeaningfulDraft,
  type Intervention,
  type InterventionData,
} from "../features/newInterventionSlice";

const currentData = (state: Intervention): InterventionData => ({
  documentId: "",
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
  lastRevuAt: state.lastRevuAt,
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
  cure: state.cure,
  cureRecords: state.cureRecords,
  curePendingSince: state.curePendingSince,
  smsEnabled: state.smsEnabled,
  status: state.status,
  postponedDate: state.postponedDate,
  createdAt: null,
  updatedAt: null,
  dateKey: undefined,
});

export const localStorageMiddleware: Middleware =
  (store) => (next) => (action) => {
    const result = next(action);
    const state = store.getState();
    const intervention = state?.newIntervention as Intervention | undefined;

    if (!intervention) return result;

    const typedAction = action as {
      type?: string;
      payload?: { field?: string; value?: unknown };
    };

    if (
      typedAction.type === "newIntervention/updateField" &&
      typedAction.payload?.field === "smsEnabled"
    ) {
      try {
        window.localStorage.setItem(
          "interventions-pcd:sms-enabled",
          String(Boolean(typedAction.payload.value)),
        );
      } catch {
        // Local storage may be unavailable; intervention persistence still works.
      }
    }

    // Always persist the complete Current Intervention session. This is
    // independent from whether it qualifies as a visible brouillon. Closing
    // or reloading the browser must restore the exact form that was on screen.
    saveCurrentSessionToStorage(intervention);

    const draft = intervention.draftSnapshot;
    if (intervention.hasDraft && draft && hasMeaningfulDraft(draft)) {
      saveDraftToStorage(draft);
    } else {
      clearDraftFromStorage();
    }

    return result;
  };

export { loadCurrentSessionFromStorage, loadDraftFromStorage };
