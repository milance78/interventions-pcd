import * as React from "react";
import ArticleOutlined from "@mui/icons-material/ArticleOutlined";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import { useAppSelector } from "../../redux/store";
import { prepareNpsText, removeBlankLines, writeTextToClipboard } from "../../utils/textUtils";
import {
  additionalInformationTemplates,
  buildAdditionalInformationTemplate,
  type AdditionalInformationTemplateId,
} from "../../utils/additionalInformationTemplates";
import "./AdditionalInformationDialog.scss";
import snowIfhUtacNotFoundReference from "../../assets/forms/snow-ifh-utac-not-found-reference.jpg";
import wioIncorrectAddressReference from "../../assets/forms/wio-incorrect-address-reference-hd.png";
import wioOperatorChangeReference from "../../assets/forms/wio-operator-change-reference-hd.png";
import DraggableDialogPaper from "../draggableDialogPaper/DraggableDialogPaper";

type Props = {
  value: string;
  editable?: boolean;
  onChange?: (value: string) => void;
  onTemplateDataChange?: (data: {
    bciNumber?: string;
    wioNumber?: string;
    tache173Content?: string;
    tache79Content?: string;
    tache79JobId?: string;
    tache96Content?: string;
    tache96SnowId?: string;
  }) => void;
  buttonClassName?: string;
};

type TemplateHeaderField = {
  label: string;
  value: string;
  onChange: (value: string) => void;
};

const TemplateHeader = ({
  title,
  fields = [],
  children,
}: {
  title: React.ReactNode;
  fields?: TemplateHeaderField[];
  children?: React.ReactNode;
}) => (
  <div className="template-form-header">
    <div className="template-form-header__title">{title}</div>
    <div className="template-form-header__controls">
      {fields.map((field) => (
        <label key={field.label} className="template-form-header__field">
          <span>{field.label}</span>
          <input
            value={field.value}
            onChange={(event) => field.onChange(event.target.value)}
          />
        </label>
      ))}
      {children}
    </div>
  </div>
);

const formatHeaderDate = (date: Date) =>
  new Intl.DateTimeFormat("fr-BE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);

const formatHeaderTime = (date: Date) =>
  new Intl.DateTimeFormat("fr-BE", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);


const copyValue = async (value: string) => {
  if (!value.trim()) return;
  await writeTextToClipboard(value.trim());
};

const SnowIssueInput = ({
  label, value, copyable = false, dropdown = false,
}: { label: string; value: string; copyable?: boolean; dropdown?: boolean }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = async () => {
    if (!copyable || !value.trim()) return;
    await copyValue(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 900);
  };
  return (
    <div className={`snow-issue-field ${copyable ? "snow-issue-field--copyable" : ""}`}>
      <label>{label}</label>
      <div className="snow-issue-field__control" onClick={handleCopy} title={copyable ? (copied ? "Copié" : "Cliquer pour copier") : undefined}>
        <input readOnly value={value} />
        {dropdown && <span className="snow-issue-field__arrow">▾</span>}
      </div>
    </div>
  );
};

const SnowIssueForm = ({
  cdbId, orderRef, interventionCode, interventionDescription, issueStep, utacUni, description,
}: {
  cdbId: string; orderRef: string; interventionCode: string; interventionDescription: string; issueStep: string; utacUni: string; description: string;
}) => (
  <div className="snow-issue-card">
    <div className="snow-issue-title">Issue with handling PCD Intervention</div>
    <div className="snow-issue-body">
      <SnowIssueInput label="* CDB ID" value={cdbId} copyable dropdown />
      <SnowIssueInput label="Customer Contact" value="" dropdown />
      <label className="snow-issue-checkbox"><input type="checkbox" /> <span>Create Contact</span></label>
      <SnowIssueInput label="* Order ref" value={orderRef} copyable />
      <SnowIssueInput label="* Intervention code" value={interventionCode} copyable />
      <SnowIssueInput label="* Intervention description" value={interventionDescription} copyable />
      <SnowIssueInput label="Issue occured at a step" value={issueStep} copyable />
      <SnowIssueInput label="UTAC UNI" value={utacUni} copyable />
      <div className="snow-issue-field snow-issue-field--description snow-issue-field--copyable">
        <label>* Description</label>
        <div className="snow-richtext" title="Cliquer pour copier" onClick={async () => { await copyValue(description); }}>
          <div className="snow-richtext__toolbar">
            <span>↶</span><span>↷</span><span>Paragraph⌄</span><b>B</b><i>I</i><span>☰</span><span>≡</span><span>≣</span><span>▤</span><span>☷</span><span>☷</span><span>⇤</span><span>⇥</span><span>🔗</span><span>⛓</span><span>▧</span><span>{`{}`}</span><span>‹›</span>
          </div>
          <textarea readOnly value={description} />
        </div>
      </div>
    </div>
  </div>
);


const IfhUtacNotFoundForm = ({
  utac,
  description,
  onCopy,
}: {
  utac: string;
  description: string;
  onCopy: (key: string, value: string) => Promise<void> | void;
}) => {
  const [copied, setCopied] = React.useState<string | null>(null);
  const displayDescription = React.useMemo(
    () => description.replace(/\\n/g, "\n").replace(/\r\n/g, "\n"),
    [description],
  );

  const handleCopy = async (key: string, value: string) => {
    if (!value.trim()) return;
    await onCopy(key, value);
    setCopied(key);
    window.setTimeout(() => setCopied((current) => (current === key ? null : current)), 1000);
  };

  const StaticField = ({
    className = "",
    value,
  }: {
    className?: string;
    value: string;
  }) => (
    <div className={`ifh-overlay-field ${className}`}>
      <input readOnly value={value} />
    </div>
  );

  const CopyField = ({
    className = "",
    value,
    copyKey,
  }: {
    className?: string;
    value: string;
    copyKey: string;
  }) => (
    <div
      className={`ifh-overlay-field is-copyable ${className}`}
      onClick={() => handleCopy(copyKey, value)}
      title={value.trim() ? (copied === copyKey ? "Copié" : "Cliquer pour copier") : undefined}
    >
      <input readOnly value={value} />
      {copied === copyKey && <span className="ifh-overlay-field__copied">Copié</span>}
    </div>
  );

  return (
    <div className="ifh-reference-form">
      <div className="ifh-reference-form__canvas">
        <img
          src={snowIfhUtacNotFoundReference}
          alt="IFH - ISIs/SALY : UTAC/PON Issue"
          className="ifh-reference-form__image"
          draggable={false}
        />

        <div className="ifh-reference-form__overlay">
          <StaticField
            className="ifh-overlay-field--requested-for"
            value="Milan Pavlovic"
          />

          <StaticField
            className="ifh-overlay-field--requested-by"
            value="Milan Pavlovic"
          />

          <StaticField
            className="ifh-overlay-field--request-type"
            value="IFH - ISIs/SALY : UTAC/PON Issue"
          />

          <StaticField
            className="ifh-overlay-field--issue-type"
            value="UTAC not found"
          />

          <CopyField
            className="ifh-overlay-field--utac"
            value={utac}
            copyKey="UTAC"
          />

          <div
            className="ifh-overlay-field ifh-overlay-field--description is-copyable"
            onClick={() => handleCopy("Description", displayDescription)}
            title="Cliquer pour copier"
            aria-label="Description of the issue"
          >
            <textarea
              readOnly
              value={displayDescription}
              wrap="soft"
              rows={10}
            />
            {copied === "Description" && (
              <span className="ifh-overlay-field__copied">Copié</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const formatWioOrderReference = (value: string) => value.trim().replace(/9$/, "");

const AdditionalInformationDialog = ({
  value,
  editable = false,
  onChange,
  onTemplateDataChange,
  buttonClassName = "",
}: Props) => {
  const intervention = useAppSelector((state) => state.newIntervention);
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const [selectedTemplate, setSelectedTemplate] = React.useState<AdditionalInformationTemplateId | null>(null);
  const [referenceNumber, setReferenceNumber] = React.useState(intervention.bciNumber || "");
  const [wioNumber, setWioNumber] = React.useState(intervention.wioNumber || "");
  const [task173, setTask173] = React.useState(intervention.tache173Content || "");
  const [task79, setTask79] = React.useState(intervention.tache79Content || "");
  const [task79JobId, setTask79JobId] = React.useState(intervention.tache79JobId || "");
  const [task96, setTask96] = React.useState(intervention.tache96Content || "");
  const [task96SnowId, setTask96SnowId] = React.useState(intervention.tache96SnowId || "");
  const [headerNow, setHeaderNow] = React.useState(() => new Date());
  const [copied, setCopied] = React.useState<"normal" | "nps" | null>(null);
  const [templateError, setTemplateError] = React.useState("");
  const [copiedBciField, setCopiedBciField] = React.useState<string | null>(null);
  const [bciResClientId, setBciResClientId] = React.useState<string | null>(null);
  const [bciResPickerOpen, setBciResPickerOpen] = React.useState(false);
  const [snowUtac, setSnowUtac] = React.useState("");
  const [snowInterventionNumber, setSnowInterventionNumber] = React.useState("");
  const [snowFree, setSnowFree] = React.useState({ NPS: false, SALY: true, OCK: false });
  const [ifhUtac, setIfhUtac] = React.useState("");
  const [copiedWioField, setCopiedWioField] = React.useState<string | null>(null);

  const templateSource = React.useMemo(() => ({
    phone: intervention.phone,
    mainAddress: intervention.mainAddress,
    streetName: intervention.streetName,
    streetNumber: intervention.streetNumber,
    streetAlpha: intervention.streetAlpha,
    postalCode: intervention.postalCode,
    city: intervention.city,
    mailbox: intervention.mailbox,
    floor: intervention.floor,
    apartment: intervention.apartment,
    blockNumber: intervention.blockNumber,
    cureRecords: intervention.cureRecords,
    infrastructure: intervention.infrastructure,
    network: intervention.network,
    clientID: intervention.clientID,
    na: intervention.na,
    cid: intervention.cid,
    oagID: intervention.oagID,
    addressClients: intervention.addressClients,
  }), [intervention]);

  React.useEffect(() => {
    if (!open) {
      setDraft(value);
      setReferenceNumber(intervention.bciNumber || "");
      setWioNumber(intervention.wioNumber || "");
      setTask173(intervention.tache173Content || "");
      setTask79(intervention.tache79Content || "");
      setTask79JobId(intervention.tache79JobId || "");
      setTask96(intervention.tache96Content || "");
      setTask96SnowId(intervention.tache96SnowId || "");
    }
  }, [value, open, intervention.bciNumber, intervention.wioNumber, intervention.tache173Content, intervention.tache79Content, intervention.tache79JobId, intervention.tache96Content, intervention.tache96SnowId]);

  React.useEffect(() => {
    if (!open) return undefined;
    setHeaderNow(new Date());
    const interval = window.setInterval(() => setHeaderNow(new Date()), 30_000);
    return () => window.clearInterval(interval);
  }, [open]);

  const close = () => {
    setDraft(value);
    setSelectedTemplate(null);
    setReferenceNumber("");
    setCopied(null);
    setBciResPickerOpen(false);
    setBciResClientId(null);
    setSnowUtac("");
    setSnowInterventionNumber("");
    setSnowFree({ NPS: false, SALY: true, OCK: false });
    setIfhUtac("");
    setCopiedWioField(null);
    setOpen(false);
  };

  const save = () => {
    onChange?.(draft.trim());
    onTemplateDataChange?.({
      bciNumber: referenceNumber,
      wioNumber,
      tache173Content: task173,
      tache79Content: task79,
      tache79JobId: task79JobId,
      tache96Content: task96,
      tache96SnowId: task96SnowId,
    });
    setOpen(false);
  };

  const selectTemplate = (templateId: AdditionalInformationTemplateId) => {
    if (templateId === "bciReintroductionImport" && !/^(?:proximus|scarlet)$/i.test(intervention.network.trim())) {
      setTemplateError("BCI possible uniquement pour Proximus ou Scarlet");
      return;
    }

    if (
      templateId === "wioOperatorChange" &&
      !intervention.addressClients.some((client) => client.isSameClient)
    ) {
      setTemplateError(
        "WIO changement d'opérateur nécessite un client « même » à l'adresse",
      );
      return;
    }

    if (templateId === "bciResiliation") {
      if (bciResEligibleClients.length === 0) {
        setTemplateError("BCI possible uniquement pour un client à l'adresse Proximus ou Scarlet");
        return;
      }
      if (bciResEligibleClients.length === 1) {
        applyBciResClient(bciResEligibleClients[0]);
        return;
      }
      setTemplateError("");
      setBciResPickerOpen(true);
      return;
    }

    setTemplateError("");
    setSelectedTemplate(templateId);
    setReferenceNumber(intervention.bciNumber || "");
    setWioNumber(intervention.wioNumber || "");
    setTask173(intervention.tache173Content || "");
    setTask79(intervention.tache79Content || "");
    setTask79JobId(intervention.tache79JobId || "");
    setTask96(intervention.tache96Content || "");
    setTask96SnowId(intervention.tache96SnowId || "");
    setCopied(null);
    setCopiedBciField(null);
    setHeaderNow(new Date());
    setSnowUtac("");
    setSnowInterventionNumber("");
    setSnowFree({ NPS: false, SALY: true, OCK: false });
    setIfhUtac("");
    setDraft(buildAdditionalInformationTemplate(templateId, templateSource));
  };

  const copyDraft = async (mode: "normal" | "nps") => {
    const text = mode === "nps" ? prepareNpsText(draft) : removeBlankLines(draft);
    if (!text) return;
    await writeTextToClipboard(text);
    setCopied(mode);
    window.setTimeout(() => setCopied(null), 1400);
  };

  const copyBciValue = async (key: string, fieldValue: string) => {
    if (!fieldValue) return;
    await writeTextToClipboard(fieldValue);
    if (key.startsWith("wio-")) {
      setCopiedWioField(key);
      window.setTimeout(() => setCopiedWioField((current) => current === key ? null : current), 1200);
      return;
    }
    setCopiedBciField(key);
    window.setTimeout(() => setCopiedBciField((current) => current === key ? null : current), 1200);
  };

  const formatNetworkLabel = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return "";
    if (/^proximus$/i.test(trimmed)) return "Proximus";
    if (/^scarlet$/i.test(trimmed)) return "Scarlet";
    return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
  };

  const bciResEligibleClients = intervention.addressClients.filter((client) =>
    /^(?:proximus|scarlet)$/i.test(client.operator.trim()),
  );
  const selectedBciResClient =
    intervention.addressClients.find((client) => client.id === bciResClientId) ?? null;

  const buildBciResDescription = (client: (typeof intervention.addressClients)[number]) =>
    `Bonjour,\n\nUn nouveau client nous a confirmé qu’il reprend l'adresse ${intervention.mainAddress.trim() || "___"} en remplacement du client actuellement actif.\n\nConformément à la procédure, je crée ce BCI sur le dossier du client actif afin qu’il soit contacté. L’objectif est de vérifier avec lui s’il convient d’encoder un déménagement ou une résiliation à une date compatible avec les besoins des deux clients.\n\nLe client ${client.fullName.trim() || "___"} (ID client ${client.clientId.trim() || "___"}), actuellement actif à cette adresse, est censé quitter les lieux. Sa ligne devra dès lors être résiliée afin de permettre le raccordement du nouveau client ${intervention.clientName.trim() || "___"} (ID client ${intervention.clientID.trim() || "___"}).\n\nMerci de contacter le client actif afin d’entamer les démarches nécessaires et de m’en tenir informé.\n\nBonne journée`;

  const applyBciResClient = (client: (typeof intervention.addressClients)[number]) => {
    setBciResClientId(client.id);
    setBciResPickerOpen(false);
    setTemplateError("");
    setSelectedTemplate("bciResiliation");
    setReferenceNumber("");
    setCopied(null);
    setCopiedBciField(null);
    setHeaderNow(new Date());
    setDraft(buildBciResDescription(client));
  };

  const bciSameClientOperator = intervention.addressClients.find((client) => client.isSameClient)?.operator?.trim() || "";
  const bciNa = /^(?:fiber|fibre)$/i.test(intervention.infrastructure.trim()) ? intervention.cid.trim() : intervention.na.trim();
  const bciOrderRef = intervention.oagID.trim().replace(/9$/, "");
  const bciInterventionLabel = /^scarlet$/i.test(intervention.network.trim())
    ? "SCA - Réintroduction d'un ordre import"
    : "PXS - Réintroduction d'un ordre import";
  const isBciResiliation = selectedTemplate === "bciResiliation";
  const isBciGenericInfoForm = selectedTemplate === "bciThreeCures" || selectedTemplate === "bciWrongNumber";
  const bciGenericInterventionLabel = React.useMemo(() => {
    const baseLabel = additionalInformationTemplates.find((template) => template.id === selectedTemplate)?.buttonLabel ?? "";
    const stripped = baseLabel.replace(/^BCI\s*/i, "").trim();
    const capitalized = stripped ? `${stripped.charAt(0).toUpperCase()}${stripped.slice(1)}` : "";
    return /^scarlet$/i.test(intervention.network.trim()) ? `SCA - ${capitalized}` : `PXS - ${capitalized}`;
  }, [selectedTemplate, intervention.network]);
  const bciFormClientId = isBciResiliation ? (selectedBciResClient?.clientId.trim() || "") : intervention.clientID.trim();
  const bciFormNa = isBciResiliation
    ? (/^(?:fiber|fibre)$/i.test(intervention.infrastructure.trim())
        ? (selectedBciResClient?.cid.trim() || "")
        : (selectedBciResClient?.na.trim() || ""))
    : bciNa;
  const bciFormOrderRef = isBciResiliation ? "" : bciOrderRef;
  const bciResNetwork = selectedBciResClient?.operator?.trim() || "";
  const wioSameAddressClient =
    intervention.addressClients.find((client) => client.isSameClient) ?? null;
  const wioOperatorNetwork = formatNetworkLabel(
    wioSameAddressClient?.operator ?? "",
  );
  const wioOperatorChangeInfo = React.useMemo(() => {
    const network = wioOperatorNetwork || "___";
    return `Bonjour,

Le même client est actuellement actif à l'adresse chez ${network}. Vu qu'il souhaite passer chez Mobile Vikings merci de procéder au changement d'opérateur

Bonne journée`;
  }, [wioOperatorNetwork]);

  const bciFormInterventionLabel = isBciResiliation
    ? (/^scarlet$/i.test(bciResNetwork)
        ? "SCA - Réintroduction demandée par PCD"
        : /^proximus$/i.test(bciResNetwork)
          ? "PXS - Réintroduction demandée par PCD"
          : "")
    : selectedTemplate === "bciThreeCures"
      ? (/^scarlet$/i.test(intervention.network.trim())
          ? "SCA - Annulation de commande, client injoignable après 3 prises de contact"
          : "PXS - Annulation de commande, client injoignable après 3 prises de contact")
      : selectedTemplate === "bciWrongNumber"
        ? (/^scarlet$/i.test(intervention.network.trim())
            ? "SCA - Numéro erroné ou pas accessible"
            : "PXS - Numéro erroné ou pas accessible")
        : bciInterventionLabel;


  const snowCloseDescription = React.useMemo(() => {
    const utacLine = snowUtac.trim() ? `L'UTAC ${snowUtac.trim()} est assigné.\n\n` : "";
    return `Bonjour,\n\n${utacLine}Impossible de clôturer la demande ${intervention.oagID.trim()}. Elle retombe répétitivement en ${intervention.interventionDescription.trim()}. Merci de clôturer la demande.\n\nBonne journée.\n\nPCDINTERVENTIONTEAM`;
  }, [snowUtac, intervention.oagID, intervention.interventionDescription]);

  const selectedFree = (Object.entries(snowFree) as [keyof typeof snowFree, boolean][])
    .filter(([, on]) => on)
    .map(([key]) => key);
  const freeText = selectedFree.length === 0
    ? "___"
    : selectedFree.length === 1
      ? selectedFree[0]
      : selectedFree.length === 2
        ? `${selectedFree[0]} et ${selectedFree[1]}`
        : `${selectedFree[0]}, ${selectedFree[1]} et ${selectedFree[2]}`;
  const snowUnassignableDescription = `Bonjour,\n\nL'UTAC ${snowUtac.trim() || "___"} apparaît comme libre dans ${freeText}, mais ne peut pas être attribué dans NPS.\n\nLe message d'erreur affiché dans la fenêtre pop-up, « Point d'installation déjà HA » ne semble pas correct.\n\nMerci de procéder à l'attribution de cet UTAC.\n\nBonne journée\n\nPCDINTERVENTIONTEAM`;

  const ifhAddress = [
    intervention.mainAddress.trim(),
    intervention.mailbox.trim() ? `Boite : ${intervention.mailbox.trim()}` : "",
    intervention.floor.trim() ? `Etage : ${intervention.floor.trim()}` : "",
    intervention.apartment.trim() ? `Appartement : ${intervention.apartment.trim()}` : "",
    intervention.blockNumber.trim() ? `Bloc : ${intervention.blockNumber.trim()}` : "",
  ].filter(Boolean).join(" ");

  const ifhDescription = `Adresse: ${ifhAddress || "___"}\nUTAC: ${ifhUtac.trim() || "___"}\nCID: ${intervention.cid.trim() || "___"}\nOAG: ${intervention.oagID.trim() || "___"}\n\nBonjour,\n\nMerci de résoudre le problème avec l'erreur "IFH - UTAC n'existe pas dans la data base" et faire progresser l'intervention. Si nécessaire, n'hésitez pas de transmettre la question à l'autre déparement spécialisé\n\nBonne journée`;

  const isSnowForm = selectedTemplate === "snowCloseImpossible" || selectedTemplate === "snowUtacNonAssignable";
  const isIfhUtacForm = selectedTemplate === "snowIfhUtacNotFound";
  const isWioForm = selectedTemplate === "wioIncorrectAddress";
  const isTaskForm = selectedTemplate === "tache173" || selectedTemplate === "tache79" || selectedTemplate === "tache96";
  const bciTemplateIds: AdditionalInformationTemplateId[] = ["bciThreeCures", "bciWrongNumber", "bciReintroductionImport", "bciResiliation"];

  const isFiber = /^(?:fiber|fibre)$/i.test(intervention.infrastructure.trim());
  const visibleTemplates = React.useMemo(
    () => additionalInformationTemplates.filter(
      (template) => template.id !== "wioIncorrectAddress" || isFiber,
    ),
    [isFiber],
  );

  React.useEffect(() => {
    if (selectedTemplate === "snowCloseImpossible") setDraft(snowCloseDescription);
  }, [selectedTemplate, snowCloseDescription]);

  React.useEffect(() => {
    if (selectedTemplate === "snowUtacNonAssignable") setDraft(snowUnassignableDescription);
  }, [selectedTemplate, snowUnassignableDescription]);

  React.useEffect(() => {
    if (selectedTemplate === "snowIfhUtacNotFound") setDraft(ifhDescription);
  }, [selectedTemplate, ifhDescription]);

  const otherTemplates = visibleTemplates.filter(
    (template) =>
      !bciTemplateIds.includes(template.id) &&
      template.id !== "snowCloseImpossible" &&
      template.id !== "snowUtacNonAssignable" &&
      template.id !== "snowIfhUtacNotFound" &&
      template.id !== "wioIncorrectAddress" &&
      template.id !== "wioOperatorChange" &&
      template.id !== "tache173" &&
      template.id !== "tache79" &&
      template.id !== "tache96",
  );

  const selectedDefinition = visibleTemplates.find(
    (template) => template.id === selectedTemplate,
  );

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
        PaperComponent={DraggableDialogPaper}
        open={open}
        onClose={close}
        fullWidth
        maxWidth={editable ? "lg" : "md"}
        className="additional-information-dialog"
      >
        <DialogTitle>Informations supplémentaires</DialogTitle>
        <DialogContent>
          {editable ? (
            <div className="additional-information-workspace">
              <aside className="additional-information-sidebar" aria-label="Modèles d'informations supplémentaires">
                <div className="additional-information-sidebar__title">Modèles</div>

                <div className="additional-information-group">
                  <button type="button" className="additional-information-group__header" onClick={(e) => e.currentTarget.parentElement?.classList.toggle("is-open")}>
                    <span>BCI</span><span aria-hidden="true">⌄</span>
                  </button>
                  <div className="additional-information-group__items">
                    {bciTemplateIds.map((id) => {
                      const template = visibleTemplates.find((item) => item.id === id);
                      return template ? <Button key={id} type="button" variant={selectedTemplate === id ? "contained" : "outlined"} className="additional-information-template-button" onClick={() => selectTemplate(id)}>{template.buttonLabel}</Button> : null;
                    })}
                  </div>
                </div>

                <div className="additional-information-group">
                  <button type="button" className="additional-information-group__header" onClick={(e) => e.currentTarget.parentElement?.classList.toggle("is-open")}>
                    <span>WIO</span><span aria-hidden="true">⌄</span>
                  </button>
                  <div className="additional-information-group__items">
                    <Button type="button" variant={selectedTemplate === "wioIncorrectAddress" ? "contained" : "outlined"} className="additional-information-template-button" onClick={() => selectTemplate("wioIncorrectAddress")}>WIO Adresse incorrecte en W6</Button>
                    <Button type="button" variant={selectedTemplate === "wioOperatorChange" ? "contained" : "outlined"} className="additional-information-template-button" onClick={() => selectTemplate("wioOperatorChange")}>Changement d'opérateur</Button>
                  </div>
                </div>

                <div className="additional-information-group">
                  <button type="button" className="additional-information-group__header" onClick={(e) => e.currentTarget.parentElement?.classList.toggle("is-open")}>
                    <span>Snow création</span><span aria-hidden="true">⌄</span>
                  </button>
                  <div className="additional-information-group__items">
                    <Button type="button" variant={selectedTemplate === "snowCloseImpossible" ? "contained" : "outlined"} className="additional-information-template-button" onClick={() => selectTemplate("snowCloseImpossible")}>Snow - clôture intervention pas possible</Button>
                    <Button type="button" variant={selectedTemplate === "snowUtacNonAssignable" ? "contained" : "outlined"} className="additional-information-template-button" onClick={() => selectTemplate("snowUtacNonAssignable")}>Snow - UTAC non assignable</Button>
                    <Button type="button" variant={selectedTemplate === "snowIfhUtacNotFound" ? "contained" : "outlined"} className="additional-information-template-button" onClick={() => selectTemplate("snowIfhUtacNotFound")}>Snow IFH - UTAC N'existe pas dans la data base</Button>
                  </div>
                </div>

                <div className="additional-information-group">
                  <button type="button" className="additional-information-group__header" onClick={(e) => e.currentTarget.parentElement?.classList.toggle("is-open")}>
                    <span>Tâches</span><span aria-hidden="true">⌄</span>
                  </button>
                  <div className="additional-information-group__items">
                    <Button type="button" variant={selectedTemplate === "tache173" ? "contained" : "outlined"} className="additional-information-template-button" onClick={() => selectTemplate("tache173")}>Tâche 173</Button>
                    <Button type="button" variant={selectedTemplate === "tache79" ? "contained" : "outlined"} className="additional-information-template-button" onClick={() => selectTemplate("tache79")}>Tâche 79</Button>
                    <Button type="button" variant={selectedTemplate === "tache96" ? "contained" : "outlined"} className="additional-information-template-button" onClick={() => selectTemplate("tache96")}>Tâche 96</Button>
                  </div>
                </div>

                {otherTemplates.length > 0 && <div className="additional-information-group is-open">
                  <button type="button" className="additional-information-group__header" onClick={(e) => e.currentTarget.parentElement?.classList.toggle("is-open")}>
                    <span>Autres</span><span aria-hidden="true">⌄</span>
                  </button>
                  <div className="additional-information-group__items">
                    {otherTemplates.map((template) => <Button key={template.id} type="button" variant={selectedTemplate === template.id ? "contained" : "outlined"} className="additional-information-template-button" onClick={() => selectTemplate(template.id)}>{template.buttonLabel}</Button>)}
                  </div>
                </div>}
              </aside>

              <section className="additional-information-editor">
                {templateError && <div className="additional-information-template-error" role="alert">{templateError}</div>}
                {(selectedTemplate === "bciReintroductionImport" || selectedTemplate === "bciResiliation" || isBciGenericInfoForm) ? (
                  <div className="bci-reintroduction-form">
                    <TemplateHeader
                      title={selectedDefinition?.buttonLabel ?? "BCI"}
                      fields={[{ label: "Numéro BCI", value: referenceNumber, onChange: setReferenceNumber }]}
                    />
                    <div className="bci-reintroduction-form__choice-row">
                      <fieldset>
                        <legend>Langue</legend>
                        <label><input type="radio" checked={false} readOnly /> NL</label>
                        <label><input type="radio" checked readOnly /> FR</label>
                      </fieldset>
                      <fieldset>
                        <legend>* De</legend>
                        <label><input type="radio" checked={false} readOnly /> HRT</label>
                        <label><input type="radio" checked={false} readOnly /> FOT</label>
                        <label><input type="radio" checked readOnly /> IT</label>
                      </fieldset>
                      <fieldset>
                        <legend>Vers</legend>
                        <label><input type="radio" checked readOnly /> ASA/CIS/BSC</label>
                        <label><input type="radio" checked={false} readOnly /> MyPXS</label>
                      </fieldset>
                    </div>

                    <div className="bci-reintroduction-form__line bci-reintroduction-form__line--email">
                      <strong>* De</strong>
                      <input value="milan.pavlovic@proximus.com" readOnly />
                    </div>

                    <div className="bci-reintroduction-form__line">
                      <strong>* Cust. ID</strong>
                      <div className="bci-reintroduction-form__copyable" onClick={() => copyBciValue("cust", bciFormClientId)}>
                        <input value={bciFormClientId} readOnly />
                        {copiedBciField === "cust" && <em>Copié</em>}
                      </div>
                    </div>

                    <div className="bci-reintroduction-form__line">
                      <strong>* NA</strong>
                      <div className="bci-reintroduction-form__copyable" onClick={() => copyBciValue("na", bciFormNa)}>
                        <input value={bciFormNa} readOnly />
                        {copiedBciField === "na" && <em>Copié</em>}
                      </div>
                    </div>

                    <div className="bci-reintroduction-form__line">
                      <strong>Order Ref.</strong>
                      <div
                        className={isBciResiliation ? "" : "bci-reintroduction-form__copyable"}
                        onClick={isBciResiliation ? undefined : () => copyBciValue("order", bciFormOrderRef)}
                      >
                        <input value={bciFormOrderRef} readOnly />
                        {!isBciResiliation && copiedBciField === "order" && <em>Copié</em>}
                      </div>
                    </div>

                    <div className="bci-reintroduction-form__line bci-reintroduction-form__line--spaced">
                      <strong>OAG ID</strong>
                      <input value="" readOnly />
                    </div>

                    <div className="bci-reintroduction-form__line bci-reintroduction-form__line--product">
                      <strong>MM/PM-product</strong>
                      <select value="Mass Market product" disabled>
                        <option>Mass Market product</option>
                      </select>
                    </div>

                    <div className="bci-reintroduction-form__line bci-reintroduction-form__line--wide">
                      <strong>Intervention</strong>
                      <select value={bciFormInterventionLabel} disabled>
                        <option>{bciFormInterventionLabel}</option>
                      </select>
                    </div>

                    <div className="bci-reintroduction-form__line bci-reintroduction-form__line--description">
                      <strong>* Description</strong>
                      <div className="bci-reintroduction-form__copyable bci-reintroduction-form__description-box" onClick={() => copyBciValue("description", draft)}>
                        <textarea value={draft} readOnly rows={11} />
                        {copiedBciField === "description" && <em>Copié</em>}
                      </div>
                    </div>

                    {selectedTemplate === "bciReintroductionImport" && !bciSameClientOperator && (
                      <div className="bci-reintroduction-form__hint">
                        Aucun client « même » avec opérateur n'est renseigné.
                      </div>
                    )}
                  </div>
                ) : isWioForm ? (
                  <div className="custom-wio-form">
                    <TemplateHeader
                      title="WIO Adresse incorrecte en W6"
                      fields={[{ label: "Numéro WIO", value: wioNumber, onChange: setWioNumber }]}
                    />

                    <div className="custom-wio-form__canvas custom-wio-form__canvas--incorrect-address">
                      <img
                        src={wioIncorrectAddressReference}
                        alt="WIO Mobile Vikings : Adresse incorrecte en W6"
                      />

                      <div
                        className="custom-wio-form__overlay-order custom-wio-form__copyable"
                        onClick={() =>
                          copyBciValue(
                            "wio-order",
                            formatWioOrderReference(intervention.oagID),
                          )
                        }
                        title={
                          copiedWioField === "wio-order"
                            ? "Copié"
                            : "Cliquer pour copier"
                        }
                      >
                        {formatWioOrderReference(intervention.oagID)}
                        {copiedWioField === "wio-order" && <em>Copié</em>}
                      </div>

                      <div
                        className="custom-wio-form__overlay-info custom-wio-form__copyable"
                        onClick={() =>
                          copyBciValue(
                            "wio-info",
                            buildAdditionalInformationTemplate(
                              "wioIncorrectAddress",
                              templateSource,
                            ),
                          )
                        }
                        title={
                          copiedWioField === "wio-info"
                            ? "Copié"
                            : "Cliquer pour copier"
                        }
                      >
                        {buildAdditionalInformationTemplate(
                          "wioIncorrectAddress",
                          templateSource,
                        )}
                        {copiedWioField === "wio-info" && <em>Copié</em>}
                      </div>
                    </div>
                  </div>
                ) : selectedTemplate === "wioOperatorChange" ? (
                  <div className="custom-wio-form custom-wio-form--operator-change">
                    <TemplateHeader
                      title="WIO changement d'opérateur"
                      fields={[{ label: "Numéro WIO", value: wioNumber, onChange: setWioNumber }]}
                    />

                    <div className="custom-wio-form__canvas custom-wio-form__canvas--operator-change">
                      <img
                        src={wioOperatorChangeReference}
                        alt="WIO Mobile Vikings : Changement d'opérateur"
                      />

                      <div
                        className="custom-wio-form__overlay-grid-field custom-wio-form__overlay-order-ref custom-wio-form__copyable"
                        onClick={() =>
                          copyBciValue(
                            "wio-order-change",
                            formatWioOrderReference(intervention.oagID),
                          )
                        }
                        title={
                          copiedWioField === "wio-order-change"
                            ? "Copié"
                            : "Cliquer pour copier"
                        }
                      >
                        {formatWioOrderReference(intervention.oagID)}
                        {copiedWioField === "wio-order-change" && <em>Copié</em>}
                      </div>

                      <div
                        className="custom-wio-form__overlay-grid-field custom-wio-form__overlay-circuit-id custom-wio-form__copyable"
                        onClick={() =>
                          copyBciValue(
                            "wio-circuit",
                            wioSameAddressClient?.cid?.trim() || "",
                          )
                        }
                        title={
                          copiedWioField === "wio-circuit"
                            ? "Copié"
                            : "Cliquer pour copier"
                        }
                      >
                        {wioSameAddressClient?.cid?.trim() || ""}
                        {copiedWioField === "wio-circuit" && <em>Copié</em>}
                      </div>

                      <div
                        className="custom-wio-form__overlay-grid-field custom-wio-form__overlay-operator custom-wio-form__copyable"
                        onClick={() =>
                          copyBciValue("wio-operator", wioOperatorNetwork)
                        }
                        title={
                          copiedWioField === "wio-operator"
                            ? "Copié"
                            : "Cliquer pour copier"
                        }
                      >
                        {wioOperatorNetwork}
                        {copiedWioField === "wio-operator" && <em>Copié</em>}
                      </div>

                      <div
                        className="custom-wio-form__overlay-grid-field custom-wio-form__overlay-voice custom-wio-form__copyable"
                        onClick={() => copyBciValue("wio-voice", "")}
                        title="Cliquer pour copier"
                      />

                      <div
                        className="custom-wio-form__overlay-grid-field custom-wio-form__overlay-client custom-wio-form__copyable"
                        onClick={() =>
                          copyBciValue("wio-client", intervention.clientName.trim())
                        }
                        title={
                          copiedWioField === "wio-client"
                            ? "Copié"
                            : "Cliquer pour copier"
                        }
                      >
                        {intervention.clientName.trim()}
                        {copiedWioField === "wio-client" && <em>Copié</em>}
                      </div>

                      <div
                        className="custom-wio-form__overlay-grid-field custom-wio-form__overlay-services custom-wio-form__copyable"
                        onClick={() => copyBciValue("wio-services", "")}
                        title="Cliquer pour copier"
                      />

                      <div
                        className="custom-wio-form__overlay-grid-info custom-wio-form__copyable"
                        onClick={() =>
                          copyBciValue("wio-info-change", wioOperatorChangeInfo)
                        }
                        title={
                          copiedWioField === "wio-info-change"
                            ? "Copié"
                            : "Cliquer pour copier"
                        }
                      >
                        {wioOperatorChangeInfo}
                        {copiedWioField === "wio-info-change" && <em>Copié</em>}
                      </div>
                    </div>
                  </div>
                ) : isTaskForm ? (
                  <div className="custom-task-form">
                    <TemplateHeader
                      title={
                        selectedTemplate === "tache173"
                          ? "Tâche 173"
                          : selectedTemplate === "tache79"
                            ? "Tâche 79"
                            : "Tâche 96"
                      }
                      fields={
                        selectedTemplate === "tache79"
                          ? [{ label: "Job ID", value: task79JobId, onChange: setTask79JobId }]
                          : selectedTemplate === "tache96"
                            ? [{ label: "Snow ID", value: task96SnowId, onChange: setTask96SnowId }]
                            : []
                      }
                    />
                    <textarea
                      value={selectedTemplate === "tache173" ? task173 : selectedTemplate === "tache79" ? task79 : task96}
                      onChange={(event) => { const next = event.target.value; if (selectedTemplate === "tache173") setTask173(next); else if (selectedTemplate === "tache79") setTask79(next); else setTask96(next); }}
                      placeholder="Saisissez librement le contenu…"
                    />
                  </div>
                ) : isIfhUtacForm ? (
                  <div className="custom-snow-form custom-snow-form--ifh-utac">
                    <TemplateHeader
                      title="Snow création ⇒ IFH ⇒ IFH - ISIs/SALY : UTAC/PON Issue ⇒ UTAC not found"
                      fields={[{ label: "UTAC-UNI assigné", value: ifhUtac, onChange: setIfhUtac }]}
                    />
                    <IfhUtacNotFoundForm
                      utac={ifhUtac}
                      description={ifhDescription}
                      onCopy={(key, fieldValue) => copyBciValue(key, fieldValue)}
                    />
                  </div>
                ) : isSnowForm ? (
                  <div className="custom-snow-form">
                    {selectedTemplate === "snowCloseImpossible" ? (
                      <>
                        <TemplateHeader
                          title="Snow création ⇒ PCD ⇒ Issue with handling PCD Intervention"
                          fields={[
                            { label: "UTAC-UNI assigné", value: snowUtac, onChange: setSnowUtac },
                            { label: "Numéro d'intervention", value: snowInterventionNumber, onChange: setSnowInterventionNumber },
                          ]}
                        />
                        <SnowIssueForm
                          cdbId={intervention.clientID}
                          orderRef={intervention.oagID}
                          interventionCode={snowInterventionNumber}
                          interventionDescription={intervention.interventionDescription}
                          issueStep="Clôture de l'intervention"
                          utacUni={snowUtac}
                          description={snowCloseDescription}
                        />
                      </>
                    ) : (
                      <>
                        <TemplateHeader title="Snow création ⇒ PCD ⇒ Issue with handling PCD Intervention">
                          <label className="template-form-header__field">
                            <span>UTAC-UNI</span>
                            <input value={snowUtac} onChange={(e) => setSnowUtac(e.target.value)} />
                          </label>
                          <div className="template-form-header__free-controls">
                            <span>libre dans</span>
                            {(Object.keys(snowFree) as (keyof typeof snowFree)[]).map((key) => (
                              <button
                                key={key}
                                type="button"
                                className={`snow-toggle ${snowFree[key] ? "is-on" : ""}`}
                                onClick={() => setSnowFree((prev) => ({ ...prev, [key]: !prev[key] }))}
                              >
                                {key}
                              </button>
                            ))}
                          </div>
                        </TemplateHeader>
                        <SnowIssueForm
                          cdbId={intervention.clientID}
                          orderRef={intervention.oagID}
                          interventionCode={intervention.interventionId}
                          interventionDescription={intervention.interventionDescription}
                          issueStep="Attribution de l'UTAC"
                          utacUni={snowUtac}
                          description={snowUnassignableDescription}
                        />
                      </>
                    )}
                  </div>
                ) : (
                  <>
                <header className="additional-information-template-header">
                  <div className="additional-information-template-datetime">
                    <span>{formatHeaderDate(headerNow)}</span>
                    <span>{formatHeaderTime(headerNow)}</span>
                  </div>

                  <TextField
                    label={selectedDefinition?.headerInputLabel ?? "Référence"}
                    value={referenceNumber}
                    onChange={(event) => setReferenceNumber(event.target.value)}
                    size="small"
                    className="additional-information-reference"
                    disabled={!selectedDefinition}
                  />
                </header>

                {selectedDefinition && (
                  <div className="additional-information-dynamic-values" aria-label="Données automatiques du modèle">
                    {selectedDefinition.dynamicValues(templateSource).map((item) => (
                      <span className="additional-information-dynamic-value" key={item.label}>
                        <strong>{item.label}</strong>
                        <span>{item.value}</span>
                      </span>
                    ))}
                  </div>
                )}

                <div className="additional-information-copyable">
                  <TextField
                    autoFocus
                    value={draft}
                    onChange={(event) => setDraft(event.target.value.replace(/^[ \t]+/, ""))}
                    multiline
                    minRows={16}
                    maxRows={25}
                    fullWidth
                    placeholder="Choisissez un modèle ou saisissez les informations supplémentaires…"
                  />

                  <Tooltip title={copied === "normal" ? "Copié" : "Copier le texte"} placement="left" arrow>
                    <span className="additional-information-copy-action">
                      <IconButton
                        type="button"
                        aria-label="Copier le contenu"
                        onClick={() => copyDraft("normal")}
                        disabled={!draft.trim()}
                      >
                        {copied === "normal" ? <CheckRounded /> : <ContentCopyRounded />}
                      </IconButton>
                    </span>
                  </Tooltip>
                  <Tooltip title={copied === "nps" ? "NPS copié" : "Copier pour NPS"} placement="left" arrow>
                    <span className="additional-information-copy-action additional-information-copy-action--nps">
                      <IconButton type="button" aria-label="Copier le contenu pour NPS" onClick={() => copyDraft("nps")} disabled={!draft.trim()}>
                        {copied === "nps" ? <CheckRounded /> : <strong>NPS</strong>}
                      </IconButton>
                    </span>
                  </Tooltip>
                </div>
                  </>
                )}
              </section>
            </div>
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

      <Dialog PaperComponent={DraggableDialogPaper} open={bciResPickerOpen} onClose={() => setBciResPickerOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Choisir le client actif</DialogTitle>
        <DialogContent>
          <div className="bci-res-client-picker">
            {bciResEligibleClients.map((client) => (
              <button
                key={client.id}
                type="button"
                className="bci-res-client-picker__item"
                onClick={() => applyBciResClient(client)}
              >
                <strong>{client.fullName.trim() || "Client sans nom"}</strong>
                <span>
                  {/^(?:fiber|fibre)$/i.test(intervention.infrastructure.trim())
                    ? `UTAC ${client.utac.trim() || "—"}`
                    : `NA ${client.na.trim() || "—"}`}
                </span>
                <small>{formatNetworkLabel(client.operator)}</small>
              </button>
            ))}
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBciResPickerOpen(false)}>Annuler</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AdditionalInformationDialog;
