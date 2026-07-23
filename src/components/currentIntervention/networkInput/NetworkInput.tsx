import * as React from "react";
import "./NetworkInput.scss";
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
    <FormControl
      variant="outlined"
      size="small"
      sx={{
        width: "50%",
      }}
    >
      <InputLabel
        id="network-label"
        shrink={!isDefault}
        sx={{
          color: "grey",
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
        {"R\xE9seau"}
      </InputLabel>
      <Select
        labelId="network-label"
        id="network-select"
        value={network}
        label="Réseau"
        displayEmpty
        notched={!isDefault}
        onChange={handleChange}
        sx={{
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
                {"R\xE9seau"}
              </span>
            );
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
      >
        <MenuItem value="proximus">{"Proximus"}</MenuItem>
        <MenuItem value="scarlet">{"Scarlet"}</MenuItem>
        <MenuItem value="mobileVikings">{"M. Vikings OLO"}</MenuItem>
        <MenuItem value="otherOlo">{"Autre OLO"}</MenuItem>
      </Select>
    </FormControl>
  );
};
export default NetworkInput;
