import * as React from "react";

import CheckRounded from "@mui/icons-material/CheckRounded";
import TextField from "@mui/material/TextField";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import { House } from "lucide-react";

import { ReactComponent as CopyIcon } from "../../../assets/svg/Copy.svg.tsx";
import {
  applyPastedMainAddress,
  updateMainAddressManually,
} from "../../../redux/features/newInterventionSlice";
import { useAppDispatch, useAppSelector } from "../../../redux/store";
import { parsePastedNpsAddress } from "../../../utils/interventionAddress";

import "./MainAddressInput.scss";

const MainAddressInput = () => {
  const dispatch = useAppDispatch();
  const {
    mainAddress,
    streetName,
    streetNumber,
    streetAlpha,
    postalCode,
    city,
  } = useAppSelector((state) => state.newIntervention);

  const [focused, setFocused] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  const copyValue = async () => {
    if (!mainAddress.trim()) return;

    try {
      await navigator.clipboard.writeText(mainAddress);
    } catch {
      const area = document.createElement("textarea");
      area.value = mainAddress;
      area.style.position = "fixed";
      area.style.opacity = "0";
      document.body.appendChild(area);
      area.select();
      document.execCommand("copy");
      document.body.removeChild(area);
    }

    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = event.clipboardData.getData("text");
    const parsed = parsePastedNpsAddress(pasted);

    if (!parsed) return;

    event.preventDefault();
    dispatch(applyPastedMainAddress(parsed));
  };

  const house = `${streetNumber}${streetAlpha}`.trim();
  const hasStructuredDisplay = Boolean(
    streetName.trim() || house || postalCode.trim() || city.trim(),
  );

  return (
    <div className="simple-input simple-input--with-icon main-address-input">
      <div className="icon-container" aria-hidden="true">
        <House />
      </div>

      <div className="simple-input__control main-address-input__control">
        <TextField
          fullWidth
          size="small"
          label="Adresse principale"
          variant="outlined"
          value={mainAddress}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onPaste={handlePaste}
          onChange={(event) =>
            dispatch(updateMainAddressManually(event.target.value))
          }
          inputProps={{
            "aria-label": "Adresse principale",
          }}
          sx={{
            "& .MuiOutlinedInput-root": { borderRadius: "4px" },
            "& .MuiOutlinedInput-input": {
              textAlign: "left",
              paddingRight: "44px",
              color:
                !focused && hasStructuredDisplay
                  ? "transparent"
                  : undefined,
              caretColor: focused ? undefined : "transparent",
            },
            "& .MuiOutlinedInput-notchedOutline": {
              borderColor: "#bdbdbd",
              transition: "border-color 120ms ease-in-out",
            },
            "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
              borderColor: "#9e9e9e",
            },
            "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
              borderColor: "gray",
            },
            "& .MuiInputLabel-root.Mui-focused": { color: "gray" },
          }}
        />

        {!focused && hasStructuredDisplay ? (
          <div className="main-address-input__formatted" aria-hidden="true">
            <span>{streetName.trim()}</span>
            {streetName.trim() && house ? " " : null}
            {house ? <strong>{house}</strong> : null}
            {(streetName.trim() || house) && (postalCode.trim() || city.trim())
              ? ", "
              : null}
            <span>{[postalCode.trim(), city.trim()].filter(Boolean).join(" ")}</span>
          </div>
        ) : null}

        <Tooltip
          title={copied ? "Copié" : mainAddress.trim() ? "Copier" : "Champ vide"}
          placement="top"
          arrow
        >
          <span className="simple-input__copy-wrapper">
            <IconButton
              type="button"
              className={`simple-input__copy-button ${
                copied ? "simple-input__copy-button--copied" : ""
              }`}
              aria-label="Copier Adresse principale"
              onClick={copyValue}
              disabled={!mainAddress.trim()}
              size="small"
            >
              {copied ? <CheckRounded fontSize="small" /> : <CopyIcon />}
            </IconButton>
          </span>
        </Tooltip>
      </div>
    </div>
  );
};

export default MainAddressInput;
