import * as React from "react";

import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import "./SimpleInput.scss";

import type { InterventionField } from "../../../redux/features/newInterventionSlice";
import { updateField } from "../../../redux/features/newInterventionSlice";
import {
  useAppDispatch,
  useAppSelector,
} from "../../../redux/store";

interface SimpleInputProps {
  field: InterventionField;
  icon?: React.ElementType;
  label: string;
  inputType: "type1" | "type2";
  className?: string;
}

const SimpleInput = ({
  field,
  icon,
  label,
  inputType,
  className = "",
}: SimpleInputProps) => {
  const dispatch = useAppDispatch();

  const value = useAppSelector(
    (state) => state.newIntervention[field],
  );

  const [copied, setCopied] = React.useState(false);

  const Icon = icon;
  const stringValue =
    typeof value === "string" ? value : "";

  const copyValue = async () => {
    if (!stringValue.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        stringValue,
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1200);
    } catch {
      const temporaryTextArea =
        document.createElement("textarea");

      temporaryTextArea.value = stringValue;
      temporaryTextArea.style.position = "fixed";
      temporaryTextArea.style.opacity = "0";

      document.body.appendChild(
        temporaryTextArea,
      );

      temporaryTextArea.focus();
      temporaryTextArea.select();

      document.execCommand("copy");

      document.body.removeChild(
        temporaryTextArea,
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 1200);
    }
  };

  return (
    <div
      className={`simple-input ${
        inputType === "type1"
          ? "type1"
          : "type2"
      } ${className}`.trim()}
    >
      <div className="icon-container">
        {Icon ? <Icon /> : null}
      </div>

      <div className="simple-input__control">
        <FormControl>
          <TextField
            size={
              inputType === "type1"
                ? "medium"
                : "small"
            }
            fullWidth
            label={label}
            variant="outlined"
            value={stringValue}
            onChange={(event) =>
              dispatch(
                updateField({
                  field,
                  value: event.target.value,
                }),
              )
            }
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "4px",
              },
              "& .MuiOutlinedInput-input": {
                textAlign: "center",
                paddingRight: "44px",
              },
              "& .MuiOutlinedInput-notchedOutline":
                {
                  borderColor: "#bdbdbd",
                  transition:
                    "border-color 120ms ease-in-out",
                },
              "& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline":
                {
                  borderColor: "#9e9e9e",
                },
              "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
                {
                  borderColor: "gray",
                },
              "& .MuiInputLabel-root.Mui-focused":
                {
                  color: "gray",
                },
            }}
          />
        </FormControl>

        <Tooltip
          title={
            copied
              ? "Copié"
              : stringValue.trim()
                ? "Copier"
                : "Champ vide"
          }
          placement="top"
          arrow
        >
          <span className="simple-input__copy-wrapper">
            <IconButton
              type="button"
              className={`simple-input__copy-button ${
                copied
                  ? "simple-input__copy-button--copied"
                  : ""
              }`}
              aria-label={`Copier ${label}`}
              onClick={copyValue}
              disabled={!stringValue.trim()}
              size="small"
            >
              {copied ? (
                <CheckRounded fontSize="small" />
              ) : (
                <ContentCopyRounded fontSize="small" />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </div>
    </div>
  );
};

export default SimpleInput;