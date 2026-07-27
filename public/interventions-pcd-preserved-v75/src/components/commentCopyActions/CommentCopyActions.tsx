import * as React from "react";
import CheckRounded from "@mui/icons-material/CheckRounded";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";

import { ReactComponent as CopyIcon } from "../../assets/svg/Copy.svg.tsx";
import { ReactComponent as NpsCopyIcon } from "../../assets/svg/NPS copy.svg.tsx";
import {
  prepareNpsText,
  prepareWctText,
  writeTextToClipboard,
} from "../../utils/textUtils";

import "./CommentCopyActions.scss";

type Props = {
  value: string;
  showWct?: boolean;
  compact?: boolean;
};

const CommentCopyActions = ({
  value,
  showWct = false,
  compact = false,
}: Props) => {
  const [copied, setCopied] = React.useState<"normal" | "nps" | "wct" | null>(null);

  const copy = async (
    type: "normal" | "nps" | "wct",
    preparedValue: string,
    event: React.MouseEvent,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    if (!preparedValue.trim()) return;

    await writeTextToClipboard(preparedValue);
    setCopied(type);
    window.setTimeout(() => setCopied(null), 1200);
  };

  const npsValue = prepareNpsText(value);
  const wctValue = prepareWctText(value);

  return (
    <div
      className={`comment-copy-actions ${
        compact ? "comment-copy-actions--compact" : ""
      }`}
      onClick={(event) => event.stopPropagation()}
    >
      <Tooltip title={copied === "normal" ? "Copié" : "Copier"} arrow>
        <span>
          <IconButton
            size="small"
            disabled={!value.trim()}
            onClick={(event) => copy("normal", value.trim(), event)}
            aria-label="Copier le commentaire"
          >
            {copied === "normal" ? <CheckRounded /> : <CopyIcon />}
          </IconButton>
        </span>
      </Tooltip>

      <Tooltip title={copied === "nps" ? "NPS copié" : "Copier pour NPS"} arrow>
        <span>
          <IconButton
            size="small"
            className="comment-copy-actions__nps"
            disabled={!npsValue}
            onClick={(event) => copy("nps", npsValue, event)}
            aria-label="Copier le commentaire pour NPS"
          >
            {copied === "nps" ? <CheckRounded /> : <NpsCopyIcon />}
          </IconButton>
        </span>
      </Tooltip>

      {showWct && (
        <Tooltip title={copied === "wct" ? "WCT copié" : "Copier pour WCT"} arrow>
          <span>
            <IconButton
              size="small"
              className="comment-copy-actions__wct"
              disabled={!wctValue}
              onClick={(event) => copy("wct", wctValue, event)}
              aria-label="Copier le commentaire pour WCT"
            >
              {copied === "wct" ? <CheckRounded /> : <strong>WCT</strong>}
            </IconButton>
          </span>
        </Tooltip>
      )}
    </div>
  );
};
export default CommentCopyActions;
