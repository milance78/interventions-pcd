import * as React from "react";
import CheckRounded from "@mui/icons-material/CheckRounded";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import { ReactComponent as CopyIcon } from "../../../assets/svg/Copy.svg.tsx";
import { writeTextToClipboard } from "../../../utils/clipboard";

type FieldCopyButtonProps = {
  value: string;
  label: string;
};

const COPIED_FEEDBACK_DURATION_MS = 1200;

export const FieldCopyButton = ({ value, label }: FieldCopyButtonProps) => {
  const [copied, setCopied] = React.useState(false);
  const timerRef = React.useRef<number | null>(null);
  const canCopy = value.trim().length > 0;

  React.useEffect(
    () => () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const copyValue = async () => {
    if (!canCopy) return;

    await writeTextToClipboard(value);
    setCopied(true);

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    timerRef.current = window.setTimeout(() => {
      setCopied(false);
      timerRef.current = null;
    }, COPIED_FEEDBACK_DURATION_MS);
  };

  return (
    <Tooltip
      title={copied ? "Copié" : canCopy ? "Copier" : "Champ vide"}
      placement="top"
      arrow
    >
      <span className="copy-field-button-wrapper">
        <IconButton
          type="button"
          size="small"
          aria-label={`Copier ${label}`}
          className={`copy-field-button ${copied ? "copy-field-button--copied" : ""}`}
          disabled={!canCopy}
          onClick={copyValue}
        >
          {copied ? <CheckRounded fontSize="small" /> : <CopyIcon />}
        </IconButton>
      </span>
    </Tooltip>
  );
};
