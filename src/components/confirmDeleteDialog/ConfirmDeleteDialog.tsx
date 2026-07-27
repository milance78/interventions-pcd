import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";

type Props = {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

const ConfirmDeleteDialog = ({ open, onCancel, onConfirm }: Props) => (
  <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
    <DialogTitle>Supprimer cette intervention ?</DialogTitle>
    <DialogContent>
      <DialogContentText>
        Cette intervention sera retirée de cette liste. Êtes-vous sûr de vouloir continuer ?
      </DialogContentText>
    </DialogContent>
    <DialogActions>
      <Button onClick={onCancel}>Annuler</Button>
      <Button color="error" variant="contained" onClick={onConfirm}>
        Supprimer
      </Button>
    </DialogActions>
  </Dialog>
);
export default ConfirmDeleteDialog;
