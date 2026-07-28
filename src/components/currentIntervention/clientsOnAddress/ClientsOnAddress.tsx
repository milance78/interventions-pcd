import {
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

import { ReactComponent as CopyIcon } from "../../../assets/svg/Copy.svg.tsx";
import CheckRounded from "@mui/icons-material/CheckRounded";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";

import "./ClientsOnAddress.scss";

import { updateField } from "../../../redux/features/newInterventionSlice";
import {
  useAppDispatch,
  useAppSelector,
} from "../../../redux/store";

const ClientsOnAddress = () => {
  const dispatch = useAppDispatch();

  const { clientsOnAddress, comment, infrastructure } = useAppSelector(
    (state) => state.newIntervention,
  );

  const [isFocused, setIsFocused] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  const automaticAddressLine =
    /^(?:Adresse confirmée\.?|Adresse pas encore confirmée\.?)$/i;

  const normalizeClientText = (value: string) => {
    const trimmed = value.trim().replace(/;+$/, "");
    if (!trimmed) return "";

    return /[A-ZÀ-ÖØ-Þ]{2}/.test(trimmed)
      ? `${trimmed.charAt(0).toLocaleUpperCase("fr-FR")}${trimmed
          .slice(1)
          .toLocaleLowerCase("fr-FR")}`
      : trimmed;
  };

  const extractClients = (value: string) =>
    value
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((line) => line.replace(/^\s*\d+\.\s*/, ""))
      .map(normalizeClientText)
      .filter(Boolean);

  const formatClientsForComment = (value: string) => {
    const clients = extractClients(value);
    if (!clients.length) return "";

    const isCopper = /^(?:copper|cuivre)$/i.test(infrastructure.trim());

    if (isCopper && clients.length === 1) {
      return `Un client TF à l'adresse: ${clients[0]};`;
    }

    if (isCopper) {
      return `Clients TF à l'adresse:\n${clients
        .map((client, index) => `${index + 1}. ${client};`)
        .join("\n")}`;
    }

    return clients
      .map((client, index) => `${index + 1}. ${client};`)
      .join("\n");
  };

  const removePreviousClientsBlock = (value: string, previousValue: string) => {
    let remaining = value;
    const previousBlock = formatClientsForComment(previousValue);

    if (previousBlock) remaining = remaining.replace(previousBlock, "");
    if (previousValue.trim()) remaining = remaining.replace(previousValue.trim(), "");

    return remaining
      .replace(/(?:^|\n\n?)Un client TF à l'adresse:[^\n]*/i, "")
      .replace(/(?:^|\n\n?)Clients TF à l'adresse:\n(?:\d+\.\s*[^\n]*\n?)*/i, "");
  };

  const syncClientsInComment = (previousValue: string, nextValue: string) => {
    const normalizedComment = comment.replace(/\r\n/g, "\n");
    const remaining = removePreviousClientsBlock(normalizedComment, previousValue);
    const lines = remaining.split("\n").map((line) => line.trimEnd());
    const automaticLines = lines.filter((line) =>
      automaticAddressLine.test(line.trim()),
    );
    const otherText = lines
      .filter((line) => !automaticAddressLine.test(line.trim()))
      .join("\n")
      .replace(/^\n+|\n+$/g, "")
      .replace(/\n{3,}/g, "\n\n");

    const blocks = [
      automaticLines.join("\n"),
      formatClientsForComment(nextValue),
      otherText,
    ].filter(Boolean);

    dispatch(updateField({ field: "comment", value: blocks.join("\n\n") }));
  };

  const updateClientsOnAddress = (
    value: string,
    syncComment = false,
  ) => {
    const normalized = value.replace(/^[ \t]+/, "");

    if (syncComment) {
      syncClientsInComment(clientsOnAddress, normalized);
    }

    dispatch(
      updateField({
        field: "clientsOnAddress",
        value: normalized,
      }),
    );
  };

  const handleFocus = () => {
    setIsFocused(true);

    if (!clientsOnAddress.trim()) {
      updateClientsOnAddress("1. ");
    }
  };

  const handleBlur = () => {
    setIsFocused(false);

    if (
      clientsOnAddress.trim() === "1."
    ) {
      updateClientsOnAddress("", true);
    }
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    updateClientsOnAddress(
      event.target.value,
      true,
    );
  };

  const handleKeyDown = (
    event: KeyboardEvent<HTMLDivElement>,
  ) => {
    if (event.key !== "Enter") {
      return;
    }

    event.preventDefault();

    const textarea =
      event.target as HTMLTextAreaElement;

    const cursorPosition =
      textarea.selectionStart;

    const textBeforeCursor =
      clientsOnAddress.slice(
        0,
        cursorPosition,
      );

    const textAfterCursor =
      clientsOnAddress.slice(
        cursorPosition,
      );

    const currentLine =
      textBeforeCursor
        .split("\n")
        .pop() ?? "";

    const numberedLine =
      currentLine.match(/^(\d+)\.\s?/);

    if (
      numberedLine &&
      currentLine.trim() ===
        `${numberedLine[1]}.`
    ) {
      const newValue =
        textBeforeCursor.replace(
          /\d+\.\s?$/,
          "",
        ) + textAfterCursor;

      updateClientsOnAddress(newValue, true);

      requestAnimationFrame(() => {
        textarea.selectionStart =
          textarea.selectionEnd =
            cursorPosition - 3;
      });

      return;
    }

    const nextNumber = numberedLine
      ? Number(numberedLine[1]) + 1
      : 1;

    const insertedText =
      `\n${nextNumber}. `;

    const newValue =
      textBeforeCursor +
      insertedText +
      textAfterCursor;

    updateClientsOnAddress(newValue, true);

    requestAnimationFrame(() => {
      const newCursorPosition =
        cursorPosition +
        insertedText.length;

      textarea.selectionStart =
        textarea.selectionEnd =
          newCursorPosition;
    });
  };

  const copyValue = async () => {
    if (!clientsOnAddress.trim()) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        clientsOnAddress,
      );
    } catch {
      const temporaryTextArea =
        document.createElement("textarea");

      temporaryTextArea.value =
        clientsOnAddress;

      temporaryTextArea.style.position =
        "fixed";

      temporaryTextArea.style.opacity =
        "0";

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
    <div className="clients-on-address">
      <TextField
        id="clients-on-address"
        label="Clients à l'adresse"
        multiline
        rows={3}
        value={clientsOnAddress}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        InputLabelProps={{
          shrink:
            isFocused ||
            clientsOnAddress.length > 0,
        }}
        sx={{
          width: "100%",
          "& textarea": {
            paddingRight: "48px",
            boxSizing: "border-box",
            fontWeight: "400 !important",
          },
          "& .MuiInputBase-inputMultiline": {
            fontWeight: "400 !important",
          },
          "& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline":
            {
              borderColor:
                "grey !important",
            },
          "& .MuiInputLabel-root.Mui-focused":
            {
              color:
                "grey !important",
            },
        }}
      />

      <Tooltip
        title={
          copied
            ? "Copié"
            : clientsOnAddress.trim()
              ? "Copier"
              : "Champ vide"
        }
        placement="top"
        arrow
      >
        <span className="clients-on-address__copy-wrapper">
          <IconButton
            type="button"
            size="small"
            aria-label="Copier Clients à l'adresse"
            className={`clients-on-address__copy-button ${
              copied
                ? "clients-on-address__copy-button--copied"
                : ""
            }`}
            disabled={
              !clientsOnAddress.trim()
            }
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
    </div>
  );
};

export default ClientsOnAddress;