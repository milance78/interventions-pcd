import type { AddressClient, AddressClientMode } from "../intervention/types";

export const normalizePersonName = (value: string) => {
  const normalized = value.replace(/\s+/g, " ").replace(/^\s+/, "");
  if (!normalized) return "";

  const capitalizeSegment = (segment: string) =>
    segment
      ? `${segment.charAt(0).toLocaleUpperCase("fr-FR")}${segment
          .slice(1)
          .toLocaleLowerCase("fr-FR")}`
      : "";

  return normalized
    .split(" ")
    .map((part) => part.split("-").map(capitalizeSegment).join("-"))
    .join(" ");
};

export const addressClientHasData = (client: AddressClient) =>
  Object.entries(client).some(
    ([key, value]) =>
      key !== "id" &&
      key !== "mode" &&
      key !== "isFuture" &&
      key !== "isSameClient" &&
      key !== "naInService" &&
      typeof value === "string" &&
      value.trim().length > 0,
  );

export const normalizeAddressClientMode = (
  value: unknown,
): AddressClientMode => (value === "plus" ? "plus" : "base");
