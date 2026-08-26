import * as React from "react";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";

import { updateField } from "../../../redux/features/newInterventionSlice";
import { useAppDispatch, useAppSelector } from "../../../redux/store";

import "./SnowStatusInput.scss";

// Mirrors the base StatusInput colors exactly: "on hold" (yellow) and
// "completed" (green), so the two selects read as one coherent status pair.
const SnowStatusInput = () => {
  const dispatch = useAppDispatch();
  const snowStatus = useAppSelector((state) => state.newIntervention.snowStatus);

  const handleChange = (event: any) => {
    dispatch(updateField({ field: "snowStatus", value: event.target.value }));
  };

  return (
    <FormControl variant="outlined" className="snow-status-input" size="small" fullWidth>
      <Select
        className="snow-status-select"
        id="snow-status-select"
        value={snowStatus}
        displayEmpty
        notched={false}
        onChange={handleChange}
        sx={{
          "& .MuiSelect-select": {
            backgroundColor: snowStatus === "resolved" ? "#dcfce7" : "#fef3c7",
            display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center",
          },
          color: snowStatus === "resolved" ? "#166534" : "#92400e",
          fontWeight: 700,
          borderRadius: "12px",
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: snowStatus === "resolved" ? "#86d49c" : "#efc55d",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "#9e9e9e" },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#777777", borderWidth: "2px" },
        }}
        renderValue={(selected) => (selected === "resolved" ? "Snow résolu" : "Snow en attente")}
      >
        <MenuItem value="pending">Snow en attente</MenuItem>
        <MenuItem value="resolved">Snow résolu</MenuItem>
      </Select>
    </FormControl>
  );
};

export default SnowStatusInput;
