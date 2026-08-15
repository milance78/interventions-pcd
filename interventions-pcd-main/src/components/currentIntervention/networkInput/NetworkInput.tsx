import * as React from "react";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import InputLabel from "@mui/material/InputLabel";
import { useAppDispatch, useAppSelector } from "../../../redux/store";
import { updateField } from "../../../redux/features/newInterventionSlice";

const NetworkInput = () => {
  const dispatch = useAppDispatch();
  const network = useAppSelector((state) => state.newIntervention.network);

  const handleChange = (event) => {
    dispatch(
      updateField({
        field: "network",
        value: event.target.value,
      }),
    );
  };

  const isDefault = network === "";

  return (
    <FormControl variant="outlined" size="small" sx={{ width: "100%" }}>
      {!isDefault && (
        <InputLabel
          id="network-label"
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
          Réseau
        </InputLabel>
      )}

      <Select
        labelId={!isDefault ? "network-label" : undefined}
        id="network-select"
        value={network}
        label={!isDefault ? "Réseau" : undefined}
        displayEmpty
        notched={!isDefault}
        onChange={handleChange}
        renderValue={(selected) => {
          if (selected === "") {
            return <span className="core-select-placeholder">Réseau</span>;
          }

          switch (selected) {
            case "proximus":
              return "Proximus";
            case "scarlet":
              return "Scarlet";
            case "mobileVikings":
              return "Mobile Vikings";
            case "otherOlo":
              return "Autre OLO";
            default:
              return "";
          }
        }}
        sx={{
          "& .MuiSelect-select": {
            display: "flex",
            alignItems: "center",
            minHeight: "0 !important",
            height: "40px",
            padding: isDefault ? "0 38px 0 13px !important" : "0 38px !important",
            boxSizing: "border-box",
            justifyContent: isDefault ? "flex-start" : "center",
            lineHeight: "20px",
            fontWeight: 400,
            color: isDefault ? "#9aa7bb" : "#111827",
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
        <MenuItem value="proximus">Proximus</MenuItem>
        <MenuItem value="scarlet">Scarlet</MenuItem>
        <MenuItem value="mobileVikings">M. Vikings OLO</MenuItem>
        <MenuItem value="otherOlo">Autre OLO</MenuItem>
      </Select>
    </FormControl>
  );
};

export default NetworkInput;
