import * as React from "react";
import ArticleOutlined from "@mui/icons-material/ArticleOutlined";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import "./AdditionalInformationDialog.scss";

type Props = {
  value: string;
  editable?: boolean;
  onChange?: (value: string) => void;
  buttonClassName?: string;
};

const AdditionalInformationDialog = ({ value, editable = false, onChange, buttonClassName = "" }: Props) => {
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value);

  React.useEffect(() => {
    if (!open) setDraft(value);
  }, [value, open]);

  const close = () => {
    setDraft(value);
    setOpen(false);
  };

  const save = () => {
    onChange?.(draft);
    setOpen(false);
  };

  return (
    <>
      <Button
        type="button"
        variant={value.trim() ? "outlined" : "text"}
        startIcon={<ArticleOutlined />}
        className={`additional-information-trigger ${buttonClassName}`.trim()}
        onClick={() => setOpen(true)}
      >
        Informations supplémentaires{value.trim() ? " •" : ""}
      </Button>

      <Dialog
        open={open}
        onClose={close}
        fullWidth
        maxWidth="md"
        className="additional-information-dialog"
      >
        <DialogTitle>Informations supplémentaires</DialogTitle>
        <DialogContent>
          {editable ? (
            <TextField
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              multiline
              minRows={10}
              maxRows={22}
              fullWidth
              placeholder="Saisissez les informations supplémentaires…"
            />
          ) : (
            <div className="additional-information-readonly">
              {value.trim() || "Aucune information supplémentaire."}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>{editable ? "Annuler" : "Fermer"}</Button>
          {editable && <Button variant="contained" onClick={save}>Enregistrer</Button>}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdditionalInformationDialog;
