import { createAsyncThunk } from "@reduxjs/toolkit";
import { auth } from "../../firebase/firebaseConfig";
import {
  updateIntervention,
  updateSearchInterventionAndMoveToToday,
} from "../../firebase/interventionsService";
import { updateLocalIntervention } from "../features/interventionsListSlice";
import {
  addHistoryIntervention,
  updateHistoryIntervention,
} from "../features/historySlice";
import type { Intervention } from "../features/newInterventionSlice";
import { normalizeInterventionStrings } from "../../utils/textUtils";
import { addIntervention } from "../features/interventionsListSlice";

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

      const movedToToday = interventionDate !== today;

      const savedIntervention = movedToToday
        ? await updateSearchInterventionAndMoveToToday(
            user.uid,
            interventionDate,
            today,
            normalizedIntervention,
          )
        : (
            await updateIntervention(
              user.uid,
              interventionDate,
              normalizedIntervention.documentId,
              normalizedIntervention,
            ),
            {
              ...normalizedIntervention,
              dateKey: interventionDate,
            }
          );

      const updatedIntervention: Intervention = {
        ...savedIntervention,
        isEditing: false,
        isHistoryView: false,
        mode: "TODAY_EDIT",
        dateKey: savedIntervention.dateKey || interventionDate,
        updatedAt: new Date().toISOString(),
      };

      if (movedToToday) {
        // The old day's historical occurrence remains untouched. Add the
        // newly saved today's occurrence separately.
        dispatch(addHistoryIntervention(updatedIntervention));
        dispatch(addIntervention(updatedIntervention));
      } else {
        dispatch(updateLocalIntervention(updatedIntervention));
        dispatch(updateHistoryIntervention(updatedIntervention));
      }

      return updatedIntervention;
    } catch (error) {
      return rejectWithValue(
        error instanceof Error ? error.message : "Unable to update intervention",
      );
    }
  },
);

export { updateInterventionThunk };
