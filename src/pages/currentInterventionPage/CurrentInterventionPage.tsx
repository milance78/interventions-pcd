import * as React from "react";

import AddTaskRounded from "@mui/icons-material/AddTaskRounded";
import DeleteSweepRounded from "@mui/icons-material/DeleteSweepRounded";
import HistoryRounded from "@mui/icons-material/HistoryRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import PhoneInTalkRounded from "@mui/icons-material/PhoneInTalkRounded";
import MailOutlineRounded from "@mui/icons-material/MailOutlineRounded";
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
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import { useLocation, useNavigate } from "react-router-dom";
import { isSameLogicalIntervention } from "../../utils/interventionIdentity";

import "./CurrentInterventionPage.scss";

import AdditionalInformationDialog from "../../components/additionalInformationDialog/AdditionalInformationDialog";
import BooleanInput from "../../components/currentIntervention/booleanInput/BooleanInput";
import ClientsOnAddress from "../../components/currentIntervention/clientsOnAddress/ClientsOnAddress";
import InfrastructureInput from "../../components/currentIntervention/infrastructureInput/InfrastructureInput";
import InputsAll from "../../components/currentIntervention/inputsAll/InputsAll";
import NetworkInput from "../../components/currentIntervention/networkInput/NetworkInput";
import StatusInput from "../../components/currentIntervention/status/StatusInput";
import SnowStatusInput from "../../components/currentIntervention/snowStatusInput/SnowStatusInput";
import SmartImportDialog from "../../components/smartImportDialog/SmartImportDialog";

import {
  cancelDraft,
  clearCurrentForm,
  clearTask,
  hasMeaningfulDraft,
  isSameInterventionData,
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

import AddressConfirmedArtwork from "../../assets/svg/Address confirmed.png";
import AddressNotConfirmedArtwork from "../../assets/svg/Address not confirmed.png";
import AddressNotConfirmedOffArtwork from "../../assets/svg/Address not confirmed off.png";
import { ReactComponent as LightBulbOffIcon } from "../../assets/svg/Light bulb off.svg.tsx";
import { ReactComponent as LightBulbOnIcon } from "../../assets/svg/Light bulb on.svg.tsx";
import { ReactComponent as CopyIcon } from "../../assets/svg/Copy.svg.tsx";
import { ReactComponent as SnowOnIcon } from "../../assets/svg/Snow on.svg.tsx";
import { ReactComponent as SnowOffIcon } from "../../assets/svg/Snow off.svg.tsx";
import snowBoardLeft from "../../assets/snow/snow-board-left.png";
import snowBoardRight from "../../assets/snow/snow-board-right.png";
import snowBoardLeftOff from "../../assets/snow/snow-board-left-off.png";
import snowBoardRightOff from "../../assets/snow/snow-board-right-off.png";
import CommentCopyActions from "../../components/commentCopyActions/CommentCopyActions";
import { normalizeInterventionStrings, removeBlankLines, trimLeadingHorizontalWhitespace } from "../../utils/textUtils";
import { normalizePersonName } from "../../utils/addressClients";
import { cureOrder, localDateKey } from "../../utils/cureRecords";
import VoiceMessageCall1 from "../../assets/icons/VoiceMessageCall1.png";
import VoiceMessageCall2 from "../../assets/icons/VoiceMessageCall2.png";
import VoiceMessageCall3 from "../../assets/icons/VoiceMessageCall3.png";
import CableCutOn from "../../assets/icons/CableCutOn.png";
import CableCutOff from "../../assets/icons/CableCutOff.png";
import QuestionActionOn from "../../assets/icons/QuestionActionOn.png";
import QuestionActionOff from "../../assets/icons/QuestionActionOff.png";

const ON_HOLD_EDIT_CONTEXT_KEY = "on-hold:edit-context";
const PENDING_TAB_KEY = "on-hold:pending-tab";
const SMART_IMPORT_AUTO_OPEN_KEY = "smart-import:auto-open";

type OnHoldEditContext = {
  tab: "cure" | "res" | "snowReceived" | "snowSent" | "questions" | "other";
  anchor: string;
  documentId: string;
  dateKey: string;
  scrollTop: number;
};

const getLocalDateKey = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
};

const readOnHoldEditContext = (): OnHoldEditContext | null => {
  try {
    const raw = window.sessionStorage.getItem(ON_HOLD_EDIT_CONTEXT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<OnHoldEditContext>;
    const tab =
      parsed.tab === "cure" ||
      parsed.tab === "res" ||
      parsed.tab === "snowReceived" ||
      parsed.tab === "snowSent" ||
      parsed.tab === "questions" ||
      parsed.tab === "other"
        ? parsed.tab
        : null;

    return tab &&
      typeof parsed.anchor === "string" &&
      typeof parsed.documentId === "string" &&
      typeof parsed.dateKey === "string"
      ? {
          tab,
          anchor: parsed.anchor,
          documentId: parsed.documentId,
          dateKey: parsed.dateKey,
          scrollTop:
            typeof parsed.scrollTop === "number" && Number.isFinite(parsed.scrollTop)
              ? parsed.scrollTop
              : 0,
        }
      : null;
  } catch {
    return null;
  }
};

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

    await writeTextToClipboard(removeBlankLines(value));

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
      placement="left"
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
          {copied ? <CheckRounded fontSize="small" /> : <strong className="nps-copy-button__label">NPS</strong>}
        </IconButton>
      </span>
    </Tooltip>
  );
};


type SnowTrailIconProps = {
  direction: "left" | "right";
  active: boolean;
};

const SnowTrailIcon = ({ direction, active }: SnowTrailIconProps) => (
  <span
    className={`snow-trail-icon snow-trail-icon--${direction} ${
      active ? "snow-trail-icon--active" : "snow-trail-icon--off"
    }`}
    aria-hidden="true"
  >
    {active ? (
      <SnowOnIcon className="snow-trail-icon__flake-svg" />
    ) : (
      <SnowOffIcon className="snow-trail-icon__flake-svg" />
    )}
    <img
      src={active ? (direction === "left" ? snowBoardLeft : snowBoardRight) : (direction === "left" ? snowBoardLeftOff : snowBoardRightOff)}
      alt=""
      className="snow-trail-icon__wood-board"
      draggable={false}
    />
  </span>
);

const CurrentInterventionPage = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

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
    cureRecords,
    smsEnabled,
    isSnowReceivedPending,
    isSnowSentPending,
    isResPending,
    addressClients,
    infrastructure,
    addressConfirmation,
    isEditing,
    isHistoryView,
    hasDraft,
    mode,
    snowReceived,
    snowStatus,
    postponedDate,
  } = newIntervention;

  const isDisplayedDraft = Boolean(
    newIntervention.hasDraft &&
      newIntervention.draftSnapshot &&
      isSameInterventionData(newIntervention, newIntervention.draftSnapshot),
  );

  const [clearDialogOpen, setClearDialogOpen] = React.useState(false);
  const [historyDialogOpen, setHistoryDialogOpen] = React.useState(false);
  const [revisionsLoading, setRevisionsLoading] = React.useState(false);
  const [revisions, setRevisions] = React.useState<InterventionRevision[]>([]);
  const [revisionsError, setRevisionsError] = React.useState("");
  const [importMessage, setImportMessage] = React.useState("");
  const [actionNotice, setActionNotice] = React.useState<{
    key: "question" | "example" | "res" | "snowReceived" | "snowSent" | "cure" | "address";
    text: string;
  } | null>(null);
  const actionNoticeTimerRef = React.useRef<number | null>(null);
  const commentInputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [resClientDialogOpen, setResClientDialogOpen] = React.useState(false);
  const [resEligibleClients, setResEligibleClients] = React.useState<typeof addressClients>([]);
  window.sessionStorage.removeItem(SMART_IMPORT_AUTO_OPEN_KEY);
  const routeState = location.state as { autoOpenSmartImport?: boolean } | null;
  const autoOpenSmartImport = routeState?.autoOpenSmartImport === true;

  React.useEffect(() => {
    if (autoOpenSmartImport) {
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [autoOpenSmartImport, location.pathname, navigate]);
  const [onHoldEditContext] = React.useState<OnHoldEditContext | null>(() => {
    const context = readOnHoldEditContext();
    window.sessionStorage.removeItem(ON_HOLD_EDIT_CONTEXT_KEY);
    return context;
  });
  const isOpenedFromOnHold = Boolean(
    onHoldEditContext &&
      onHoldEditContext.documentId === newIntervention.documentId &&
      onHoldEditContext.dateKey === (newIntervention.dateKey ?? ""),
  );
  const isOpenedFromReviewableOnHold = Boolean(
    isOpenedFromOnHold &&
      onHoldEditContext &&
      ["res", "snowReceived", "snowSent", "other"].includes(onHoldEditContext.tab),
  );

  const showActionNotice = (
    key: "question" | "example" | "res" | "snowReceived" | "snowSent" | "cure" | "address",
    text: string,
  ) => {
    if (actionNoticeTimerRef.current !== null) {
      window.clearTimeout(actionNoticeTimerRef.current);
    }

    setActionNotice({ key, text });
    actionNoticeTimerRef.current = window.setTimeout(() => {
      setActionNotice(null);
      actionNoticeTimerRef.current = null;
    }, 1500);
  };

  React.useEffect(
    () => () => {
      if (actionNoticeTimerRef.current !== null) {
        window.clearTimeout(actionNoticeTimerRef.current);
      }
    },
    [],
  );

  React.useEffect(() => {
    const handleSnowPendingActivated = (event: Event) => {
      const pendingField = (event as CustomEvent<{ pendingField?: string }>).detail?.pendingField;
      if (pendingField === "isSnowReceivedPending") {
        showActionNotice("snowReceived", "Snow à mon nom en attente");
      } else if (pendingField === "isSnowSentPending") {
        showActionNotice("snowSent", "Snow créé en attente");
      }
    };

    window.addEventListener("snow-pending-activated", handleSnowPendingActivated);
    return () => window.removeEventListener("snow-pending-activated", handleSnowPendingActivated);
  }, []);

  const removeAutomaticResLine = (value: string) =>
    value
      .replace(/(?:^|\n\n?)RES en attente(?::|,)?[^\n]*/gi, "")
      .replace(/^\n+|\n+$/g, "")
      .replace(/\n{3,}/g, "\n\n");

  const buildResPendingLine = (client: (typeof addressClients)[number]) => {
    const parts: string[] = [];
    if (client.fullName.trim()) {
      parts.push(`client ${client.fullName.trim()}`);
    }
    const isCopperTechnology = /^(?:copper|cuivre)$/i.test(infrastructure.trim());
    const identifier = isCopperTechnology ? client.na.trim() : client.utac.trim();
    if (identifier) {
      parts.push(`${isCopperTechnology ? "NA" : "UTAC"} ${identifier}`);
    }
    return `RES en attente${parts.length ? `: ${parts.join(", ")}` : ""}`;
  };

  const activateResForClient = (client: (typeof addressClients)[number] | null) => {
    const cleaned = removeAutomaticResLine(comment);
    const resLine = client ? buildResPendingLine(client) : "RES en attente";
    const nextComment = cleaned ? `${cleaned}\n\n${resLine}` : resLine;
    dispatch(updateField({ field: "comment", value: nextComment }));
    dispatch(updateField({ field: "isResPending", value: true }));
    showActionNotice("res", "Résiliation en attente");
  };

  const handleResPendingToggle = () => {
    if (isHistoryView) return;

    if (isResPending) {
      dispatch(updateField({ field: "isResPending", value: false }));
      const cleaned = removeAutomaticResLine(comment);
      if (cleaned !== comment) {
        dispatch(updateField({ field: "comment", value: cleaned }));
      }
      return;
    }

    const eligible = addressClients.filter(
      (client) => !client.isFuture && !client.isSameClient,
    );

    if (eligible.length === 0) {
      activateResForClient(null);
      return;
    }

    if (eligible.length === 1) {
      activateResForClient(eligible[0]);
      return;
    }

    setResEligibleClients(eligible);
    setResClientDialogOpen(true);
  };

  const todayKeyForCure = localDateKey(new Date());
  const todaysCureKey = cureOrder.find(
    (key) => cureRecords[key]?.date === todayKeyForCure,
  ) ?? null;
  const nextCureKey = cureOrder.find((key) => !cureRecords[key]) ?? null;
  const pendingCureKey = todaysCureKey ?? nextCureKey ?? null;
  const todaysCureRecord = todaysCureKey ? cureRecords[todaysCureKey] : null;
  const cureCycleState: "off" | "sms" | "noSms" = !todaysCureKey
    ? "off"
    : todaysCureRecord?.smsEnabled
      ? "sms"
      : "noSms";
  const isUnifiedCureActive = cureCycleState !== "off";

  const handleUnifiedCureToggle = () => {
    if (isHistoryView) return;

    // CURE and address confirmation are strictly independent controls.
    // Preserve the exact address state that existed before this CURE click.
    const addressStateBeforeCure = addressConfirmation;
    const preserveAddressState = () => {
      dispatch(
        updateField({
          field: "addressConfirmation",
          value: addressStateBeforeCure,
        }),
      );
    };

    // OFF -> CURE + SMS
    if (!todaysCureKey) {
      if (!nextCureKey) {
        showActionNotice("cure", "3 CURE déjà enregistrés");
        return;
      }

      dispatch(updateField({ field: "smsEnabled", value: true }));
      dispatch(
        recordCure({
          cure: nextCureKey,
          recordedAt: new Date().toISOString(),
          smsEnabled: true,
        }),
      );
      preserveAddressState();
      showActionNotice(
        "cure",
        nextCureKey === "firstCure"
          ? "CURE 1 + SMS en attente"
          : nextCureKey === "secondCure"
            ? "CURE 2 + SMS en attente"
            : "CURE 3 + SMS",
      );
      return;
    }

    // CURE + SMS -> CURE without SMS, preserving today's date/time record.
    if (todaysCureRecord?.smsEnabled) {
      dispatch(updateField({ field: "smsEnabled", value: false }));
      dispatch(
        updateRecordedCureSms({
          cure: todaysCureKey,
          smsEnabled: false,
        }),
      );
      preserveAddressState();
      showActionNotice(
        "cure",
        todaysCureKey === "firstCure"
          ? "CURE 1 en attente"
          : todaysCureKey === "secondCure"
            ? "CURE 2 en attente"
            : "CURE 3",
      );
      return;
    }

    // CURE without SMS -> OFF. clearTodaysCuresThunk only removes records
    // belonging to today; all previous dates remain immutable.
    dispatch(updateField({ field: "smsEnabled", value: false }));
    void dispatch(clearTodaysCuresThunk());
    preserveAddressState();
  };

  const toggleSnowPending = (
    field: "isSnowReceivedPending" | "isSnowSentPending",
  ) => {
    if (isHistoryView) return;
    const current = field === "isSnowReceivedPending"
      ? isSnowReceivedPending
      : isSnowSentPending;
    const next = !current;
    dispatch(updateField({ field, value: next }));
    if (next) {
      showActionNotice(
        field === "isSnowReceivedPending" ? "snowReceived" : "snowSent",
        field === "isSnowReceivedPending"
          ? "Snow à mon nom en attente"
          : "Snow créé en attente",
      );
    }
  };


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

  const handleAddressConfirmationCycle = () => {
    if (isHistoryView) return;

    const nextAddressConfirmation =
      addressConfirmation === "none"
        ? "notConfirmed"
        : addressConfirmation === "notConfirmed"
          ? "confirmed"
          : "none";
    const commentWasCompletelyEmpty = comment.length === 0;
    const commentWithoutStatus = removeAutomaticAddressLines(comment);
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

    dispatch(updateField({ field: "addressConfirmation", value: nextAddressConfirmation }));

    if (nextAddressConfirmation === "notConfirmed") {
      showActionNotice("address", "Adresse pas encore confirmée");
    } else if (nextAddressConfirmation === "confirmed") {
      showActionNotice("address", "Adresse confirmée");
    }

    if (nextAddressConfirmation === "confirmed") {
      dispatch(updateField({ field: "cure", value: "noCure" }));
      dispatch(updateField({ field: "smsEnabled", value: false }));
    }

    dispatch(updateField({ field: "comment", value: nextComment }));

    if (commentWasCompletelyEmpty && nextAddressConfirmation !== "none") {
      focusCommentAt(nextComment.length);
    }
  };

  const applyOnHoldConsultationState = (
    payload: typeof newIntervention,
    context: OnHoldEditContext,
  ) => {
    const completed = payload.status === "completed" || payload.status === "transferred";
    const onHold = payload.status === "on hold";
    const today = getLocalDateKey();

    if (completed) {
      // Once an intervention opened from En attente is completed/transferred,
      // it must disappear from every En attente section, not only the tab it
      // came from.
      return {
        ...payload,
        cure: "noCure" as const,
        curePendingSince: null,
        isSnowReceivedPending: false,
        isSnowSentPending: false,
        isSnow: false,
        isResPending: false,
        isUnclear: false,
        ...(context.tab === "res" ? { resReviewedDate: today } : {}),
        ...(context.tab === "snowReceived" ? { snowReceivedReviewedDate: today } : {}),
        ...(context.tab === "snowSent" ? { snowSentReviewedDate: today } : {}),
        ...(context.tab === "other" ? { otherReviewedDate: today } : {}),
        ...(context.tab === "cure" ? { cureReviewedDate: today } : {}),
        ...(context.tab === "questions" ? { questionReviewedDate: today } : {}),
      };
    }

    if (context.tab === "res") {
      return onHold ? { ...payload, isResPending: true, resReviewedDate: today } : payload;
    }

    if (context.tab === "snowReceived") {
      if (!onHold) return payload;
      const next = { ...payload, isSnowReceivedPending: true, isSnow: true, snowReceivedReviewedDate: today };
      // The intervention can sit on both Snow lists at once; reviewing it from
      // either tab must stamp "Revu aujourd'hui" on both.
      if (payload.isSnowSentPending) next.snowSentReviewedDate = today;
      return next;
    }

    if (context.tab === "snowSent") {
      if (!onHold) return payload;
      const next = { ...payload, isSnowSentPending: true, isSnow: true, snowSentReviewedDate: today };
      if (payload.isSnowReceivedPending) next.snowReceivedReviewedDate = today;
      return next;
    }

    if (context.tab === "cure") {
      return onHold ? { ...payload, cureReviewedDate: today } : payload;
    }

    if (context.tab === "questions") {
      return onHold ? { ...payload, isUnclear: true, questionReviewedDate: today } : payload;
    }

    return { ...payload, otherReviewedDate: today };
  };

  const submitActions = async () => {
    const normalized = normalizeInterventionStrings(newIntervention);
    const formIsCompletelyEmpty = !hasMeaningfulDraft(normalized);
    let safePayload =
      isEditing && formIsCompletelyEmpty && newIntervention.editSnapshot
        ? {
            ...newIntervention,
            ...newIntervention.editSnapshot,
          }
        : normalized;

    if (isOpenedFromOnHold && onHoldEditContext) {
      safePayload = applyOnHoldConsultationState(
        safePayload,
        onHoldEditContext,
      );
    }

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

    if (isOpenedFromOnHold && onHoldEditContext) {
      window.sessionStorage.removeItem(ON_HOLD_EDIT_CONTEXT_KEY);
      window.sessionStorage.setItem(PENDING_TAB_KEY, onHoldEditContext.tab);
      window.sessionStorage.setItem("scroll:on-hold", String(onHoldEditContext.scrollTop));
      navigate("/en-attente");
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

    if (isEditing && hasDraft && !isDisplayedDraft) {
      dispatch(resumeDraft());
    } else {
      dispatch(clearTask());
    }

    navigate("/liste-du-jour");
  };

  const addToTodayList = async () => {
    if (mode !== "SEARCH_EDIT" && mode !== "HISTORY_EDIT") return;

    // When an intervention comes from En attente, adding it to today's list is
    // also an explicit review: it stays in the same pending section (if status
    // remains En attente) and receives the Revu aujourd'hui marker.
    const payload =
      isOpenedFromOnHold && onHoldEditContext
        ? applyOnHoldConsultationState(newIntervention, onHoldEditContext)
        : newIntervention;

    const result = await dispatch(
      updateSearchInterventionThunk(payload),
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

    if (isOpenedFromOnHold && onHoldEditContext) {
      window.sessionStorage.removeItem(ON_HOLD_EDIT_CONTEXT_KEY);
      // Ajouter à la liste du jour always closes the review flow on Liste du jour.
      navigate("/liste-du-jour");
      return;
    }

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
            <div className="card-header__title">
              <span className="card-header__eyebrow">INTERVENTIONS</span>
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
            </div>

            <div className="card-header__actions">
              {!isHistoryView && (
                <SmartImportDialog
                  onImported={setImportMessage}
                  autoOpen={autoOpenSmartImport}
                  focusTrigger={false}
                />
              )}

            </div>
          </header>

          <section className="intervention-core-fields">
            <InfrastructureInput />
            <NetworkInput />
          </section>

          <div className="technical-inputs">
            <InputsAll />
          </div>

          <section className="intervention-options">
            <div className="boolean-inputs-row boolean-inputs-row--unified">
              <div className="intervention-option-group intervention-option-group--unified">
                <div className="intervention-option-group__items intervention-option-group__items--six">
                  <div className="option-button">
                    {actionNotice?.key === "question" && (
                      <span className="action-toggle-notice action-toggle-notice--question" role="status">
                        {actionNotice.text}
                      </span>
                    )}
                    <BooleanInput
                      field="isUnclear"
                      label="Question à poser à l'M&P ?"
                      trueIcon={
                        <img
                          src={QuestionActionOn}
                          alt=""
                          aria-hidden="true"
                          className="question-action-icon"
                        />
                      }
                      falseIcon={
                        <img
                          src={QuestionActionOff}
                          alt=""
                          aria-hidden="true"
                          className="question-action-icon"
                        />
                      }
                      onActivated={() =>
                        showActionNotice("question", "Question M&P")
                      }
                    />
                  </div>

                  <div className="option-button">
                    {actionNotice?.key === "example" && (
                      <span className="action-toggle-notice action-toggle-notice--example" role="status">
                        {actionNotice.text}
                      </span>
                    )}
                    <BooleanInput
                      field="isGoodExample"
                      label="Bon exemple à retenir ?"
                      trueIcon={<LightBulbOnIcon />}
                      falseIcon={<LightBulbOffIcon className="lightbulb-action-icon--off" />}
                      onActivated={() =>
                        showActionNotice("example", "Example à retenir")
                      }
                    />
                  </div>

                  <div className="option-button option-button--res">
                    {actionNotice?.key === "res" && (
                      <span className="action-toggle-notice action-toggle-notice--res" role="status">
                        {actionNotice.text}
                      </span>
                    )}
                    <button
                      type="button"
                      className={`res-pending-button ${
                        isResPending ? "res-pending-button--active" : ""
                      }`}
                      onClick={handleResPendingToggle}
                      aria-label="Résiliation en attente"
                      title="Résiliation en attente"
                      aria-pressed={isResPending}
                      disabled={isHistoryView}
                    >
                      <img
                        src={isResPending ? CableCutOn : CableCutOff}
                        alt=""
                        aria-hidden="true"
                        className="res-pending-button__icon"
                      />
                    </button>
                  </div>

                  <div className="option-button option-button--snow-state">
                    {actionNotice?.key === "snowReceived" && (
                      <span className="action-toggle-notice action-toggle-notice--snow" role="status">
                        {actionNotice.text}
                      </span>
                    )}
                    <button
                      type="button"
                      className={`pending-state-button ${
                        isSnowReceivedPending ? "pending-state-button--active" : ""
                      }`}
                      onClick={() => toggleSnowPending("isSnowReceivedPending")}
                      aria-label="Snow à mon nom en attente"
                      title="Snow à mon nom en attente"
                      aria-pressed={isSnowReceivedPending}
                      disabled={isHistoryView}
                    >
                      <SnowTrailIcon direction="left" active={isSnowReceivedPending} />
                    </button>
                  </div>

                  <div className="option-button option-button--snow-state">
                    {actionNotice?.key === "snowSent" && (
                      <span className="action-toggle-notice action-toggle-notice--snow" role="status">
                        {actionNotice.text}
                      </span>
                    )}
                    <button
                      type="button"
                      className={`pending-state-button ${
                        isSnowSentPending ? "pending-state-button--active" : ""
                      }`}
                      onClick={() => toggleSnowPending("isSnowSentPending")}
                      aria-label="Snow créé en attente"
                      title="Snow créé en attente"
                      aria-pressed={isSnowSentPending}
                      disabled={isHistoryView}
                    >
                      <SnowTrailIcon direction="right" active={isSnowSentPending} />
                    </button>
                  </div>

                  <div className="option-button option-button--cure-state">
                    {actionNotice?.key === "cure" && (
                      <span className="action-toggle-notice action-toggle-notice--cure" role="status">
                        {actionNotice.text}
                      </span>
                    )}
                    <button
                      type="button"
                      className={`pending-state-button cure-summary-card ${
                        isUnifiedCureActive ? "pending-state-button--active cure-summary-card--filled" : "cure-summary-card--empty"
                      }`}
                      onClick={handleUnifiedCureToggle}
                      aria-label={
                        pendingCureKey === "thirdCure"
                          ? "CURE 3"
                          : pendingCureKey === "secondCure"
                            ? "CURE 2 en attente"
                            : "CURE 1 en attente"
                      }
                      title={
                        pendingCureKey === "thirdCure"
                          ? "CURE 3"
                          : pendingCureKey === "secondCure"
                            ? "CURE 2 en attente"
                            : "CURE 1 en attente"
                      }
                      aria-pressed={isUnifiedCureActive}
                      disabled={isHistoryView}
                    >
                      {pendingCureKey ? (
                        <img
                          src={
                            pendingCureKey === "firstCure"
                              ? VoiceMessageCall1
                              : pendingCureKey === "secondCure"
                                ? VoiceMessageCall2
                                : VoiceMessageCall3
                          }
                          alt=""
                          aria-hidden="true"
                          className={`cure-summary-card__icon ${
                            isUnifiedCureActive ? "" : "cure-summary-card__icon--off"
                          }`}
                          draggable={false}
                        />
                      ) : cureRecords.thirdCure ? (
                        <img
                          src={VoiceMessageCall3}
                          alt=""
                          aria-hidden="true"
                          className="cure-summary-card__icon cure-summary-card__icon--off"
                          draggable={false}
                        />
                      ) : (
                        <PhoneInTalkRounded className={`cure-summary-card__fallback ${isUnifiedCureActive ? "cure-summary-card__fallback--active" : ""}`} />
                      )}

                      {cureCycleState === "sms" && (
                        <span className="cure-summary-card__mail" aria-hidden="true">
                          <MailOutlineRounded />
                        </span>
                      )}
                    </button>
                  </div>

                  <div className="option-button option-button--address-state">
                    {actionNotice?.key === "address" && (
                      <span className="action-toggle-notice action-toggle-notice--address" role="status">
                        {actionNotice.text}
                      </span>
                    )}
                    <button
                      type="button"
                      className={`pending-state-button address-cycle-button ${
                        addressConfirmation !== "none" ? "pending-state-button--active address-cycle-button--active" : ""
                      }`}
                      onClick={handleAddressConfirmationCycle}
                      aria-label={
                        addressConfirmation === "confirmed"
                          ? "Adresse confirmée"
                          : addressConfirmation === "notConfirmed"
                            ? "Adresse pas encore confirmée"
                            : "Adresse non définie"
                      }
                      title={
                        addressConfirmation === "confirmed"
                          ? "Adresse confirmée"
                          : addressConfirmation === "notConfirmed"
                            ? "Adresse pas encore confirmée"
                            : "Adresse pas encore confirmée"
                      }
                      aria-pressed={addressConfirmation !== "none"}
                      disabled={isHistoryView}
                    >
                      <span className="address-cycle-button__stack" aria-hidden="true">
                        <img
                          src={AddressNotConfirmedOffArtwork}
                          alt=""
                          className={`address-cycle-button__icon address-cycle-button__icon--off ${addressConfirmation === "none" ? "address-cycle-button__icon--current" : ""}`}
                          draggable={false}
                        />
                        <img
                          src={AddressNotConfirmedArtwork}
                          alt=""
                          className={`address-cycle-button__icon ${addressConfirmation === "notConfirmed" ? "address-cycle-button__icon--current" : ""}`}
                          draggable={false}
                        />
                        <img
                          src={AddressConfirmedArtwork}
                          alt=""
                          className={`address-cycle-button__icon ${addressConfirmation === "confirmed" ? "address-cycle-button__icon--current" : ""}`}
                          draggable={false}
                        />
                      </span>
                    </button>
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
                    value: normalizePersonName(
                      trimLeadingHorizontalWhitespace(event.target.value),
                    ),
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
              cureRecords={newIntervention.cureRecords}
            />
          </div>

          <div className="right-card-actions__meta-row">
            <div className="right-card-actions__meta-history">
              {(isRetrievedEdit || isHistoryView) && newIntervention.documentId && (
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
            </div>
            <div className="right-card-actions__additional-trigger">
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
            </div>
          </div>

          <footer className="right-card-actions">
            <div className="right-card-actions__row right-card-actions__row--top">
              <div className="right-card-actions__history-slot" />
              <div className="right-card-actions__spacer" />

              <div className="right-card-actions__top-right">
                {!isHistoryView && !isNewOrDraft && (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={submitActions}
                    startIcon={isOpenedFromReviewableOnHold ? <CheckRounded /> : <Send />}
                    className={`submit-intervention-button ${
                      isOpenedFromReviewableOnHold ? "submit-intervention-button--review" : ""
                    }`}
                  >
                    {isOpenedFromReviewableOnHold ? "Revu" : "Enregistrer"}
                  </Button>
                )}
              </div>
            </div>

            <div className="right-card-actions__row right-card-actions__row--bottom">
              <div className="right-card-actions__status-slot">
                {newIntervention.status === "postponed" && postponedDate && (
                  <div className="postponed-date-line">
                    Postposé au {postponedDate}
                  </div>
                )}

                <div className={`status-wrapper ${snowReceived.trim() ? "status-wrapper--dual" : ""}`.trim()}>
                  <StatusInput />
                  {snowReceived.trim() && <SnowStatusInput />}
                </div>
              </div>

              <div className="right-card-actions__spacer" />

              <div className="right-card-actions__bottom-right">
                {!isHistoryView && (
                  <Button
                    variant="text"
                    size="large"
                    onClick={() => setClearDialogOpen(true)}
                    className="clear-form-button"
                  >
                    <span className="clear-form-button__content">
                      <span className="clear-form-button__icon">
                        <DeleteSweepRounded fontSize="small" />
                      </span>
                      <span className="clear-form-button__label">
                        <span>Effacer</span>
                        <span>le formulaire</span>
                      </span>
                    </span>
                  </Button>
                )}

                {!isHistoryView && isNewOrDraft && (
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={submitActions}
                    startIcon={<AddTaskRounded />}
                    className="add-to-today-button add-to-today-button--history"
                  >
                    <span className="add-to-today-button__label">
                      <span>Ajouter à la</span>
                      <span>liste du jour</span>
                    </span>
                  </Button>
                )}

                {isRetrievedEdit && (
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
              </div>
            </div>
          </footer>
        </section>
      </div>

      {hasDraft && !isDisplayedDraft && (
        <aside className="floating-draft-reminder" aria-label="Brouillon disponible">
          <WarningAmberRounded className="floating-draft-reminder__status" />
          <strong>Brouillon</strong>
          <Tooltip title="Reprendre le brouillon" arrow>
            <IconButton
              type="button"
              className="floating-draft-reminder__resume"
              onClick={handleResumeDraft}
              aria-label="Reprendre le brouillon"
            >
              <HistoryRounded />
            </IconButton>
          </Tooltip>
          <Tooltip title="Supprimer le brouillon" arrow>
            <IconButton
              type="button"
              className="floating-draft-reminder__cancel"
              onClick={handleCancelDraft}
              aria-label="Supprimer le brouillon"
            >
              <CloseRounded />
            </IconButton>
          </Tooltip>
        </aside>
      )}

      <Dialog
        open={resClientDialogOpen}
        onClose={() => setResClientDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        aria-labelledby="res-client-dialog-title"
      >
        <DialogTitle id="res-client-dialog-title">
          Client concerné par la résiliation
        </DialogTitle>
        <DialogContent dividers>
          <div className="res-client-choice-list">
            {resEligibleClients.map((client) => {
              const originalIndex = addressClients.findIndex((item) => item.id === client.id);
              const isCopperTechnology = /^(?:copper|cuivre)$/i.test(infrastructure.trim());
              const identifier = isCopperTechnology ? client.na.trim() : client.utac.trim();
              return (
                <button
                  type="button"
                  className="res-client-choice"
                  key={client.id}
                  onClick={() => {
                    activateResForClient(client);
                    setResClientDialogOpen(false);
                  }}
                >
                  <span className="res-client-choice__index">{originalIndex + 1}</span>
                  <span className="res-client-choice__name">
                    {client.fullName.trim() || "Client sans nom"}
                  </span>
                  <span className="res-client-choice__identifier">
                    {isCopperTechnology ? "NA" : "UTAC"} {identifier || "—"}
                  </span>
                </button>
              );
            })}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResClientDialogOpen(false)}>Annuler</Button>
        </DialogActions>
      </Dialog>

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
