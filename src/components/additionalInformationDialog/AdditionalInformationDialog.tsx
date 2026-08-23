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

type Props = {
  value: string;
  editable?: boolean;
  onChange?: (value: string) => void;
  buttonClassName?: string;
};

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

const AdditionalInformationDialog = ({ value, editable = false, onChange, buttonClassName = "" }: Props) => {
  const intervention = useAppSelector((state) => state.newIntervention);
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState(value);
  const [selectedTemplate, setSelectedTemplate] = React.useState<AdditionalInformationTemplateId | null>(null);
  const [referenceNumber, setReferenceNumber] = React.useState("");
  const [headerNow, setHeaderNow] = React.useState(() => new Date());
  const [copied, setCopied] = React.useState<"normal" | "nps" | null>(null);
  const [templateError, setTemplateError] = React.useState("");
  const [copiedBciField, setCopiedBciField] = React.useState<string | null>(null);
  const [bciResClientId, setBciResClientId] = React.useState<string | null>(null);
  const [bciResPickerOpen, setBciResPickerOpen] = React.useState(false);
  const [snowUtac, setSnowUtac] = React.useState("");
  const [snowInterventionNumber, setSnowInterventionNumber] = React.useState("");
  const [snowFree, setSnowFree] = React.useState({ NPS: false, SALY: true, OCK: false });

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
    if (!open) setDraft(value);
  }, [value, open]);

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
    setOpen(false);
  };

  const save = () => {
    onChange?.(draft.trim());
    setOpen(false);
  };

  const selectTemplate = (templateId: AdditionalInformationTemplateId) => {
    if (templateId === "bciReintroductionImport" && !/^(?:proximus|scarlet)$/i.test(intervention.network.trim())) {
      setTemplateError("BCI possible uniquement pour Proximus ou Scarlet");
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
    setReferenceNumber("");
    setCopied(null);
    setCopiedBciField(null);
    setHeaderNow(new Date());
    setSnowUtac("");
    setSnowInterventionNumber("");
    setSnowFree({ NPS: false, SALY: true, OCK: false });
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
  const bciFormClientId = isBciResiliation ? (selectedBciResClient?.clientId.trim() || "") : intervention.clientID.trim();
  const bciFormNa = isBciResiliation
    ? (/^(?:fiber|fibre)$/i.test(intervention.infrastructure.trim())
        ? (selectedBciResClient?.cid.trim() || "")
        : (selectedBciResClient?.na.trim() || ""))
    : bciNa;
  const bciFormOrderRef = isBciResiliation ? "" : bciOrderRef;
  const bciFormInterventionLabel = isBciResiliation
    ? (/^scarlet$/i.test(intervention.network.trim())
        ? "SCA - Réintroduction demandée par PCD"
        : "PXS - Réintroduction demandée par PCD")
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

  const isSnowForm = selectedTemplate === "snowCloseImpossible" || selectedTemplate === "snowUtacNonAssignable";
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

  const otherTemplates = visibleTemplates.filter((template) => !bciTemplateIds.includes(template.id) && template.id !== "snowCloseImpossible" && template.id !== "snowUtacNonAssignable");

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
                    <span>Snow création</span><span aria-hidden="true">⌄</span>
                  </button>
                  <div className="additional-information-group__items">
                    <Button type="button" variant={selectedTemplate === "snowCloseImpossible" ? "contained" : "outlined"} className="additional-information-template-button" onClick={() => selectTemplate("snowCloseImpossible")}>Snow - clôture intervention pas possible</Button>
                    <Button type="button" variant={selectedTemplate === "snowUtacNonAssignable" ? "contained" : "outlined"} className="additional-information-template-button" onClick={() => selectTemplate("snowUtacNonAssignable")}>Snow - UTAC non assignable</Button>
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
                {(selectedTemplate === "bciReintroductionImport" || selectedTemplate === "bciResiliation") ? (
                  <div className="bci-reintroduction-form">
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
                ) : isSnowForm ? (
                  <div className="custom-snow-form">
                    <div className="snow-instruction">Snow création ⇒ PCD ⇒ Issue with handling PCD Intervention</div>
                    {selectedTemplate === "snowCloseImpossible" ? (
                      <>
                        <div className="snow-header-inputs">
                          <TextField label="UTAC-UNI assigné" size="small" value={snowUtac} onChange={(e) => setSnowUtac(e.target.value)} />
                          <TextField label="Numéro d'intervention" size="small" value={snowInterventionNumber} onChange={(e) => setSnowInterventionNumber(e.target.value)} />
                        </div>
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
                        <div className="snow-header-inputs snow-header-inputs--free">
                          <TextField required error={!snowUtac.trim()} label="UTAC-UNI" size="small" value={snowUtac} onChange={(e) => setSnowUtac(e.target.value)} />
                          <span>libre dans</span>
                          {(Object.keys(snowFree) as (keyof typeof snowFree)[]).map((key) => (
                            <button key={key} type="button" className={`snow-toggle ${snowFree[key] ? "is-on" : ""}`} onClick={() => setSnowFree((prev) => ({ ...prev, [key]: !prev[key] }))}>{key}</button>
                          ))}
                        </div>
                        {!snowUtac.trim() && <div className="snow-validation-error">UTAC-UNI est obligatoire.</div>}
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

      <Dialog open={bciResPickerOpen} onClose={() => setBciResPickerOpen(false)} fullWidth maxWidth="sm">
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
