/** Copies text using the modern Clipboard API with a DOM fallback. */
export const writeTextToClipboard = async (value: string): Promise<void> => {
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
