import * as React from "react";
import "./StatusInput.scss";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import { updateField } from "../../../redux/features/newInterventionSlice";
import { useAppDispatch, useAppSelector } from "../../../redux/store";
const StatusInput = () => {
  const dispatch = useAppDispatch();
  const status = useAppSelector((state) => state.newIntervention.status);
  const handleChange = (event) => {
    dispatch(
      updateField({
        field: "status",
        value: event.target.value,
      }),
    );
  };
  const isDefault = status === "";
  return (
    <FormControl
      variant="outlined"
      className="status-input"
      size="small"
      fullWidth
    >
      <InputLabel
        className="status-label"
        id="status-label"
        shrink={!isDefault}
        sx={{
          color: "grey",
          backgroundColor: "white",
          padding: "0 6px",
          borderRadius: "5px",
          marginLeft: "-5px",
          "&.Mui-focused": {
            color: "#545454",
          },
          opacity: isDefault ? 0 : 1,
          transition: (theme) =>
            theme.transitions.create(["transform", "opacity"], {
              duration: theme.transitions.duration.shorter,
            }),
        }}
      >
        {"Status"}
      </InputLabel>
      <Select
        className="status-select"
        labelId="status-label"
        id="status-select"
        value={status}
        label="Status"
        displayEmpty
        notched={!isDefault}
        onChange={handleChange}
        sx={{
          "& .MuiSelect-select": {
            backgroundColor:
              status === ""
                ? "#e5cce5"
                : status === "completed"
                  ? "#bbffbb"
                  : status === "on hold"
                    ? "#ffbbbb"
                    : "#fff898",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            textAlign: "center",
          },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: "#bdbdbd",
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
