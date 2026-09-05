import { createAsyncThunk } from "@reduxjs/toolkit";
import { auth } from "../../firebase/firebaseConfig";
import { markInterventionReviewed } from "../../firebase/interventionsService";
import { updateHistoryIntervention } from "../features/historySlice";
import type { Intervention } from "../features/newInterventionSlice";

export const markInterventionReviewedThunk = createAsyncThunk<Intervention, Intervention, { rejectValue: string }>(
  "interventions/markReviewed",
  async (intervention, { dispatch, rejectWithValue }) => {
    try {
      await auth.authStateReady();
      const user = auth.currentUser;
      if (!user) return rejectWithValue("User not authenticated");
      const date = intervention.dateKey || new Date().toISOString().slice(0, 10);
      const saved = await markInterventionReviewed(user.uid, date, intervention.documentId, intervention);
      dispatch(updateHistoryIntervention(saved));
      return saved;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Unable to mark intervention reviewed");
    }
  },
);
