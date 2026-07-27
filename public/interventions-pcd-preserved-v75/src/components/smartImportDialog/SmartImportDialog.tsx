import * as React from "react";
import AutoAwesomeRounded from "@mui/icons-material/AutoAwesomeRounded";
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
import "./SmartImportDialog.scss";

type Props = {
  disabled?: boolean;
  onImported?: (message: string) => void;
};

const SmartImportDialog = ({ disabled = false, onImported }: Props) => {
  const dispatch = useAppDispatch();
  const [open, setOpen] = React.useState(false);
  const [processing, setProcessing] = React.useState(false);
  const pasteTargetRef = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => pasteTargetRef.current?.focus(), 80);
    return () => window.clearTimeout(timer);
  }, [open]);

  const importText = (text: string) => {
    if (!text.trim() || processing) return;
    setProcessing(true);

    window.setTimeout(() => {
      const result = parseSmartImport(text);
      const count = result.detectedFields.length;

      if (count === 0) {
        setProcessing(false);
        onImported?.("Aucune donnée reconnue dans le contenu collé.");
        return;
      }

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
        type="button"
        variant="outlined"
        startIcon={<AutoAwesomeRounded />}
        className="smart-import-trigger"
        disabled={disabled}
        onClick={() => setOpen(true)}
      >
        Import intelligent
      </Button>

      <Dialog
        open={open}
        onClose={() => !processing && setOpen(false)}
        fullWidth
        maxWidth="sm"
        className="smart-import-dialog"
      >
        <DialogTitle className="smart-import-dialog__title">
          <span>
            <AutoAwesomeRounded />
            Import intelligent
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
