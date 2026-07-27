import * as React from "react";
import AddRounded from "@mui/icons-material/AddRounded";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Grow from "@mui/material/Grow";
import type { TransitionProps } from "@mui/material/transitions";
import { NavLink, useNavigate } from "react-router-dom";

import ProfileMenu from "../profileMenu/ProfileMenu";
import InterventionSearch from "./interventionSearch/InterventionSearch";
import {
  resumeDraft,
  startNewIntervention,
} from "../../redux/features/newInterventionSlice";
import { useAppDispatch, useAppSelector } from "../../redux/store";

import "./Header.scss";

const DialogTransition = React.forwardRef(function DialogTransition(
  props: TransitionProps & {
    children: React.ReactElement;
  },
  ref: React.Ref<unknown>,
) {
  return <Grow ref={ref} {...props} timeout={180} />;
});

const Header = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { hasDraft, mode } = useAppSelector((state) => state.newIntervention);

  const [now, setNow] = React.useState(new Date());
  const [newDialogOpen, setNewDialogOpen] = React.useState(false);

  React.useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 1000);

    return () => window.clearInterval(interval);
  }, []);

  const openCurrentPage = () => navigate("/intervention-en-cours");

  const closeNewInterventionDialog = () => {
    setNewDialogOpen(false);
  };

  const handleNewIntervention = () => {
    if (hasDraft) {
      setNewDialogOpen(true);
      return;
    }

    dispatch(startNewIntervention());
    openCurrentPage();
  };

  const handleResumeDraft = () => {
    dispatch(resumeDraft());
    closeNewInterventionDialog();
    openCurrentPage();
  };

  const handleStartFresh = () => {
    dispatch(startNewIntervention());
    closeNewInterventionDialog();
    openCurrentPage();
  };

  const date = now.toLocaleDateString("fr-BE");
  const time = now.toLocaleTimeString("fr-BE");

  return (
    <header className="header">
      <div className="header__datetime">
        <div className="header__date">{date}</div>
        <div className="header__time">{time}</div>
      </div>

      <nav className="header__navigation">
        <NavLink
          to="/intervention-en-cours"
          className={({ isActive }) =>
            `header__link ${isActive ? "header__link--active" : ""}`
          }
        >
          Intervention en cours
        </NavLink>

        <NavLink
          to="/liste-du-jour"
          className={({ isActive }) =>
            `header__link ${isActive ? "header__link--active" : ""}`
          }
        >
          Liste du jour
        </NavLink>

        <NavLink
          to="/historique"
          className={({ isActive }) =>
            `header__link ${isActive ? "header__link--active" : ""}`
          }
        >
          Historique
        </NavLink>

        <NavLink
          to="/statistiques"
          className={({ isActive }) =>
            `header__link ${isActive ? "header__link--active" : ""}`
          }
        >
          Statistiques
        </NavLink>

        <NavLink
          to="/modeles"
          className={({ isActive }) =>
            `header__link ${isActive ? "header__link--active" : ""}`
          }
        >
          Modèles
        </NavLink>
      </nav>

      <div className="header__right">
        <Button
          type="button"
          variant="outlined"
          size="small"
          startIcon={<AddRounded />}
          className="header__new-intervention"
          onClick={handleNewIntervention}
        >
          Nouvelle intervention
        </Button>

        <InterventionSearch />
        <ProfileMenu />
      </div>

      <Dialog
        open={newDialogOpen}
        onClose={closeNewInterventionDialog}
        TransitionComponent={DialogTransition}
        transitionDuration={180}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          className: "new-intervention-dialog",
        }}
        aria-labelledby="new-intervention-dialog-title"
        aria-describedby="new-intervention-dialog-description"
      >
        <DialogTitle
          id="new-intervention-dialog-title"
          className="new-intervention-dialog__title"
        >
          Un brouillon est déjà en cours
        </DialogTitle>

        <DialogContent className="new-intervention-dialog__content">
          <DialogContentText
            id="new-intervention-dialog-description"
            className="new-intervention-dialog__text"
          >
            {mode === "VIEW_HISTORY"
              ? "Vous consultez une intervention. Voulez-vous reprendre votre brouillon ou commencer une nouvelle intervention ?"
              : "Voulez-vous reprendre le brouillon actuel ou supprimer son contenu et commencer une nouvelle intervention ?"}
          </DialogContentText>
        </DialogContent>

        <DialogActions className="new-intervention-dialog__actions">
          <Button
            type="button"
            variant="outlined"
            className="new-intervention-dialog__button new-intervention-dialog__button--cancel"
            onClick={closeNewInterventionDialog}
          >
            Annuler
          </Button>

          <Button
            type="button"
            variant="outlined"
            className="new-intervention-dialog__button new-intervention-dialog__button--new"
            onClick={handleStartFresh}
          >
            Nouvelle intervention
          </Button>

          <Button
            type="button"
            variant="contained"
            className="new-intervention-dialog__button new-intervention-dialog__button--resume"
            onClick={handleResumeDraft}
            autoFocus
          >
            Reprendre le brouillon
          </Button>
        </DialogActions>
      </Dialog>
    </header>
  );
};

export default Header;
