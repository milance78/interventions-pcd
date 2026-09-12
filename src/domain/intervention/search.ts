export type SearchMode = "exact" | "digits";

export const prepareSearchValue = (
  rawValue: string,
): { value: string; mode: SearchMode } => {
  const trimmed = rawValue.trim();

  if (trimmed.length === 18) {
    return { value: trimmed, mode: "exact" };
  }

  if (trimmed.length === 17) {
    return { value: `${trimmed}9`, mode: "exact" };
  }

  return { value: trimmed.replace(/\D/g, ""), mode: "digits" };
};

export const numericPart = (value?: string | null): string =>
  (value ?? "").replace(/\D/g, "");
