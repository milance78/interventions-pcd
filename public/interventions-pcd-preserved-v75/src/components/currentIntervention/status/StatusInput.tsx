import * as React from "react";
import "./StatusInput.scss";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import { updateField } from "../../../redux/features/newInterventionSlice";
import { useAppDispatch, useAppSelector } from "../../../redux/store";
const StatusInput = () => {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.newIntervention.status);
  const handleChange = (event) => {
    const nextStatus = event.target.value;

    dispatch(updateField({ field: "status", value: nextStatus }));

    if (nextStatus === "completed") {
      dispatch(updateField({ field: "cure", value: "noCure" }));
      dispatch(updateField({ field: "isSnowReceivedPending", value: false }));
      dispatch(updateField({ field: "isSnowSentPending", value: false }));
      dispatch(updateField({ field: "isSnow", value: false }));
      dispatch(updateField({ field: "isResPending", value: false }));
      dispatch(updateField({ field: "smsEnabled", value: false }));
    }
  };
  const isDefault = status === "";
  return (
    <FormControl
      variant="outlined"
      className="status-input"
      size="small"
      fullWidth
    >
      <Select
        className="status-select"
        id="status-select"
        value={status}
        displayEmpty
        notched={false}
        onChange={handleChange}
        sx={{
          "& .MuiSelect-select": {
            backgroundColor:
              status === ""
                ? "#f1f5f9"
                : status === "completed"
                  ? "#dcfce7"
                  : status === "on hold"
                    ? "#fef3c7"
                    : status === "transferred"
                      ? "#dbeafe"
                      : "#f1f5f9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          },
          color:
            status === "completed"
              ? "#166534"
              : status === "on hold"
                ? "#92400e"
                : status === "transferred"
                  ? "#1d4ed8"
                  : "#475569",
          fontWeight: 700,
          borderRadius: "12px",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor:
              status === "completed"
                ? "#86d49c"
                : status === "on hold"
                  ? "#efc55d"
                  : status === "transferred"
                    ? "#93baf4"
                    : "#cbd5e1",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#9e9e9e",
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#777777",
            borderWidth: "2px",
          },
        }}
        renderValue={(selected) => {
          if (selected === "") {
            return (
              <span
                style={{
                  color: "#777",
                }}
              >
                {"Status"}
              </span>
            );
          }
          switch (selected) {
            case "completed":
              return "Terminé";
            case "on hold":
              return "En attente";
            case "transferred":
              return "Transmis";
            default:
              return "";
          }
        }}
      >
        <MenuItem value="completed">{"Termin\xE9"}</MenuItem>
        <MenuItem value="on hold">{"En attente"}</MenuItem>
        <MenuItem value="transferred">{"Transmis"}</MenuItem>
      </Select>
    </FormControl>
  );
};
export default StatusInput;
