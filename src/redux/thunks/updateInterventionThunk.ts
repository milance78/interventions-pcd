import { createAsyncThunk } from "@reduxjs/toolkit";
import { auth } from "../../firebase/firebaseConfig";
import { updateIntervention } from "../../firebase/interventionsService";
import { updateLocalIntervention } from "../features/interventionsListSlice";
import {
  updateHistoryIntervention,
} from "../features/historySlice";
import type { Intervention } from "../features/newInterventionSlice";
import { normalizeInterventionStrings } from "../../utils/textUtils";


const updateInterventionThunk = createAsyncThunk<
  Intervention,
  Intervention,
  { rejectValue: string }
>(
  "interventions/update",
  async (intervention, { dispatch, rejectWithValue }) => {
    try {
      const normalizedIntervention =
        normalizeInterventionStrings(intervention);
      await auth.authStateReady();
      const user = auth.currentUser;
      if (!user) return rejectWithValue("User not authenticated");

      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const interventionDate = intervention.dateKey || today;

      if (!intervention.documentId) {
        return rejectWithValue("Missing Firestore document ID");
      }

      await updateIntervention(
        user.uid,
        interventionDate,
        normalizedIntervention.documentId,
        normalizedIntervention,
      );
      const savedIntervention: Intervention = {
        ...normalizedIntervention,
        dateKey: interventionDate,
        updatedAt: new Date().toISOString(),
      };
      const updatedIntervention: Intervention = {
        ...savedIntervention,
        isEditing: false,
        isHistoryView: false,
        mode: "TODAY_EDIT",
        dateKey: savedIntervention.dateKey || interventionDate,
        updatedAt: new Date().toISOString(),
      };

      // Enregistrer edits the occurrence from which the intervention was opened.
      // Moving an historical/search result to today is an explicit action handled
      // only by Ajouter à la liste du jour.
      dispatch(updateLocalIntervention(updatedIntervention));
      dispatch(updateHistoryIntervention(updatedIntervention));

      return updatedIntervention;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unable to update intervention",
      );
    }
  },
);

export { updateInterventionThunk };
