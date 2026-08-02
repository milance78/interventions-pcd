import * as React from "react";
import ContentPasteGoRounded from "@mui/icons-material/ContentPasteGoRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import CircularProgress from "@mui/material/CircularProgress";
import { parseSmartImport } from "../../features/smartImport/smartImportParser";
import { applyImportedData } from "../../redux/features/newInterventionSlice";
import { useAppDispatch } from "../../redux/store";
import CollerWctNpsIcon from "../../assets/icons/CollerWctNps.png";
import "./SmartImportDialog.scss";

type CollerIconProps = {
  className: string;
};

const CollerIcon = ({ className }: CollerIconProps) => (
  <span
    aria-hidden="true"
    className={className}
    style={{
      WebkitMaskImage: `url(${CollerWctNpsIcon})`,
      maskImage: `url(${CollerWctNpsIcon})`,
    }}
  />
);

type Props = {
  disabled?: boolean;
  onImported?: (message: string) => void;
  autoOpen?: boolean;
  focusTrigger?: boolean;
};

const SmartImportDialog = ({
  disabled = false,
  onImported,
  autoOpen = false,
  focusTrigger = false,
}: Props) => {
  const dispatch = useAppDispatch();
  const [open, setOpen] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const pasteTargetRef = React.useRef<HTMLTextAreaElement | null>(null);
  const triggerRef = React.useRef<HTMLButtonElement | null>(null);
  const initialOpenHandledRef = React.useRef(false);

  React.useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => pasteTargetRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [open]);

  React.useEffect(() => {
    if (initialOpenHandledRef.current) return;
    initialOpenHandledRef.current = true;

    if (autoOpen && !disabled) {
      setOpen(true);
      return;
    }

    if (focusTrigger && !disabled) {
      const timer = window.setTimeout(() => triggerRef.current?.focus(), 80);
      return () => window.clearTimeout(timer);
    }
  }, [autoOpen, disabled, focusTrigger]);

  const copyOagIdToClipboard = (value: string) => {
    const normalized = value.trim();
    if (!normalized) return;

    if (navigator.clipboard?.writeText) {
      void navigator.clipboard.writeText(normalized).catch(() => undefined);
      return;
    }

    const textarea = document.createElement("textarea");
    textarea.value = normalized;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  };

  const importText = (text: string) => {
    if (!text.trim() || processing) return;

    const result = parseSmartImport(text);
    const count = result.detectedFields.length;

    if (count === 0) {
      onImported?.("Aucune donnée reconnue dans le contenu collé.");
      return;
    }

    // The paste gesture gives us the best chance to place OAG ID directly
    // into the clipboard before the dialog closes.
    copyOagIdToClipboard(String(result.values.oagID ?? ""));
    setProcessing(true);

    window.setTimeout(() => {
      dispatch(applyImportedData(result.values));
      setProcessing(false);
      setOpen(false);
      onImported?.(`${count} champs remplis automatiquement (${result.sourceType}).`);
    }, 60);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    event.preventDefault();
    importText(event.clipboardData.getData("text/plain"));
  };

  return (
    <>
      <Button
        ref={triggerRef}
        type="button"
        variant="outlined"
        startIcon={
          <CollerIcon className="smart-import-trigger__icon" />
        }
        className="smart-import-trigger"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        Coller WCT/NPS
      </Button>

      <Dialog
        open={open}
        onClose={() => !processing && setOpen(false)}
        fullWidth
        maxWidth="md"
        className="smart-import-dialog"
      >
        <DialogTitle className="smart-import-dialog__title">
          <span>
            <CollerIcon className="smart-import-dialog__title-icon" />
            Coller WCT/NPS
          </span>
          <IconButton
            aria-label="Fermer"
            onClick={() => setOpen(false)}
            disabled={processing}
          >
            <CloseRounded />
          </IconButton>
        </DialogTitle>

        <DialogContent className="smart-import-dialog__content">
          <textarea
            ref={pasteTargetRef}
            className="smart-import-dialog__paste-target"
            aria-label="Coller le contenu de la page"
            onPaste={handlePaste}
            onChange={() => undefined}
            value=""
          />

          <div className={`smart-import-dropzone ${processing ? "smart-import-dropzone--processing" : ""}`}>
            {processing ? (
              <>
                <CircularProgress size={38} />
                <strong>Analyse des données…</strong>
                <span>Les champs seront remplis automatiquement.</span>
              </>
            ) : (
              <>
                <ContentPasteGoRounded className="smart-import-dropzone__icon" />
                <strong>Collez le contenu complet de la page</strong>
                <span>Appuyez simplement sur Ctrl + V. Le texte brut ne sera pas affiché.</span>
                <kbd>Ctrl + V</kbd>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default SmartImportDialog;
