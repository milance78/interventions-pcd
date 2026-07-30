import * as React from "react";

import AddTaskRounded from "@mui/icons-material/AddTaskRounded";
import DeleteSweepRounded from "@mui/icons-material/DeleteSweepRounded";
import HistoryRounded from "@mui/icons-material/HistoryRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import CallRounded from "@mui/icons-material/CallRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import PhoneInTalkRounded from "@mui/icons-material/PhoneInTalkRounded";
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
import { isSameLogicalIntervention } from "../../utils/interventionIdentity";

import "./CurrentInterventionPage.scss";

import AdditionalInformationDialog from "../../components/additionalInformationDialog/AdditionalInformationDialog";
import BooleanInput from "../../components/currentIntervention/booleanInput/BooleanInput";
import ClientsOnAddress from "../../components/currentIntervention/clientsOnAddress/ClientsOnAddress";
import InfrastructureInput from "../../components/currentIntervention/infrastructureInput/InfrastructureInput";
import InputsAll from "../../components/currentIntervention/inputsAll/InputsAll";
import NetworkInput from "../../components/currentIntervention/networkInput/NetworkInput";
import SimpleInput from "../../components/currentIntervention/simpleInput/SimpleInput";
import StatusInput from "../../components/currentIntervention/status/StatusInput";
import SmartImportDialog from "../../components/smartImportDialog/SmartImportDialog";

import {
  cancelDraft,
  clearCurrentForm,
  clearTask,
  hasMeaningfulDraft,
  markSearchInterventionSaved,
  resumeDraft,
  recordCure,
  updateField,
  updateRecordedCureSms,
} from "../../redux/features/newInterventionSlice";
import {
  useAppDispatch,
  useAppSelector,
} from "../../redux/store";
import { createInterventionThunk } from "../../redux/thunks/createInterventionThunk";
import { updateInterventionThunk } from "../../redux/thunks/updateInterventionThunk";
import { clearTodaysCuresThunk } from "../../redux/thunks/clearTodaysCuresThunk";
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
import { ReactComponent as SnowSentPendingIcon } from "../../assets/svg/Snow sent pending.svg.tsx";
import { ReactComponent as SnowReceivedPendingIcon } from "../../assets/svg/Snow received pending.svg.tsx";
import { ReactComponent as NpsCopyIcon } from "../../assets/svg/NPS copy.svg.tsx";
import { ReactComponent as CopyIcon } from "../../assets/svg/Copy.svg.tsx";
import CommentCopyActions from "../../components/commentCopyActions/CommentCopyActions";
import { normalizeInterventionStrings, trimLeadingHorizontalWhitespace } from "../../utils/textUtils";
import VoiceMessageCall1 from "../../assets/icons/VoiceMessageCall1.png";
import VoiceMessageCall2 from "../../assets/icons/VoiceMessageCall2.png";

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
  const historyInterventions = useAppSelector(
    (state) => state.history.interventions,
  );
  const todayInterventions = useAppSelector(
    (state) => state.interventionsList,
  );

  const {
    clientName,
    comment,
    additionalInformation,
    cure,
    smsEnabled,
    isSnowReceivedPending,
    isSnowSentPending,
    isResPending,
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


  const handleCureSelection = (nextCure: typeof cure) => {
    if (isHistoryView) return;

    if (nextCure === "noCure") {
      void dispatch(clearTodaysCuresThunk());
      return;
    }

    dispatch(
      recordCure({
        cure: nextCure,
        recordedAt: new Date().toISOString(),
        smsEnabled,
      }),
    );

    dispatch(
      updateField({
        field: "addressConfirmation",
        value: "notConfirmed",
      }),
    );
  };

  const handleSmsToggle = () => {
    if (isHistoryView) return;

    const nextSmsEnabled = !smsEnabled;
    dispatch(updateField({ field: "smsEnabled", value: nextSmsEnabled }));

    if (cure === "firstCure" || cure === "secondCure") {
      dispatch(
        updateRecordedCureSms({
          cure,
          smsEnabled: nextSmsEnabled,
        }),
      );
    }
  };

  type AddressConfirmationStatus = "confirmed" | "notConfirmed";

  const confirmedAddressText = "Adresse confirmée.";
  const notConfirmedAddressText = "Adresse pas encore confirmée.";
  const automaticAddressLine =
    /^(?:Adresse confirmée\.?|Adresse pas encore confirmée\.?)$/;

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

    if (nextAddressConfirmation === "confirmed") {
      dispatch(updateField({ field: "cure", value: "noCure" }));
      dispatch(updateField({ field: "smsEnabled", value: false }));
      dispatch(updateField({ field: "isSnowReceivedPending", value: false }));
      dispatch(updateField({ field: "isSnowSentPending", value: false }));
      dispatch(updateField({ field: "isSnow", value: false }));
    }
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
    const normalized = normalizeInterventionStrings(newIntervention);
    const formIsCompletelyEmpty = !hasMeaningfulDraft(normalized);
    const safePayload =
      isEditing && formIsCompletelyEmpty && newIntervention.editSnapshot
        ? {
            ...newIntervention,
            ...newIntervention.editSnapshot,
          }
        : normalized;

    const result = isEditing
      ? await dispatch(updateInterventionThunk(safePayload))
      : await dispatch(createInterventionThunk(safePayload));

    const requestFailed =
      createInterventionThunk.rejected.match(result) ||
      updateInterventionThunk.rejected.match(result);

    if (requestFailed) {
      const message =
        typeof result.payload === "string"
          ? result.payload
          : result.error.message ||
            "L'intervention n'a pas pu être enregistrée.";

      window.alert(message);
      return;
    }

    const isRetrievedIntervention =
      mode === "SEARCH_EDIT" || mode === "HISTORY_EDIT";

    if (isRetrievedIntervention) {
      if (mode === "SEARCH_EDIT") {
        const isAlreadyInToday = todayInterventions.some((item) =>
          isSameLogicalIntervention(item, newIntervention),
        );

        if (isAlreadyInToday) {
          navigate("/liste-du-jour");
          return;
        }

        const normalizedInterventionId =
          newIntervention.interventionId.trim().toLowerCase();
        const normalizedOagId =
          newIntervention.oagID.trim().toLowerCase();

        const latestDate = historyInterventions
          .filter((item) => {
            if (
              normalizedInterventionId &&
              item.interventionId.trim().toLowerCase() ===
                normalizedInterventionId
            ) {
              return true;
            }

            return Boolean(
              normalizedOagId &&
                item.oagID.trim().toLowerCase() === normalizedOagId,
            );
          })
          .map((item) => item.dateKey ?? "")
          .filter(Boolean)
          .sort((a, b) => b.localeCompare(a))[0];

        if (latestDate) {
          window.sessionStorage.setItem(
            "history:pending-date",
            latestDate,
          );
        }
      }

      navigate("/historique");
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
    if (mode !== "SEARCH_EDIT" && mode !== "HISTORY_EDIT") return;

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
    navigate("/liste-du-jour");
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
    dispatch(clearCurrentForm());
    setClearDialogOpen(false);
  };

  const handleResumeDraft = () => {
    dispatch(resumeDraft());
  };

  const handleCancelDraft = () => {
    dispatch(cancelDraft());
  };

  const isNewOrDraft = mode === "NEW" || mode === "DRAFT";
  const isSearchEdit = mode === "SEARCH_EDIT";
  const isHistoryEdit = mode === "HISTORY_EDIT";
  const isRetrievedEdit = isSearchEdit || isHistoryEdit;

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
                : isHistoryEdit
                  ? "Intervention de l'historique"
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
                  : isHistoryEdit
                    ? "Modification historique"
                    : isHistoryView
                      ? "Historique"
                      : isEditing
                        ? "Modification"
                        : "Création"}
              </span>
            </div>
          </header>

          <section className="intervention-core-fields">
            <InfrastructureInput />
            <NetworkInput />

            <SimpleInput
              field="interventionId"
              label="ID de l'intervention"
              inputType="type2"
              className="simple-input--core-field"
            />

            <SimpleInput
              field="oagID"
              label="OAG ID"
              inputType="type2"
              className="simple-input--core-field"
            />
          </section>

          <div className="technical-inputs">
            <InputsAll />
          </div>

          <section className="intervention-options">
            <div className="boolean-inputs-row">
              <div className="intervention-option-group intervention-option-group--actions">
                <span className="intervention-option-group__label">
                  Actions
                </span>

                <div className="intervention-option-group__items">
                  <div className="option-button">
                    <BooleanInput
                      field="isUnclear"
                      label="Question à poser à l'M&P ?"
                      trueIcon={<QuestionMarkOnIcon />}
                      falseIcon={<QuestionMarkOffIcon />}
                    />
                  </div>

                  <div className="option-button">
                    <BooleanInput
                      field="isGoodExample"
                      label="Bon exemple à retenir ?"
                      trueIcon={<LightBulbOnIcon />}
                      falseIcon={<LightBulbOffIcon />}
                    />
                  </div>

                  <div className="option-button option-button--res">
                    <button
                      type="button"
                      className={`res-pending-button ${
                        isResPending ? "res-pending-button--active" : ""
                      }`}
                      onClick={() =>
                        dispatch(
                          updateField({
                            field: "isResPending",
                            value: !isResPending,
                          }),
                        )
                      }
                      aria-label="Résiliation en attente"
                      title="Résiliation en attente"
                      aria-pressed={isResPending}
                      disabled={isHistoryView}
                    >
                      RES
                    </button>
                  </div>
                </div>
              </div>

              <div className="intervention-option-group intervention-option-group--states">
                <span className="intervention-option-group__label">
                  États en attente
                </span>

                <div className="intervention-option-group__items">
                  <div
                    className={`option-button snow-pending-card ${
                      isSnowReceivedPending
                        ? "snow-pending-card--filled"
                        : "snow-pending-card--empty"
                    }`}
                    aria-label="Snow reçu en attente"
                    title="Snow reçu en attente"
                  >
                    {isSnowReceivedPending && (
                      <SnowReceivedPendingIcon className="snow-pending-card__icon" />
                    )}
                  </div>



                  <div
                    className={`option-button snow-pending-card ${
                      isSnowSentPending
                        ? "snow-pending-card--filled"
                        : "snow-pending-card--empty"
                    }`}
                    aria-label="Snow envoyé en attente"
                    title="Snow envoyé en attente"
                  >
                    {isSnowSentPending && (
                      <SnowSentPendingIcon className="snow-pending-card__icon" />
                    )}
                  </div>

                  <div
                    className={`option-button cure-summary-card ${
                      cure === "firstCure" || cure === "secondCure"
                        ? "cure-summary-card--filled"
                        : "cure-summary-card--empty"
                    }`}
                    aria-live="polite"
                    aria-label={
                      cure === "firstCure"
                        ? "CURE 1"
                        : cure === "secondCure"
                          ? "CURE 2"
                          : "Emplacement CURE vide"
                    }
                  >
                    {(cure === "firstCure" || cure === "secondCure") && (
                      <img
                        src={
                          cure === "firstCure"
                            ? VoiceMessageCall1
                            : VoiceMessageCall2
                        }
                        alt=""
                        aria-hidden="true"
                        className="cure-summary-card__icon"
                        draggable={false}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </section>

        <section className="intervention-card right-card">
          <div className="client-name-field copy-field">
            <TextField
              variant="standard"
              label="Nom du client"
              value={clientName}
              onChange={(event) =>
                dispatch(
                  updateField({
                    field: "clientName",
                    value:
                      trimLeadingHorizontalWhitespace(event.target.value),
                  }),
                )
              }
              onBlur={() =>
                dispatch(
                  updateField({
                    field: "clientName",
                    value: clientName.trim(),
                  }),
                )
              }
              fullWidth
              disabled={isHistoryView}
              sx={{
                "& .MuiInputBase-input": {
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
                  label: (
                    <span className="no-cure-phone-icon" aria-hidden="true">
                      <CallRounded className="no-cure-phone-icon__phone" />
                      <CloseRounded className="no-cure-phone-icon__cross" />
                    </span>
                  ),
                },
                {
                  value: "firstCure",
                  label: (
                    <>
                      <span>1.</span>
                      <PhoneInTalkRounded sx={{ fontSize: 18 }} />
                    </>
                  ),
                },
                {
                  value: "secondCure",
                  label: (
                    <>
                      <span>2.</span>
                      <PhoneInTalkRounded sx={{ fontSize: 18 }} />
                    </>
                  ),
                },
                {
                  value: "thirdCure",
                  label: (
                    <>
                      <span>3.</span>
                      <PhoneInTalkRounded sx={{ fontSize: 18 }} />
                    </>
                  ),
                },
              ].map(({ value, label }) => (
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
                  {label}
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
                      trimLeadingHorizontalWhitespace(event.target.value),
                  }),
                )
              }
              onBlur={() =>
                dispatch(updateField({ field: "comment", value: comment.trim() }))
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

            <CommentCopyActions
              value={comment}
              showWct
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
              {isRetrievedEdit ? (
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

                  <Button
                    variant="text"
                    size="large"
                    onClick={() => setClearDialogOpen(true)}
                    startIcon={<DeleteSweepRounded />}
                    className="clear-form-button"
                  >
                    Effacer le formulaire
                  </Button>

                  <Button
                    variant="contained"
                    size="large"
                    onClick={submitActions}
                    startIcon={<Send />}
                    className="submit-intervention-button"
                  >
                    Enregistrer
                  </Button>

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
                </>
              ) : isHistoryView ? (
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
                </>
              ) : (
                <>
                  <Button
                    variant="text"
                    size="large"
                    onClick={() => setClearDialogOpen(true)}
                    startIcon={<DeleteSweepRounded />}
                    className="clear-form-button"
                  >
                    Effacer le formulaire
                  </Button>

                  <Button
                    variant={isNewOrDraft ? "outlined" : "contained"}
                    size="large"
                    onClick={submitActions}
                    startIcon={
                      isNewOrDraft ? <AddTaskRounded /> : <Send />
                    }
                    className={
                      isNewOrDraft
                        ? "add-to-today-button add-to-today-button--history"
                        : "submit-intervention-button"
                    }
                  >
                    {isNewOrDraft ? (
                      <span className="add-to-today-button__label">
                        <span>Ajouter à la</span>
                        <span>liste du jour</span>
                      </span>
                    ) : (
                      "Enregistrer"
                    )}
                  </Button>
                </>
              )}
            </div>
          </footer>
        </section>
      </div>

      {hasDraft && mode !== "NEW" && mode !== "DRAFT" && (
        <div className="floating-draft-reminder">
          <WarningAmberRounded />
          <span>
            <strong>Brouillon en cours</strong>
            <small>Une saisie non enregistrée est disponible.</small>
          </span>
          <div className="floating-draft-reminder__actions">
            <button type="button" onClick={handleResumeDraft}>
              Reprendre
            </button>
            <button
              type="button"
              className="floating-draft-reminder__cancel"
              onClick={handleCancelDraft}
            >
              Annuler brouillon
            </button>
          </div>
        </div>
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
            Le formulaire affiché sera vidé. Cette action ne supprime jamais l’intervention des listes.
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