import { createAsyncThunk } from "@reduxjs/toolkit";
import { auth } from "../../firebase/firebaseConfig";
import { updateSearchInterventionAndMoveToToday } from "../../firebase/interventionsService";
import { addIntervention } from "../features/interventionsListSlice";
import {
  addHistoryIntervention,
  updateHistoryIntervention,
} from "../features/historySlice";
import type { Intervention } from "../features/newInterventionSlice";
import { normalizeInterventionStrings } from "../../utils/textUtils";

export const updateSearchInterventionThunk = createAsyncThunk<
  Intervention,
  Intervention,
  { rejectValue: string }
>("interventions/updateSearchAndMoveToToday", async (intervention, { dispatch, rejectWithValue }) => {
  try {
    const normalizedIntervention =
      normalizeInterventionStrings(intervention);
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user) return rejectWithValue("User not authenticated");
    if (!normalizedIntervention.dateKey) return rejectWithValue("Missing original intervention date");

    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const updated = await updateSearchInterventionAndMoveToToday(
      user.uid,
      normalizedIntervention.dateKey,
      today,
      normalizedIntervention,
    );
    dispatch(updateHistoryIntervention(updated));
    dispatch(addHistoryIntervention(updated));
    dispatch(addIntervention(updated));
    return updated;
  } catch (error) {
    return rejectWithValue(error instanceof Error ? error.message : "Unable to update intervention");
  }
});
