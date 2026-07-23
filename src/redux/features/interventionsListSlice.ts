import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createInterventionThunk } from "../thunks/createInterventionThunk";
import type { Intervention } from "./newInterventionSlice";

const initialState: Intervention[] = [];

const interventionsListSlice = createSlice({
  name: "interventionsList",
  initialState,
  reducers: {
    setInterventions: (_state, action: PayloadAction<Intervention[]>) => {
      return action.payload;
    },
    addIntervention: (state, action: PayloadAction<Intervention>) => {
      const existingIndex = state.findIndex(
        (item) => item.documentId === action.payload.documentId,
      );
      if (existingIndex !== -1) state.splice(existingIndex, 1);
      state.unshift(action.payload);
    },
    updateLocalIntervention: (
      state,
      action: PayloadAction<Intervention>,
    ) => {
      const index = state.findIndex(
        (item) => item.documentId === action.payload.documentId,
      );

      if (index !== -1) {
        state[index] = action.payload;
      }
    },
    deleteLocalIntervention: (state, action: PayloadAction<string>) => {
      return state.filter((item) => item.documentId !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder.addCase(createInterventionThunk.fulfilled, (state, action) => {
      const exists = state.some(
        (item) => item.documentId === action.payload.documentId,
      );

      if (!exists) {
        state.unshift(action.payload);
      }
    });
  },
});

const {
  setInterventions,
  addIntervention,
  updateLocalIntervention,
  deleteLocalIntervention,
} = interventionsListSlice.actions;

export default interventionsListSlice.reducer;
export {
  addIntervention,
  deleteLocalIntervention,
  interventionsListSlice,
  setInterventions,
  updateLocalIntervention,
};
