import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { Intervention } from "./newInterventionSlice";
import { isSameLogicalIntervention } from "../../utils/interventionIdentity";

type HistoryState = {
  interventions: Intervention[];
  isInitialized: boolean;
  isRefreshing: boolean;
  error: string;
};

const initialState: HistoryState = {
  interventions: [],
  isInitialized: false,
  isRefreshing: false,
  error: "",
};

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    startHistoryRefresh: (state) => {
      state.isRefreshing = true;
      state.error = "";
    },
    setHistory: (state, action: PayloadAction<Intervention[]>) => {
      state.interventions = action.payload;
      state.isInitialized = true;
      state.isRefreshing = false;
      state.error = "";
    },
    setHistoryError: (state, action: PayloadAction<string>) => {
      state.isInitialized = true;
      state.isRefreshing = false;
      state.error = action.payload;
    },
    clearHistory: (state) => {
      state.interventions = [];
      state.isInitialized = true;
      state.isRefreshing = false;
      state.error = "";
    },
    addHistoryIntervention: (state, action: PayloadAction<Intervention>) => {
      const exists = state.interventions.some(
        (item) =>
          item.documentId === action.payload.documentId &&
          item.dateKey === action.payload.dateKey,
      );

      if (!exists) {
        state.interventions.unshift(action.payload);
      }
    },
    updateHistoryIntervention: (
      state,
      action: PayloadAction<Intervention>,
    ) => {
      state.interventions = state.interventions.map((item) => {
        if (!isSameLogicalIntervention(item, action.payload)) {
          return item;
        }

        return {
          ...item,
          ...action.payload,
          // Preserve the day on which this occurrence belongs.
          documentId: item.documentId,
          dateKey: item.dateKey,
          createdAt: item.createdAt ?? action.payload.createdAt,
        };
      });
    },
    deleteHistoryIntervention: (state, action: PayloadAction<string>) => {
      state.interventions = state.interventions.filter(
        (item) => item.documentId !== action.payload,
      );
    },
  },
});

export const {
  addHistoryIntervention,
  clearHistory,
  deleteHistoryIntervention,
  setHistory,
  setHistoryError,
  startHistoryRefresh,
  updateHistoryIntervention,
} = historySlice.actions;

export default historySlice.reducer;
