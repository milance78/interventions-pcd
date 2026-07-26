import * as React from "react";

import AddTaskRounded from "@mui/icons-material/AddTaskRounded";
import DeleteSweepRounded from "@mui/icons-material/DeleteSweepRounded";
import HistoryRounded from "@mui/icons-material/HistoryRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import Send from "@mui/icons-material/Send";
import Button from "@mui/material/Button";
import ButtonGroup from "@mui/material/ButtonGroup";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { useNavigate } from "react-router-dom";

import "./CurrentInterventionPage.scss";

import AdditionalInformationDialog from "../../components/additionalInformationDialog/AdditionalInformationDialog";
import BooleanInput from "../../components/currentIntervention/booleanInput/BooleanInput";
import ClientsOnAddress from "../../components/currentIntervention/clientsOnAddress/ClientsOnAddress";
import InfrastructureInput from "../../components/currentIntervention/infrastructureInput/InfrastructureInput";
import InputsAll from "../../components/currentIntervention/inputsAll/InputsAll";
import NetworkInput from "../../components/currentIntervention/networkInput/NetworkInput";
import StatusInput from "../../components/currentIntervention/status/StatusInput";
import SmartImportDialog from "../../components/smartImportDialog/SmartImportDialog";

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
import { ReactComponent as AddressConfirmedOffIcon } from "../../assets/svg/Address confirmed off.svg.tsx";
import { ReactComponent as AddressNotConfirmedIcon } from "../../assets/svg/Address not confirmed.svg.tsx";
import { ReactComponent as AddressNotConfirmedOffIcon } from "../../assets/svg/Address not confirmed off.svg.tsx";
import { ReactComponent as LightBulbOffIcon } from "../../assets/svg/Light bulb off.svg.tsx";
import { ReactComponent as LightBulbOnIcon } from "../../assets/svg/Light bulb on.svg.tsx";
import { ReactComponent as QuestionMarkOffIcon } from "../../assets/svg/Question mark off.svg.tsx";
import { ReactComponent as QuestionMarkOnIcon } from "../../assets/svg/Question mark on.svg.tsx";
import { ReactComponent as SnowOffIcon } from "../../assets/svg/Snow off.svg.tsx";
import { ReactComponent as SnowOnIcon } from "../../assets/svg/Snow on.svg.tsx";
import { ReactComponent as NpsCopyIcon } from "../../assets/svg/NPS copy.svg.tsx";
import { ReactComponent as CopyIcon } from "../../assets/svg/Copy.svg.tsx";
import VoiceMessageCall1 from "../../assets/icons/VoiceMessageCall1.png";
import VoiceMessageCall2 from "../../assets/icons/VoiceMessageCall2.png";
import VoiceMessageCall3 from "../../assets/icons/VoiceMessageCall3.png";
import VoiceMessageCallX from "../../assets/icons/VoiceMessageCallX.png";

type CopyButtonProps = {
  value: string;
  label: string;
};

const writeTextToClipboard = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const temporaryTextArea = document.createElement("textarea");

    temporaryTextArea.value = value;
    temporaryTextArea.style.position = "fixed";
    temporaryTextArea.style.opacity = "0";

    document.body.appendChild(temporaryTextArea);

    temporaryTextArea.focus();
    temporaryTextArea.select();
    document.execCommand("copy");

    document.body.removeChild(temporaryTextArea);
  }
};

const prepareNpsComment = (value: string) =>
  value
    .replace(/\r\n/g, "\n")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/œ/g, "oe")
    .replace(/Œ/g, "OE")
    .replace(/æ/g, "ae")
    .replace(/Æ/g, "AE")
    .split("\n")
    .filter((line) => line.trim().length > 0)
    .join("\n");

const CopyButton = ({
  value,
  label,
}: CopyButtonProps) => {
  const [copied, setCopied] = React.useState(false);

  const copyValue = async () => {
    if (!value.trim()) {
      return;
    }

    await writeTextToClipboard(value);

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
            <CopyIcon />
          )}
        </IconButton>
      </span>
    </Tooltip>
  );
};

const NpsCopyButton = ({
  value,
  label,
}: CopyButtonProps) => {
  const [copied, setCopied] = React.useState(false);
  const npsValue = prepareNpsComment(value);

  const copyNpsValue = async () => {
    if (!npsValue.trim()) {
      return;
    }

    await writeTextToClipboard(npsValue);

    setCopied(true);

    window.setTimeout(() => {
      setCopied(false);
    }, 1200);
  };

  return (
    <Tooltip
      title={
        copied
          ? "NPS copié"
          : npsValue.trim()
            ? "Copier pour NPS"
            : "Champ vide"
      }
      placement="left"
      arrow
    >
      <span className="nps-copy-button-wrapper">
        <IconButton
          type="button"
          size="small"
          aria-label={`Copier ${label} pour NPS`}
          className={`copy-field-button nps-copy-button ${
            copied ? "copy-field-button--copied" : ""
          }`}
          disabled={!npsValue.trim()}
          onClick={copyNpsValue}
        >
          {copied ? (
            <CheckRounded fontSize="small" />
          ) : (
            <NpsCopyIcon />
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
    cure,
    smsEnabled,
    addressConfirmation,
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
  const [importMessage, setImportMessage] = React.useState("");
  const commentInputRef = React.useRef<HTMLTextAreaElement | null>(null);


  const generatedCureLine = /(?:1er|2(?:e|ème|eme)|3(?:e|ème|eme)) CURE(?: \+ SMS)? fait le (\d{2}\/\d{2}\/\d{4}) à \d{2}:\d{2}h/g;

  const buildCureComment = (
    nextCure: typeof cure,
    nextSmsEnabled: boolean,
  ) => {
    const now = new Date();
    const today = `${String(now.getDate()).padStart(2, "0")}/${String(now.getMonth() + 1).padStart(2, "0")}/${now.getFullYear()}`;
    let workingComment = comment;

    workingComment = workingComment
      .replace(generatedCureLine, (match, date) => date === today ? "" : match)
      .replace(/\n{3,}/g, "\n\n")
      .trimEnd();

    if (nextCure === "noCure") return workingComment.trim();

    const day = String(now.getDate()).padStart(2, "0");
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const year = String(now.getFullYear());
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const cureLabel = {
      firstCure: "1er",
      secondCure: "2eme",
      thirdCure: "3eme",
    }[nextCure];
    const supportsSms = nextCure === "firstCure" || nextCure === "secondCure";
    const smsText = supportsSms && nextSmsEnabled ? " + SMS" : "";
    const cureLine = `${cureLabel} CURE${smsText} fait le ${day}/${month}/${year} à ${hours}:${minutes}h`;

    if (!workingComment) return cureLine;

    const lastLine = workingComment.split(/\n/).filter(Boolean).at(-1) ?? "";
    const isAutomaticCureLine = generatedCureLine.test(lastLine);
    generatedCureLine.lastIndex = 0;

    return `${workingComment}${isAutomaticCureLine ? "\n" : "\n\n"}${cureLine}`;
  };

  const handleCureSelection = (nextCure: typeof cure) => {
    if (isHistoryView) return;

    dispatch(updateField({ field: "cure", value: nextCure }));
    dispatch(
      updateField({
        field: "comment",
        value: buildCureComment(nextCure, smsEnabled),
      }),
    );
  };

  const handleSmsToggle = () => {
    if (isHistoryView) return;

    const nextSmsEnabled = !smsEnabled;
    dispatch(updateField({ field: "smsEnabled", value: nextSmsEnabled }));

    if (cure === "firstCure" || cure === "secondCure") {
      dispatch(
        updateField({
          field: "comment",
          value: buildCureComment(cure, nextSmsEnabled),
        }),
      );
    }
  };

  type AddressConfirmationStatus = "confirmed" | "notConfirmed";

  const confirmedAddressText = "Adresse confirmée";
  const notConfirmedAddressText = "Adresse pas encore confirmée";
  const automaticAddressLine =
    /^(?:Adresse confirmée|Adresse pas encore confirmée)$/;

  const removeAutomaticAddressLines = (value: string) => {
    const lines = value.replace(/\r\n/g, "\n").split("\n");
    const cleanedLines = lines.filter(
      (line) => !automaticAddressLine.test(line.trim()),
    );

    return cleanedLines
      .join("\n")
      .replace(/^\n+/, "")
      .replace(/\n{3,}/g, "\n\n");
  };

  const focusCommentAt = (cursorPosition: number) => {
    window.requestAnimationFrame(() => {
      const textarea = commentInputRef.current;

      if (!textarea) return;

      textarea.focus();
      textarea.setSelectionRange(cursorPosition, cursorPosition);
    });
  };

  const handleAddressConfirmationToggle = (
    nextStatus: AddressConfirmationStatus,
  ) => {
    if (isHistoryView) return;

    const commentWasCompletelyEmpty = comment.length === 0;
    const commentWithoutStatus = removeAutomaticAddressLines(comment);
    const nextAddressConfirmation =
      addressConfirmation === nextStatus ? "none" : nextStatus;

    let nextComment = commentWithoutStatus;

    if (nextAddressConfirmation !== "none") {
      const addressText =
        nextAddressConfirmation === "confirmed"
          ? confirmedAddressText
          : notConfirmedAddressText;

      nextComment = commentWithoutStatus
        ? `${addressText}\n\n${commentWithoutStatus}`
        : `${addressText}\n\n`;
    }

    dispatch(
      updateField({
        field: "addressConfirmation",
        value: nextAddressConfirmation,
      }),
    );
    dispatch(
      updateField({
        field: "comment",
        value: nextComment,
      }),
    );

    if (
      commentWasCompletelyEmpty &&
      nextAddressConfirmation !== "none"
    ) {
      focusCommentAt(nextComment.length);
    }
  };

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

            <div className="card-header__actions">
              {!isHistoryView && (
                <SmartImportDialog onImported={setImportMessage} />
              )}

              <span className="editing-badge">
                {isSearchEdit
                  ? "Modification recherchée"
                  : isHistoryView
                    ? "Historique"
                    : isEditing
                      ? "Modification"
                      : "Création"}
              </span>
            </div>
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

          <div className="cure-selector" aria-label="Sélection CURE">
            <ButtonGroup
              size="small"
              aria-label="Niveau CURE"
              className="cure-selector__buttons"
            >
              {[
                {
                  value: "noCure",
                  icon: VoiceMessageCallX,
                  alt: "Aucun appel",
                },
                {
                  value: "firstCure",
                  icon: VoiceMessageCall1,
                  alt: "Premier appel avec message vocal",
                },
                {
                  value: "secondCure",
                  icon: VoiceMessageCall2,
                  alt: "Deuxième appel avec message vocal",
                },
                {
                  value: "thirdCure",
                  icon: VoiceMessageCall3,
                  alt: "Troisième appel avec message vocal",
                },
              ].map(({ value, icon, alt }) => (
                <Button
                  key={value}
                  type="button"
                  variant={cure === value ? "contained" : "outlined"}
                  className={`cure-selector__button ${
                    cure === value ? "cure-selector__button--active" : ""
                  }`}
                  disabled={isHistoryView}
                  onClick={() => handleCureSelection(value as typeof cure)}
                  sx={{ "& .MuiButton-startIcon": { margin: 0 }, gap: "4px" }}
                  aria-label={
                    value === "noCure"
                      ? "No CURE"
                      : `${value === "firstCure" ? "1er" : value === "secondCure" ? "2ème" : "3ème"} CURE`
                  }
                >
                  <img
                    src={icon}
                    alt={alt}
                    className="cure-selector__image"
                    draggable={false}
                  />
                </Button>
              ))}
            </ButtonGroup>
            <Button
              type="button"
              variant={smsEnabled ? "contained" : "outlined"}
              className={`sms-toggle-button ${
                smsEnabled ? "sms-toggle-button--active" : ""
              }`}
              disabled={isHistoryView}
              onClick={handleSmsToggle}
              aria-pressed={smsEnabled}
            >
              +SMS
            </Button>

            <div className="address-confirmation-controls" aria-label="Confirmation de l’adresse">
              <button
                type="button"
                className={`address-confirmation-button ${
                  addressConfirmation === "confirmed"
                    ? "address-confirmation-button--active"
                    : ""
                }`}
                disabled={isHistoryView}
                onClick={() => handleAddressConfirmationToggle("confirmed")}
                aria-label="Adresse confirmée"
                aria-pressed={addressConfirmation === "confirmed"}
                title="Adresse confirmée"
              >
                <span className="address-confirmation-icon-stack" aria-hidden="true">
                  <AddressConfirmedOffIcon
                    className={`address-confirmation-icon address-confirmation-icon--off ${
                      addressConfirmation === "confirmed"
                        ? "address-confirmation-icon--hidden"
                        : "address-confirmation-icon--visible"
                    }`}
                  />
                  <AddressConfirmedIcon
                    className={`address-confirmation-icon address-confirmation-icon--on ${
                      addressConfirmation === "confirmed"
                        ? "address-confirmation-icon--visible"
                        : "address-confirmation-icon--hidden"
                    }`}
                  />
                </span>
              </button>

              <button
                type="button"
                className={`address-confirmation-button ${
                  addressConfirmation === "notConfirmed"
                    ? "address-confirmation-button--active"
                    : ""
                }`}
                disabled={isHistoryView}
                onClick={() => handleAddressConfirmationToggle("notConfirmed")}
                aria-label="Adresse pas encore confirmée"
                aria-pressed={addressConfirmation === "notConfirmed"}
                title="Adresse pas encore confirmée"
              >
                <span className="address-confirmation-icon-stack" aria-hidden="true">
                  <AddressNotConfirmedOffIcon
                    className={`address-confirmation-icon address-confirmation-icon--off ${
                      addressConfirmation === "notConfirmed"
                        ? "address-confirmation-icon--hidden"
                        : "address-confirmation-icon--visible"
                    }`}
                  />
                  <AddressNotConfirmedIcon
                    className={`address-confirmation-icon address-confirmation-icon--on ${
                      addressConfirmation === "notConfirmed"
                        ? "address-confirmation-icon--visible"
                        : "address-confirmation-icon--hidden"
                    }`}
                  />
                </span>
              </button>
            </div>
          </div>

          <div className="comment-field copy-field">
            <TextField
              label="Commentaire"
              value={comment}
              inputRef={commentInputRef}
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
                  fontWeight: "400 !important",
                },
                "& .MuiInputBase-inputMultiline": {
                  fontWeight: "400 !important",
                },
              }}
            />

            <CopyButton
              value={comment}
              label="Commentaire"
            />

            <NpsCopyButton
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
            <strong>
              Brouillon
              <br />
              en cours
            </strong>
            <small>
              Reprendre
              <br />
              la saisie
            </small>
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
                <div><dt>CURE</dt><dd>{revision.snapshot.cure || "noCure"}</dd></div>
                <div><dt>+SMS</dt><dd>{revision.snapshot.smsEnabled ? "ON" : "OFF"}</dd></div>
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
    
      <Snackbar
        open={Boolean(importMessage)}
        autoHideDuration={4200}
        onClose={() => setImportMessage("")}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={importMessage.startsWith("Aucune") ? "warning" : "success"}
          variant="filled"
          onClose={() => setImportMessage("")}
        >
          {importMessage}
        </Alert>
      </Snackbar>
</main>
  );
};

export default CurrentInterventionPage;