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
    setSelectedTemplate(templateId);
    setReferenceNumber("");
    setCopied(null);
    setHeaderNow(new Date());
    setDraft(
      buildAdditionalInformationTemplate(templateId, templateSource),
    );
  };

  const copyDraft = async (mode: "normal" | "nps") => {
    const text = mode === "nps" ? prepareNpsText(draft) : removeBlankLines(draft);
    if (!text) return;
    await writeTextToClipboard(text);
    setCopied(mode);
    window.setTimeout(() => setCopied(null), 1400);
  };

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

                  <Tooltip title={copied === "normal" ? "Copié" : "Copier le texte"}>
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
                  <Tooltip title={copied === "nps" ? "NPS copié" : "Copier pour NPS"}>
                    <span className="additional-information-copy-action additional-information-copy-action--nps">
                      <IconButton type="button" aria-label="Copier le contenu pour NPS" onClick={() => copyDraft("nps")} disabled={!draft.trim()}>
                        {copied === "nps" ? <CheckRounded /> : <strong>NPS</strong>}
                      </IconButton>
                    </span>
                  </Tooltip>
                </div>
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
