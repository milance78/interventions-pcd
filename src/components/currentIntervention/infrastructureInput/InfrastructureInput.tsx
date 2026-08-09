import * as React from "react";
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
    <FormControl variant="outlined" size="small" sx={{ width: "100%" }}>
      {!isEmpty && (
        <InputLabel
          id="infrastructure-label"
          shrink
          sx={{
            color: "#9aa7bb",
            fontWeight: 400,
            "&.Mui-focused": {
              color: "#7f8da3",
              fontWeight: 400,
            },
          }}
        >
          Technologie
        </InputLabel>
      )}

      <Select
        labelId={!isEmpty ? "infrastructure-label" : undefined}
        id="infrastructure-select"
        value={infrastructure}
        label={!isEmpty ? "Technologie" : undefined}
        displayEmpty
        notched={!isEmpty}
        onChange={handleChange}
        renderValue={(selected) =>
          selected === "" ? (
            <span className="core-select-placeholder">Technologie</span>
          ) : selected === "fiber" ? (
            "Fibre"
          ) : (
            "Cuivre"
          )
        }
        sx={{
          "& .MuiSelect-select": {
            display: "flex",
            alignItems: "center",
            minHeight: "0 !important",
            height: "40px",
            padding: isEmpty ? "0 38px 0 13px !important" : "0 38px !important",
            boxSizing: "border-box",
            justifyContent: isEmpty ? "flex-start" : "center",
            lineHeight: "20px",
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
        <MenuItem value="copper">Cuivre</MenuItem>
        <MenuItem value="fiber">Fibre</MenuItem>
      </Select>
    </FormControl>
  );
};

export default InfrastructureInput;
