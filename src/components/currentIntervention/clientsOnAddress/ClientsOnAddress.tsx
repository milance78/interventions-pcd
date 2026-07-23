import {
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

import CheckRounded from "@mui/icons-material/CheckRounded";
import ContentCopyRounded from "@mui/icons-material/ContentCopyRounded";
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

  const clientsOnAddress = useAppSelector(
    (state) =>
      state.newIntervention
        .clientsOnAddress,
  );

  const [isFocused, setIsFocused] =
    useState(false);

  const [copied, setCopied] =
    useState(false);

  const updateClientsOnAddress = (
    value: string,
  ) => {
    dispatch(
      updateField({
        field: "clientsOnAddress",
        value,
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
      updateClientsOnAddress("");
    }
  };

  const handleChange = (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    updateClientsOnAddress(
      event.target.value,
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

      updateClientsOnAddress(newValue);

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

    updateClientsOnAddress(newValue);

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
              <ContentCopyRounded fontSize="small" />
            )}
          </IconButton>
        </span>
      </Tooltip>
    </div>
  );
};

export default ClientsOnAddress;