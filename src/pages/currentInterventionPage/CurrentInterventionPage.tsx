import * as React from "react";

import AddTaskRounded from "@mui/icons-material/AddTaskRounded";
import DeleteSweepRounded from "@mui/icons-material/DeleteSweepRounded";
import HistoryRounded from "@mui/icons-material/HistoryRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import Send from "@mui/icons-material/Send";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { useNavigate } from "react-router-dom";

import "./CurrentInterventionPage.scss";

import AdditionalInformationDialog from "../../components/additionalInformationDialog/AdditionalInformationDialog";
import BooleanInput from "../../components/currentIntervention/booleanInput/BooleanInput";
import ClientsOnAddress from "../../components/currentIntervention/clientsOnAddress/ClientsOnAddress";
import InfrastructureInput from "../../components/currentIntervention/infrastructureInput/InfrastructureInput";
import InputsAll from "../../components/currentIntervention/inputsAll/InputsAll";
import NetworkInput from "../../components/currentIntervention/networkInput/NetworkInput";
import StatusInput from "../../components/currentIntervention/status/StatusInput";

import {
  clearTask,
  markSearchInterventionSaved,
  resumeDraft,
  updateField,
} from "../../redux/features/newInterventionSlice";
import {
  useAppDispatch,
  useAppSelector,
} from "../../redux/store";
import { createInterventionThunk } from "../../redux/thunks/createInterventionThunk";
import { updateInterventionThunk } from "../../redux/thunks/updateInterventionThunk";
import { updateSearchInterventionThunk } from "../../redux/thunks/updateSearchInterventionThunk";
import { auth } from "../../firebase/firebaseConfig";
import {
  loadInterventionRevisions,
  type InterventionRevision,
} from "../../firebase/interventionsService";

import { ReactComponent as AddressConfirmedIcon } from "../../assets/svg/Address confirmed.svg.tsx";
import { ReactComponent as AddressNotConfirmedIcon } from "../../assets/svg/Address not confirmed.svg.tsx";
import { ReactComponent as LightBulbOffIcon } from "../../assets/svg/Light bulb off.svg.tsx";
import { ReactComponent as LightBulbOnIcon } from "../../assets/svg/Light bulb on.svg.tsx";
import { ReactComponent as QuestionMarkOffIcon } from "../../assets/svg/Question mark off.svg.tsx";
import { ReactComponent as QuestionMarkOnIcon } from "../../assets/svg/Question mark on.svg.tsx";
import { ReactComponent as SnowOffIcon } from "../../assets/svg/Snow off.svg.tsx";
import { ReactComponent as SnowOnIcon } from "../../assets/svg/Snow on.svg.tsx";

type CopyButtonProps = {
  value: string;
  label: string;
};

const CopyButton = ({
  value,
  label,
}: CopyButtonProps) => {
  const [copied, setCopied] = React.useState(false);

  const copyValue = async () => {
    if (!value.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const temporaryTextArea =
        document.createElement("textarea");

      temporaryTextArea.value = value;
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
    }

    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1200);
  };



  return (
    <Tooltip
      title={
        copied
          ? "Copié"
          : value.trim()
            ? "Copier"
            : "Champ vide"
      }
      placement="top"
      arrow
    >
      <span className="copy-field-button-wrapper">
        <IconButton
          type="button"
          size="small"
          aria-label={`Copier ${label}`}
          className={`copy-field-button ${
            copied
              ? "copy-field-button--copied"
              : ""
          }`}
          disabled={!value.trim()}
          onClick={copyValue}
        >
          {copied ? (
            <CheckRounded fontSize="small" />
          ) : (
            <ContentCopyRounded fontSize="small" />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
};

const CurrentInterventionPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const newIntervention = useAppSelector(
    (state) => state.newIntervention,
  );

  const {
    clientName,
    comment,
    additionalInformation,
    isEditing,
    isHistoryView,
    hasDraft,
    mode,
  } = newIntervention;

  const [clearDialogOpen, setClearDialogOpen] = React.useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = React.useState(false);
  const [revisionsLoading, setRevisionsLoading] = React.useState(false);
  const [revisions, setRevisions] = React.useState<InterventionRevision[]>([]);
  const [revisionsError, setRevisionsError] = React.useState("");

  const submitActions = async () => {
    const result = isEditing
      ? await dispatch(
          updateInterventionThunk(
            newIntervention,
          ),
        )
      : await dispatch(
          createInterventionThunk(
            newIntervention,
          ),
        );

    const requestFailed =
      createInterventionThunk.rejected.match(
        result,
      ) ||
      updateInterventionThunk.rejected.match(
        result,
      );

    if (requestFailed) {
      const message =
        typeof result.payload === "string"
          ? result.payload
          : result.error.message ||
            "L'intervention n'a pas pu être enregistrée.";

      window.alert(message);
      return;
    }

    if (isEditing && hasDraft) {
      dispatch(resumeDraft());
    } else {
      dispatch(clearTask());
    }
    navigate("/liste-du-jour");
  };

  const addToTodayList = async () => {
    if (mode !== "SEARCH_EDIT") return;

    const result = await dispatch(
      updateSearchInterventionThunk(newIntervention),
    );

    if (updateSearchInterventionThunk.rejected.match(result)) {
      const message =
        typeof result.payload === "string"
          ? result.payload
          : result.error.message ||
            "L'intervention n'a pas pu être ajoutée à la liste du jour.";
      window.alert(message);
      return;
    }

    dispatch(markSearchInterventionSaved(result.payload));

    if (!hasDraft) {
      dispatch(clearTask());
      navigate("/liste-du-jour");
    }
  };

  const openRevisionHistory = async () => {
    if (!newIntervention.documentId) return;

    setHistoryDialogOpen(true);
    setRevisionsLoading(true);
    setRevisionsError("");

    try {
      await auth.authStateReady();
      const user = auth.currentUser;
      if (!user) throw new Error("Utilisateur non authentifié");

      const loadedRevisions = await loadInterventionRevisions(
        user.uid,
        newIntervention.documentId,
        newIntervention.interventionId,
        newIntervention.oagID,
      );
      setRevisions(loadedRevisions);
    } catch (error) {
      setRevisionsError(
        error instanceof Error
          ? error.message
          : "Impossible de charger l'historique des modifications.",
      );
    } finally {
      setRevisionsLoading(false);
    }
  };

  const confirmClearForm = () => {
    dispatch(clearTask());
    setClearDialogOpen(false);
  };

  const handleResumeDraft = () => {
    dispatch(resumeDraft());
  };

  const isNewOrDraft = mode === "NEW" || mode === "DRAFT";
  const isSearchEdit = mode === "SEARCH_EDIT";

  return (
    <main
      className={`current-intervention-page ${
        isHistoryView ? "current-intervention-page--history" : ""
      }`}
    >
      <div className="current-intervention-layout">
        <section className="intervention-card left-card">
          <header className="card-header">
            <h1>
              {isSearchEdit
                ? "Intervention trouvée"
                : isHistoryView
                  ? "Intervention de l'historique"
                  : isEditing
                    ? "Modifier l'intervention"
                    : "Nouvelle intervention"}
            </h1>

            <span className="editing-badge">
              {isSearchEdit
                ? "Modification recherchée"
                : isHistoryView
                  ? "Historique"
                  : isEditing
                    ? "Modification"
                    : "Création"}
            </span>
          </header>

          <div className="basic-info">
            <InfrastructureInput />
            <NetworkInput />
          </div>

          <div className="technical-inputs">
            <InputsAll />
          </div>

          <section className="intervention-options">
            <span className="options-title">
              Options de l'intervention
            </span>

            <div className="boolean-inputs-row">
              <div className="option-button">
                <BooleanInput
                  field="isSnow"
                  label="Ticket Snow ?"
                  trueIcon={<SnowOnIcon />}
                  falseIcon={<SnowOffIcon />}
                />
              </div>

              <div className="option-button">
                <BooleanInput
                  field="isUnclear"
                  label="Question à poser à l'M&P ?"
                  trueIcon={
                    <QuestionMarkOnIcon />
                  }
                  falseIcon={
                    <QuestionMarkOffIcon />
                  }
                />
              </div>

              <div className="option-button">
                <BooleanInput
                  field="isGoodExample"
                  label="Bon exemple à retenir ?"
                  trueIcon={
                    <LightBulbOnIcon />
                  }
                  falseIcon={
                    <LightBulbOffIcon />
                  }
                />
              </div>

              <div className="option-button">
                <BooleanInput
                  field="isAddressConfirmed"
                  label="Adresse confirmée ?"
                  trueIcon={
                    <AddressConfirmedIcon />
                  }
                  falseIcon={
                    <AddressNotConfirmedIcon />
                  }
                />
              </div>
            </div>
          </section>
        </section>

        <section className="intervention-card right-card">
          <div className="client-name-field copy-field">
            <TextField
              label="Nom du client"
              value={clientName}
              onChange={(event) =>
                dispatch(
                  updateField({
                    field: "clientName",
                    value:
                      event.target.value,
                  }),
                )
              }
              fullWidth
              disabled={isHistoryView}
              sx={{
                "& .MuiOutlinedInput-input":
                  {
                    paddingRight: "48px",
                  },
              }}
            />

            <CopyButton
              value={clientName}
              label="Nom du client"
            />
          </div>

          <div className="clients-address-field">
            <ClientsOnAddress />
          </div>

          <div className="comment-field copy-field">
            <TextField
              label="Commentaire"
              value={comment}
              onChange={(event) =>
                dispatch(
                  updateField({
                    field: "comment",
                    value:
                      event.target.value,
                  }),
                )
              }
              multiline
              rows={7}
              fullWidth
              disabled={isHistoryView}
              sx={{
                "& textarea": {
                  paddingRight: "48px",
                  boxSizing: "border-box",
                },
              }}
            />

            <CopyButton
              value={comment}
              label="Commentaire"
            />
          </div>

          <AdditionalInformationDialog
            value={additionalInformation}
            editable={!isHistoryView}
            onChange={(value) =>
              dispatch(
                updateField({
                  field: "additionalInformation",
                  value,
                }),
              )
            }
          />

          <footer className="right-card-actions">
            <div className="status-wrapper">
              <StatusInput />
            </div>

            <div className="current-intervention-submit-buttons">
              {isHistoryView || isSearchEdit ? (
                <>
                  {newIntervention.documentId && (
                    <Button
                      variant="text"
                      size="large"
                      onClick={openRevisionHistory}
                      startIcon={<HistoryRounded />}
                      className="revision-history-button"
                    >
                      Historique des modifications
                    </Button>
                  )}

                  {isSearchEdit && (
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={addToTodayList}
                      startIcon={<AddTaskRounded />}
                      className="add-to-today-button add-to-today-button--history"
                    >
                      <span className="add-to-today-button__label">
                        <span>Ajouter à la</span>
                        <span>liste du jour</span>
                      </span>
                    </Button>
                  )}
                </>
              ) : (
                <>
                  {isNewOrDraft && (
                    <Button
                      variant="text"
                      size="large"
                      onClick={() => setClearDialogOpen(true)}
                      startIcon={<DeleteSweepRounded />}
                      className="clear-form-button"
                      disabled={!hasDraft}
                    >
                      Effacer le formulaire
                    </Button>
                  )}

                  <Button
                    variant="contained"
                    size="large"
                    onClick={submitActions}
                    startIcon={<Send />}
                    className="submit-intervention-button"
                  >
                    {isEditing ? "Enregistrer" : "Envoyer"}
                  </Button>
                </>
              )}
            </div>
          </footer>
        </section>
      </div>

      {hasDraft && mode !== "NEW" && mode !== "DRAFT" && (
        <button
          type="button"
          className="floating-draft-reminder"
          onClick={handleResumeDraft}
        >
          <WarningAmberRounded />
          <span>
            <strong>Brouillon en cours</strong>
            <small>Reprendre la saisie</small>
          </span>
        </button>
      )}

      <Dialog
        open={historyDialogOpen}
        onClose={() => setHistoryDialogOpen(false)}
        fullWidth
        maxWidth="md"
        aria-labelledby="revision-history-dialog-title"
      >
        <DialogTitle id="revision-history-dialog-title">
          Historique des modifications
        </DialogTitle>
        <DialogContent dividers className="revision-history-dialog-content">
          {revisionsLoading && <p>Chargement…</p>}
          {!revisionsLoading && revisionsError && (
            <p className="revision-history-error">{revisionsError}</p>
          )}
          {!revisionsLoading && !revisionsError && revisions.length === 0 && (
            <p>Aucune modification précédente.</p>
          )}
          {!revisionsLoading && !revisionsError && revisions.map((revision) => (
            <article className="revision-card" key={revision.revisionId}>
              <header>
                <strong>
                  {revision.changedAt
                    ? new Date(revision.changedAt).toLocaleString("fr-BE")
                    : "Date inconnue"}
                </strong>
                {revision.previousDateKey && <span>{revision.previousDateKey}</span>}
              </header>
              <dl>
                <div><dt>ID intervention</dt><dd>{revision.snapshot.interventionId || "—"}</dd></div>
                <div><dt>OAG ID</dt><dd>{revision.snapshot.oagID || "—"}</dd></div>
                <div><dt>Nom du client</dt><dd>{revision.snapshot.clientName || "—"}</dd></div>
                <div><dt>Description</dt><dd>{revision.snapshot.interventionDescription || "—"}</dd></div>
                <div><dt>Commentaire</dt><dd>{revision.snapshot.comment || "—"}</dd></div>
                <div><dt>Informations supplémentaires</dt><dd>{revision.snapshot.additionalInformation || "—"}</dd></div>
                <div><dt>Statut</dt><dd>{revision.snapshot.status || "—"}</dd></div>
              </dl>
            </article>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialogOpen(false)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={clearDialogOpen}
        onClose={() => setClearDialogOpen(false)}
        aria-labelledby="clear-form-dialog-title"
      >
        <DialogTitle id="clear-form-dialog-title">
          Effacer tout le formulaire ?
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Toutes les informations saisies seront définitivement supprimées.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setClearDialogOpen(false)}>Annuler</Button>
          <Button color="error" variant="contained" onClick={confirmClearForm}>
            Tout effacer
          </Button>
        </DialogActions>
      </Dialog>
    </main>
  );
};

export default CurrentInterventionPage;