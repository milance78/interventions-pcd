import { createAsyncThunk } from "@reduxjs/toolkit";
import { clearTodaysCures } from "../features/newInterventionSlice";
import type { RootState } from "../store";
import { updateInterventionThunk } from "./updateInterventionThunk";

/**
 * Removes every CURE recorded today from Redux/comment and, when the current
 * intervention already exists in Firestore, persists that deletion immediately.
 */
export const clearTodaysCuresThunk = createAsyncThunk<
  void,
  void,
  { state: RootState; rejectValue: string }
>(
  "interventions/clearTodaysCures",
  async (_, { dispatch, getState, rejectWithValue }) => {
    dispatch(clearTodaysCures());

    const updatedIntervention = getState().newIntervention;
    if (!updatedIntervention.documentId) return;

    const result = await dispatch(updateInterventionThunk(updatedIntervention));
    if (updateInterventionThunk.rejected.match(result)) {
      const message =
        typeof result.payload === "string"
          ? result.payload
          : result.error.message || "Unable to delete today's CURE records";
      console.error("No CURE persistence failed:", message);
      return rejectWithValue(message);
    }
  },
);
