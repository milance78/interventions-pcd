/** Replace one logical paragraph in the intervention Commentaire. */
export const replaceCommentBlock = (
  comment: string,
  previous: string,
  next: string,
  insertAfterFirstBlock = false,
): string => {
  const blocks = comment
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  const filtered = previous.trim()
    ? blocks.filter((block) => block !== previous.trim())
    : blocks;

  if (!next.trim()) return filtered.join("\n\n");

  const nextBlock = next.trim();
  if (insertAfterFirstBlock && filtered.length > 0) {
    filtered.splice(1, 0, nextBlock);
  } else {
    filtered.push(nextBlock);
  }

  return filtered.join("\n\n");
};
