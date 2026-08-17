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
    setTemplateError("");
    setSelectedTemplate(templateId);
    setReferenceNumber("");
    setCopied(null);
    setCopiedBciField(null);
    setHeaderNow(new Date());
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

  const bciSameClientOperator = intervention.addressClients.find((client) => client.isSameClient)?.operator?.trim() || "";
  const bciNa = /^(?:fiber|fibre)$/i.test(intervention.infrastructure.trim()) ? intervention.cid.trim() : intervention.na.trim();
  const bciOrderRef = intervention.oagID.trim().replace(/9$/, "");
  const bciInterventionLabel = /^scarlet$/i.test(intervention.network.trim())
    ? "SCA - Réintroduction d'un ordre import"
    : "PXS - Réintroduction d'un ordre import";

  const isFiber = /^(?:fiber|fibre)$/i.test(intervention.infrastructure.trim());
  const visibleTemplates = React.useMemo(
    () => additionalInformationTemplates.filter(
      (template) => template.id !== "wioIncorrectAddress" || isFiber,
    ),
    [isFiber],
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
                {visibleTemplates.map((template) => (
                  <Button
                    key={template.id}
                    type="button"
                    variant={selectedTemplate === template.id ? "contained" : "outlined"}
                    className="additional-information-template-button"
                    onClick={() => selectTemplate(template.id)}
                  >
                    {template.buttonLabel}
                  </Button>
                ))}
              </aside>

              <section className="additional-information-editor">
                {templateError && <div className="additional-information-template-error" role="alert">{templateError}</div>}
                {selectedTemplate === "bciReintroductionImport" ? (
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
                      <div className="bci-reintroduction-form__copyable" onClick={() => copyBciValue("cust", intervention.clientID.trim())}>
                        <input value={intervention.clientID} readOnly />
                        {copiedBciField === "cust" && <em>Copié</em>}
                      </div>
                    </div>

                    <div className="bci-reintroduction-form__line">
                      <strong>* NA</strong>
                      <div className="bci-reintroduction-form__copyable" onClick={() => copyBciValue("na", bciNa)}>
                        <input value={bciNa} readOnly />
                        {copiedBciField === "na" && <em>Copié</em>}
                      </div>
                    </div>

                    <div className="bci-reintroduction-form__line">
                      <strong>Order Ref.</strong>
                      <div className="bci-reintroduction-form__copyable" onClick={() => copyBciValue("order", bciOrderRef)}>
                        <input value={bciOrderRef} readOnly />
                        {copiedBciField === "order" && <em>Copié</em>}
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
                      <select value={bciInterventionLabel} disabled>
                        <option>{bciInterventionLabel}</option>
                      </select>
                    </div>

                    <div className="bci-reintroduction-form__line bci-reintroduction-form__line--description">
                      <strong>* Description</strong>
                      <div className="bci-reintroduction-form__copyable bci-reintroduction-form__description-box" onClick={() => copyBciValue("description", draft)}>
                        <textarea value={draft} readOnly rows={11} />
                        {copiedBciField === "description" && <em>Copié</em>}
                      </div>
                    </div>

                    {!bciSameClientOperator && (
                      <div className="bci-reintroduction-form__hint">
                        Aucun client « même » avec opérateur n'est renseigné.
                      </div>
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
    </>
  );
};

export default AdditionalInformationDialog;
