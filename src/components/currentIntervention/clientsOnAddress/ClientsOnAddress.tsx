import * as React from "react";

import AddRounded from "@mui/icons-material/AddRounded";
import CheckRounded from "@mui/icons-material/CheckRounded";
import CloseRounded from "@mui/icons-material/CloseRounded";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
import DeleteOutlineRounded from "@mui/icons-material/DeleteOutlineRounded";
import ExpandMoreRounded from "@mui/icons-material/ExpandMoreRounded";
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
  serializeAddressClients,
} from "../../../utils/addressClients";

const automaticAddressLine =
  /^(?:Adresse confirmée\.?|Adresse pas encore confirmée\.?)$/i;

const removeAddressClientsBlock = (value: string) =>
  value
    .replace(
      /(?:^|\n\n?)(?:Un client TF|Client) à l'adresse:[^\n]*/gi,
      "",
    )
    .replace(
      /(?:^|\n\n?)(?:Clients TF|Clients) à l'adresse:\n(?:\d+\.\s*[^\n]*\n?)*/gi,
      "",
    )
    .replace(/^\n+|\n+$/g, "")
    .replace(/\n{3,}/g, "\n\n");

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
  field: keyof Omit<AddressClient, "id" | "mode">;
  label: string;
  inputRef?: React.Ref<HTMLInputElement>;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  normalizeAsName?: boolean;
};

const ClientField = ({
  client,
  field,
  label,
  inputRef,
  onKeyDown,
  onBlur,
  normalizeAsName = false,
}: ClientFieldProps) => {
  const dispatch = useAppDispatch();
  const isHistoryView = useAppSelector(
    (state) => state.newIntervention.isHistoryView,
  );
  const value = client[field];

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nextValue = normalizeAsName
      ? normalizePersonName(event.target.value)
      : event.target.value;

    dispatch(
      updateAddressClient({
        id: client.id,
        field,
        value: nextValue,
      }),
    );
  };

  return (
    <TextField
      variant="standard"
      size="small"
      label={label}
      value={value}
      disabled={isHistoryView}
      inputRef={inputRef}
      onKeyDown={onKeyDown}
      onBlur={onBlur}
      onChange={handleChange}
      slotProps={{
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
  const [expandedClientIds, setExpandedClientIds] = React.useState<Set<string>>(
    () => new Set(),
  );
  const isCopper = /^(?:copper|cuivre)$/i.test(infrastructure.trim());

  React.useEffect(() => {
    commentRef.current = comment;
  }, [comment]);

  React.useEffect(() => {
    const clientIds = new Set(addressClients.map((client) => client.id));
    setExpandedClientIds((current) => {
      const next = new Set([...current].filter((id) => clientIds.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [addressClients]);

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

  const toggleExtraInfo = (client: AddressClient) => {
    setExpandedClientIds((current) => {
      const next = new Set(current);
      const isExpanded = next.has(client.id);

      if (isExpanded) {
        next.delete(client.id);
      } else {
        next.add(client.id);
      }

      dispatch(
        updateAddressClient({
          id: client.id,
          field: "mode",
          value: isExpanded ? "base" : "plus",
        }),
      );

      return next;
    });
  };

  const copyClient = async (client: AddressClient) => {
    const value = serializeAddressClients([client], infrastructure).replace(
      /^1\.\s*/,
      "",
    );
    if (value) await writeText(value);
  };

  return (
    <section className="clients-on-address" aria-label="Clients à l'adresse">
      <header className="clients-on-address__header">
        <div>
          <span className="clients-on-address__title">
            Clients à l'adresse
          </span>
          <span className="clients-on-address__hint">
            {isCopper ? "Cuivre" : "Fibre"} · Entrée = client suivant
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

      <div className="clients-on-address__list">
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
                  inputRef={(element) => {
                    nameRefs.current[client.id] = element;
                  }}
                  onKeyDown={(event) => handleNameEnter(event, index)}
                />

                <ClientField
                  client={client}
                  field="operator"
                  label="Opérateur"
                />

                {isCopper ? (
                  <ClientField client={client} field="na" label="NA client" />
                ) : (
                  <>
                    <ClientField
                      client={client}
                      field="addressDetails"
                      label="Détail d'adresse"
                    />
                    <ClientField client={client} field="utac" label="UTAC" />
                  </>
                )}
              </div>

              {expandedClientIds.has(client.id) && (
                <div
                  className={`address-client__plus address-client__plus--${
                    isCopper ? "copper" : "fiber"
                  }`}
                >
                  <ClientField
                    client={client}
                    field="clientId"
                    label="ID client"
                  />
                  <ClientField client={client} field="cid" label="CID client" />
                  <ClientField client={client} field="voip" label="VOIP" />
                </div>
              )}
            </div>

            <div className="address-client__actions">
              <Tooltip
                title={
                  expandedClientIds.has(client.id)
                    ? "Masquer les infos en plus"
                    : "Infos en plus"
                }
                arrow
              >
                <IconButton
                  size="small"
                  className={`address-client__expand ${
                    expandedClientIds.has(client.id)
                      ? "address-client__expand--open"
                      : ""
                  }`}
                  disabled={isHistoryView}
                  onClick={() => toggleExtraInfo(client)}
                  aria-label={
                    expandedClientIds.has(client.id)
                      ? "Masquer les informations supplémentaires"
                      : "Afficher les informations supplémentaires"
                  }
                >
                  {expandedClientIds.has(client.id) ? (
                    <ExpandMoreRounded />
                  ) : (
                    <AddRounded />
                  )}
                </IconButton>
              </Tooltip>

              <Tooltip title="Copier ce client" arrow>
                <span>
                  <IconButton
                    size="small"
                    disabled={!addressClientHasData(client)}
                    onClick={() => void copyClient(client)}
                    aria-label={`Copier le client ${index + 1}`}
                  >
                    <ContentCopyRounded />
                  </IconButton>
                </span>
              </Tooltip>

              <Tooltip title="Supprimer ce client" arrow>
                <IconButton
                  size="small"
                  className="address-client__delete"
                  disabled={isHistoryView}
                  onClick={() => dispatch(removeAddressClient(client.id))}
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
    </section>
  );
};

export default ClientsOnAddress;
