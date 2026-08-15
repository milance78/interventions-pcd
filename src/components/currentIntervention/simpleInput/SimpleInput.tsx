import * as React from "react";

import { ReactComponent as CopyIcon } from "../../../assets/svg/Copy.svg.tsx";
import CheckRounded from "@mui/icons-material/CheckRounded";
import OpenInNewRounded from "@mui/icons-material/OpenInNewRounded";
import FormControl from "@mui/material/FormControl";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import "./SimpleInput.scss";

import type { InterventionField } from "../../../redux/features/newInterventionSlice";
import { updateField } from "../../../redux/features/newInterventionSlice";
import { trimLeadingHorizontalWhitespace } from "../../../utils/textUtils";
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
  readOnly?: boolean;
}

const SimpleInput = ({
  field,
  icon,
  label,
  inputType,
  className = "",
  readOnly = false,
}: SimpleInputProps) => {
  const dispatch = useAppDispatch();

  const value = useAppSelector(
    (state) => state.newIntervention[field],
  );

  const [copied, setCopied] = React.useState(false);

  const Icon = icon;
  const isWctLink = field === "wctLink";
  const stringValue =
    typeof value === "string" ? value : "";

  const openLink = () => {
    const raw = stringValue.trim();
    if (!raw) return;

    try {
      const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
      const parsed = new URL(candidate);
      if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return;
      window.open(parsed.toString(), "_blank", "noopener,noreferrer");
    } catch {
      // Invalid/unsupported value: deliberately do nothing.
    }
  };

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
      } ${Icon ? "simple-input--with-icon" : "simple-input--without-icon"} ${className}`.trim()}
    >
      {Icon ? (
        <div className="icon-container">
          <Icon />
        </div>
      ) : null}

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
            slotProps={{ input: { readOnly } }}
            onChange={(event) =>
              dispatch(
                updateField({
                  field,
                  value: trimLeadingHorizontalWhitespace(event.target.value),
                }),
              )
            }
            onBlur={() =>
              dispatch(updateField({ field, value: stringValue.trim() }))
            }
            sx={{
              "& .MuiOutlinedInput-root": {
                minHeight: "40px",
                height: "40px",
                boxSizing: "border-box",
                borderRadius: "4px",
              },
              "& .MuiOutlinedInput-input": {
                height: "40px",
                boxSizing: "border-box",
                paddingTop: 0,
                paddingBottom: 0,
                paddingRight: "44px",
                lineHeight: "40px",
                textAlign: "center",
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
            isWctLink
              ? (stringValue.trim() ? "Ouvrir le lien" : "Champ vide")
              : copied
                ? "Copié"
                : stringValue.trim()
                  ? "Copier"
                  : "Champ vide"
          }
          placement="left"
          arrow
        >
          <span className="simple-input__copy-wrapper">
            <IconButton
              type="button"
              className={`simple-input__copy-button ${
                copied && !isWctLink
                  ? "simple-input__copy-button--copied"
                  : ""
              }`}
              aria-label={isWctLink ? `Ouvrir ${label}` : `Copier ${label}`}
              onClick={isWctLink ? openLink : copyValue}
              disabled={!stringValue.trim()}
              size="small"
            >
              {isWctLink ? (
                <OpenInNewRounded fontSize="small" />
              ) : copied ? (
                <CheckRounded fontSize="small" />
              ) : (
                <CopyIcon />
              )}
            </IconButton>
          </span>
        </Tooltip>
      </div>
    </div>
  );
};

export default SimpleInput;