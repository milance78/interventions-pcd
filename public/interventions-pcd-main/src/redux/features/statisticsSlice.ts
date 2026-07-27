import { createSlice } from "@reduxjs/toolkit";
const getCurrentDate = () => {
  const now = new Date();
  return now.toLocaleDateString("fr-BE");
};
const getCurrentTime = () => {
  const now = new Date();
  return now.toLocaleTimeString("fr-BE");
};
const initialState = {
  date: getCurrentDate(),
  time: getCurrentTime(),
  total: 0,
  completed: 0,
  onHold: 0,
  transferred: 0,
  closedByAnotherAgent: 0,
};
const statisticsSlice = createSlice({
  name: "statistics",
  initialState,
  reducers: {
    updateDateAndTime: (state) => {
      state.date = getCurrentDate();
      state.time = getCurrentTime();
    },
    setStatistics: (state, action) => {
      state.total = action.payload.total;
      state.completed = action.payload.completed;
      state.onHold = action.payload.onHold;
      state.transferred = action.payload.transferred;
      state.closedByAnotherAgent = action.payload.closedByAnotherAgent;
      state.date = action.payload.date;
      state.time = action.payload.time;
    },
    resetStatistics: () => initialState,
  },
});
const { updateDateAndTime, setStatistics, resetStatistics } =
  statisticsSlice.actions;
export default statisticsSlice.reducer;
export { resetStatistics, setStatistics, updateDateAndTime };
