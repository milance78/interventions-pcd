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
          color: "#777",
          "&.Mui-focused": {
            color: "#545454",
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
                  color: "#777",
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
