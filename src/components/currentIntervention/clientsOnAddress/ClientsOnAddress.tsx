import * as React from "react";

import AddRounded from "@mui/icons-material/AddRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import ContentPasteGoRounded from "@mui/icons-material/ContentPasteGoRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import "./ClientsOnAddress.scss";

import {
  addAddressClient,
  removeAddressClient,
  updateAddressClient,
  updateField,
  type AddressClient,
} from "../../../redux/features/newInterventionSlice";
import { useAppDispatch, useAppSelector } from "../../../redux/store";
import {
  addressClientHasData,
  createAddressClient,
  formatAddressClientsForComment,
  normalizePersonName,
} from "../../../utils/addressClients";
import { normalizeNaNumber } from "../../../utils/interventionAddress";
import { parseAddressClientImport } from "../../../features/addressClientImport/addressClientImportParser";
import CollerWctNpsIcon from "../../../assets/icons/CollerWctNps.png";

const automaticAddressLine =
  /^(?:Adresse confirmée\.?|Adresse pas encore confirmée\.?)$/i;

const removeAddressClientsBlock = (value: string) =>
  value
    .replace(
      /(?:^|\n\n?)(?:(?:Un client TF|Client) à l'adresse:|Un TF à l'adresse,)[^\n]*/gi,
      "",
    )
    .replace(
      /(?:^|\n\n?)(?:(?:Clients TF|Clients) à l'adresse|Les clients TF à l'adresse):\n(?:\d+\.\s*[^\n]*\n?)*/gi,
      "",
    )
    .replace(/^\n+|\n+$/g, "")
    .replace(/\n{3,}/g, "\n\n");

const AddressClientImportIcon = ({ className }: { className: string }) => (
  <span
    aria-hidden="true"
    className={className}
    style={{
      WebkitMaskImage: `url(${CollerWctNpsIcon})`,
      maskImage: `url(${CollerWctNpsIcon})`,
    }}
  />
);

const writeText = async (value: string) => {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
};

type CopyAdornmentProps = {
  value: string;
  label: string;
};

const CopyAdornment = ({ value, label }: CopyAdornmentProps) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    if (!value.trim()) return;
    await writeText(value.trim());
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1000);
  };

  return (
    <InputAdornment position="end">
      <Tooltip title={copied ? "Copié" : `Copier ${label}`} arrow>
        <span>
          <IconButton
            size="small"
            className="address-client-field__copy"
            disabled={!value.trim()}
            onClick={handleCopy}
            aria-label={`Copier ${label}`}
          >
            {copied ? <CheckRounded /> : <ContentCopyRounded />}
          </IconButton>
        </span>
      </Tooltip>
    </InputAdornment>
  );
};

type ClientFieldProps = {
  client: AddressClient;
  field: keyof Omit<AddressClient, "id" | "mode" | "isFuture">;
  label: string;
  inputRef?: React.Ref<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  normalizeAsName?: boolean;
  compact?: boolean;
};

const ClientField = ({
  client,
  field,
  label,
  inputRef,
  onKeyDown,
  onBlur,
  normalizeAsName = false,
  compact = false,
}: ClientFieldProps) => {
  const dispatch = useAppDispatch();
  const isHistoryView = useAppSelector(
    (state) => state.newIntervention.isHistoryView,
  );
  const value = client[field];

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue =
      field === "na"
        ? normalizeNaNumber(event.target.value)
        : event.target.value;

    dispatch(
      updateAddressClient({
        id: client.id,
        field,
        value: nextValue,
      }),
    );
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const normalizedValue = normalizeAsName
      ? normalizePersonName(event.target.value)
      : field === "na"
        ? normalizeNaNumber(event.target.value)
        : event.target.value.trim();

    if (normalizedValue !== event.target.value) {
      dispatch(
        updateAddressClient({
          id: client.id,
          field,
          value: normalizedValue,
        }),
      );
    }

    onBlur?.(event);
  };

  return (
    <TextField
      variant="standard"
      size="small"
      label={compact ? undefined : label}
      placeholder={compact ? label : undefined}
      value={value}
      disabled={isHistoryView}
      inputRef={inputRef}
      onKeyDown={onKeyDown}
      onBlur={handleBlur}
      onChange={handleChange}
      slotProps={{
        htmlInput: {
          "aria-label": label,
        },
        input: {
          endAdornment: <CopyAdornment value={value} label={label} />,
        },
      }}
    />
  );
};

const ClientsOnAddress = () => {
  const dispatch = useAppDispatch();
  const { addressClients, infrastructure, comment, isHistoryView } =
    useAppSelector((state) => state.newIntervention);
  const nameRefs = React.useRef<Record<string, HTMLInputElement | null>>({});
  const commentRef = React.useRef(comment);
  const previousAddressSignatureRef = React.useRef(
    JSON.stringify({ addressClients, infrastructure }),
  );
  const [selectedClientId, setSelectedClientId] = React.useState<string | null>(null);
  const [deleteClientId, setDeleteClientId] = React.useState<string | null>(null);
  const [isImportOpen, setIsImportOpen] = React.useState(false);
  const [isImportProcessing, setIsImportProcessing] = React.useState(false);
  const [importFeedback, setImportFeedback] = React.useState("");
  const importPasteTargetRef = React.useRef<HTMLTextAreaElement | null>(null);
  const isCopper = /^(?:copper|cuivre)$/i.test(infrastructure.trim());

  React.useEffect(() => {
    commentRef.current = comment;
  }, [comment]);


  React.useEffect(() => {
    const signature = JSON.stringify({ addressClients, infrastructure });
    if (previousAddressSignatureRef.current === signature) return;
    previousAddressSignatureRef.current = signature;

    const formatted = formatAddressClientsForComment(
      addressClients,
      infrastructure,
    );
    const normalizedComment = commentRef.current.replace(/\r\n/g, "\n");
    const remaining = removeAddressClientsBlock(normalizedComment);
    const lines = remaining.split("\n").map((line) => line.trimEnd());
    const automaticLines = lines.filter((line) =>
      automaticAddressLine.test(line.trim()),
    );
    const otherText = lines
      .filter((line) => !automaticAddressLine.test(line.trim()))
      .join("\n")
      .replace(/^\n+|\n+$/g, "")
      .replace(/\n{3,}/g, "\n\n");

    const nextComment = [automaticLines.join("\n"), formatted, otherText]
      .filter(Boolean)
      .join("\n\n");

    if (nextComment !== normalizedComment) {
      commentRef.current = nextComment;
      dispatch(updateField({ field: "comment", value: nextComment }));
    }
  }, [addressClients, infrastructure, dispatch]);

  const addClient = React.useCallback(() => {
    const client = createAddressClient();
    dispatch(addAddressClient(client));
    requestAnimationFrame(() => nameRefs.current[client.id]?.focus());
  }, [dispatch]);

  const handleNameEnter = (
    event: React.KeyboardEvent<HTMLDivElement>,
    index: number,
  ) => {
    if (event.key !== "Enter") return;
    event.preventDefault();

    const next = addressClients[index + 1];
    if (next) {
      nameRefs.current[next.id]?.focus();
      return;
    }

    if (addressClients[index]?.fullName.trim()) addClient();
  };

  const selectedClient =
    addressClients.find((client) => client.id === selectedClientId) ?? null;

  React.useEffect(() => {
    if (!isImportOpen) return;
    const timer = window.setTimeout(
      () => importPasteTargetRef.current?.focus(),
      80,
    );
    return () => window.clearTimeout(timer);
  }, [isImportOpen]);

  const importAddressClientText = (rawText: string) => {
    if (!selectedClient || !rawText.trim() || isImportProcessing) return;

    const result = parseAddressClientImport(
      rawText,
      isCopper ? "cuivre" : "fibre",
    );
    if (result.detectedFields.length === 0) {
      setImportFeedback("Aucune donnée reconnue dans le contenu collé.");
      return;
    }

    setIsImportProcessing(true);
    setImportFeedback("");

    window.setTimeout(() => {
      result.detectedFields.forEach((field) => {
        const value = result.values[field];
        if (value === undefined) return;
        dispatch(
          updateAddressClient({
            id: selectedClient.id,
            field: field as "na" | "cid" | "utac" | "clientId" | "operator",
            value,
          }),
        );
      });

      setIsImportProcessing(false);
      setIsImportOpen(false);
      setImportFeedback(
        `${result.detectedFields.length} champs remplis automatiquement (${result.sourceType}).`,
      );
    }, 70);
  };

  const handleAddressClientImportPaste = (
    event: React.ClipboardEvent<HTMLTextAreaElement>,
  ) => {
    event.preventDefault();
    importAddressClientText(event.clipboardData.getData("text/plain"));
  };

  return (
    <section className="clients-on-address" aria-label="Clients à l'adresse">
      <header className="clients-on-address__header">
        <div>
          <span className="clients-on-address__title">
            Clients à l'adresse
          </span>
        </div>

        <Tooltip title="Ajouter un client" arrow>
          <span>
            <IconButton
              className="clients-on-address__add"
              size="small"
              disabled={isHistoryView}
              onClick={addClient}
              aria-label="Ajouter un client à l'adresse"
            >
              <AddRounded />
            </IconButton>
          </span>
        </Tooltip>
      </header>

      <div
        className={`clients-on-address__list ${
          addressClients.length > 3
            ? "clients-on-address__list--scroll"
            : ""
        }`}
      >
        {addressClients.length === 0 && (
          <button
            type="button"
            className="clients-on-address__empty"
            disabled={isHistoryView}
            onClick={addClient}
          >
            <AddRounded /> Ajouter le premier client à l'adresse
          </button>
        )}

        {addressClients.map((client, index) => (
          <article className="address-client" key={client.id}>
            <div className="address-client__number">{index + 1}</div>

            <div className="address-client__content">
              <div
                className={`address-client__base address-client__base--${
                  isCopper ? "copper" : "fiber"
                }`}
              >
                <ClientField
                  client={client}
                  field="fullName"
                  label="Nom et prénom"
                  normalizeAsName
                  compact
                  inputRef={(element) => {
                    nameRefs.current[client.id] = element;
                  }}
                  onKeyDown={(event) => handleNameEnter(event, index)}
                />

                {isCopper ? (
                  <ClientField
                    client={client}
                    field="na"
                    label="NA client"
                    compact
                  />
                ) : (
                  <ClientField
                    client={client}
                    field="utac"
                    label="UTAC"
                    compact
                  />
                )}
              </div>
            </div>

            <div className="address-client__actions">
              <Tooltip title="Ouvrir la fiche complète" arrow>
                <span>
                  <IconButton
                    size="small"
                    className="address-client__details"
                    disabled={isHistoryView && !addressClientHasData(client)}
                    onClick={() => setSelectedClientId(client.id)}
                    aria-label={`Ouvrir les détails du client ${index + 1}`}
                  >
                    <SearchRounded />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Fut à l'adresse" arrow>
                <span>
                  <IconButton
                    size="small"
                    className={`address-client__future ${
                      client.isFuture ? "address-client__future--active" : ""
                    }`}
                    disabled={isHistoryView}
                    onClick={() =>
                      dispatch(
                        updateAddressClient({
                          id: client.id,
                          field: "isFuture",
                          value: !client.isFuture,
                        }),
                      )
                    }
                    aria-label={`Fut à l'adresse pour le client ${index + 1}`}
                    aria-pressed={Boolean(client.isFuture)}
                  >
                    <span aria-hidden="true">F</span>
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Supprimer ce client" arrow>
                <IconButton
                  size="small"
                  className="address-client__delete"
                  disabled={isHistoryView}
                  onClick={() => setDeleteClientId(client.id)}
                  aria-label={`Supprimer le client ${index + 1}`}
                >
                  {addressClients.length === 1 &&
                  !addressClientHasData(client) ? (
                    <CloseRounded />
                  ) : (
                    <DeleteOutlineRounded />
                  )}
                </IconButton>
              </Tooltip>
            </div>
          </article>
        ))}
      </div>

      <Dialog
        open={Boolean(deleteClientId)}
        onClose={() => setDeleteClientId(null)}
        maxWidth="xs"
        fullWidth
        className="address-client-delete-dialog"
        aria-labelledby="address-client-delete-dialog-title"
      >
        <DialogTitle id="address-client-delete-dialog-title">
          Effacer le client ?
        </DialogTitle>
        <DialogActions>
          <Button onClick={() => setDeleteClientId(null)}>Annuler</Button>
          <Button
            color="error"
            variant="contained"
            onClick={() => {
              if (deleteClientId) dispatch(removeAddressClient(deleteClientId));
              setDeleteClientId(null);
            }}
          >
            Effacer
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(selectedClient)}
        onClose={() => setSelectedClientId(null)}
        fullWidth
        maxWidth="md"
        className="address-client-dialog"
        aria-labelledby="address-client-dialog-title"
      >
        {selectedClient && (
          <>
            <DialogTitle id="address-client-dialog-title">
              Client à l'adresse{selectedClient.fullName.trim()
                ? ` · ${selectedClient.fullName.trim()}`
                : ""}
              <IconButton
                className="address-client-dialog__close"
                onClick={() => setSelectedClientId(null)}
                aria-label="Fermer"
              >
                <CloseRounded />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers>
              {!isHistoryView && (
                <div className="address-client-dialog__import-row">
                  <Button
                    type="button"
                    variant="outlined"
                    className="address-client-import-trigger"
                    startIcon={
                      <AddressClientImportIcon className="address-client-import-trigger__icon" />
                    }
                    onClick={() => {
                      setImportFeedback("");
                      setIsImportOpen(true);
                    }}
                  >
                    Coller SALY/xACTO · {isCopper ? "Cuivre" : "Fibre"}
                  </Button>
                  {importFeedback && (
                    <span className="address-client-dialog__import-feedback">
                      {importFeedback}
                    </span>
                  )}
                </div>
              )}

              <div
                className={`address-client-dialog__grid address-client-dialog__grid--${
                  isCopper ? "copper" : "fiber"
                }`}
              >
                <ClientField
                  client={selectedClient}
                  field="fullName"
                  label="Nom et prénom"
                  normalizeAsName
                />

                {isCopper ? (
                  <>
                    <ClientField
                      client={selectedClient}
                      field="na"
                      label="NA client"
                    />
                    <ClientField
                      client={selectedClient}
                      field="operator"
                      label="Réseau"
                    />
                    <ClientField
                      client={selectedClient}
                      field="clientId"
                      label="ID client"
                    />
                    <ClientField
                      client={selectedClient}
                      field="cid"
                      label="CID client"
                    />
                    <ClientField
                      client={selectedClient}
                      field="voip"
                      label="VOIP"
                    />
                  </>
                ) : (
                  <>
                    <ClientField
                      client={selectedClient}
                      field="utac"
                      label="UTAC"
                    />
                    <ClientField
                      client={selectedClient}
                      field="cid"
                      label="CID client"
                    />
                    <ClientField
                      client={selectedClient}
                      field="addressDetails"
                      label="Détails d'adresse"
                    />
                    <ClientField
                      client={selectedClient}
                      field="operator"
                      label="Réseau"
                    />
                    <ClientField
                      client={selectedClient}
                      field="clientId"
                      label="ID client"
                    />
                    <ClientField
                      client={selectedClient}
                      field="voip"
                      label="VOIP"
                    />
                  </>
                )}
              </div>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setSelectedClientId(null)}>Fermer</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={isImportOpen}
        onClose={() => !isImportProcessing && setIsImportOpen(false)}
        fullWidth
        maxWidth="md"
        className="address-client-import-dialog"
      >
        <DialogTitle className="address-client-import-dialog__title">
          <span>
            <AddressClientImportIcon className="address-client-import-dialog__title-icon" />
            Coller SALY/xACTO · {isCopper ? "Cuivre" : "Fibre"}
          </span>
          <IconButton
            aria-label="Fermer"
            onClick={() => setIsImportOpen(false)}
            disabled={isImportProcessing}
          >
            <CloseRounded />
          </IconButton>
        </DialogTitle>

        <DialogContent className="address-client-import-dialog__content">
          <textarea
            ref={importPasteTargetRef}
            className="address-client-import-dialog__paste-target"
            aria-label={`Coller le contenu SALY ou xACTO ${isCopper ? "Cuivre" : "Fibre"}`}
            onPaste={handleAddressClientImportPaste}
            onChange={() => undefined}
            value=""
          />

          <div
            className={`address-client-import-dropzone ${
              isImportProcessing
                ? "address-client-import-dropzone--processing"
                : ""
            }`}
          >
            {isImportProcessing ? (
              <>
                <CircularProgress size={38} />
                <strong>Analyse des données…</strong>
                <span>
                  {isCopper
                    ? "NA, CID, ID Client et Réseau seront remplis."
                    : "UTAC, CID, ID Client et Réseau seront remplis."}
                </span>
              </>
            ) : (
              <>
                <ContentPasteGoRounded className="address-client-import-dropzone__icon" />
                <strong>
                  Collez le contenu complet de SALY/xACTO · {isCopper ? "Cuivre" : "Fibre"}
                </strong>
                <span>
                  {isCopper
                    ? "Le parser extrait NA, CID, ID Client et Réseau."
                    : "Le parser extrait UTAC, CID, ID Client et Réseau."}
                  {" "}Appuyez sur Ctrl + V. Le texte brut ne sera pas conservé.
                </span>
                <kbd>Ctrl + V</kbd>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default ClientsOnAddress;
