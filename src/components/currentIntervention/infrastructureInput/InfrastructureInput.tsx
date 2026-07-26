import * as React from "react";
import "./InfrastructureInput.scss";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import { updateField } from "../../../redux/features/newInterventionSlice";
import { useAppDispatch, useAppSelector } from "../../../redux/store";
const InfrastructureInput = () => {
  const dispatch = useAppDispatch();
  const infrastructure = useAppSelector(
    (state) => state.newIntervention.infrastructure,
  );
  const handleChange = (event) => {
    dispatch(
      updateField({
        field: "infrastructure",
        value: event.target.value,
      }),
    );
  };
  const isEmpty = infrastructure === "";
  return (
    <FormControl
      variant="outlined"
      size="small"
      sx={{
        width: "50%",
      }}
    >
      <InputLabel
        id="infrastructure-label"
        shrink={!isEmpty}
        sx={{
          color: "#9aa7bb",
          fontWeight: 400,
          opacity: isEmpty ? 0 : 1,
          transition: (theme) =>
            theme.transitions.create(["transform", "opacity"], {
              duration: theme.transitions.duration.shorter,
            }),
          "&.Mui-focused": {
            color: "#7f8da3",
            fontWeight: 400,
          },
        }}
      >
        {"Infrastructure"}
      </InputLabel>
      <Select
        labelId="infrastructure-label"
        id="infrastructure-select"
        value={infrastructure}
        label="Infrastructure"
        displayEmpty
        notched={!isEmpty}
        onChange={handleChange}
        renderValue={(selected) => {
          if (selected === "") {
            return (
              <span
                style={{
                  color: "#9aa7bb",
                  fontWeight: 400,
                }}
              >
                {"Infrastructure"}
              </span>
            );
          }
          return selected === "fiber" ? "Fibre" : "Cuivre";
        }}
        sx={{
          "& .MuiSelect-select": {
            display: "flex",
            alignItems: "center",
            fontWeight: 400,
            color: isEmpty ? "#9aa7bb" : "#111827",
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
      >
        <MenuItem value="copper">{"Cuivre"}</MenuItem>
        <MenuItem value="fiber">{"Fibre"}</MenuItem>
      </Select>
    </FormControl>
  );
};
export default InfrastructureInput;
