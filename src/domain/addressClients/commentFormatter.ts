import type { AddressClient } from "../intervention/types";
import { addressClientHasData, normalizePersonName } from "./normalize";

const clean = (value: string) => value.trim().replace(/;+$/, "");

const simpleClientCommentDetails = (client: AddressClient, infrastructure: string) => {
  const isCopper = /^(?:copper|cuivre)$/i.test(infrastructure.trim());
  const operator = clean(client.operator);
  const normalizedOperator = operator.toLocaleLowerCase("fr-FR");
  const isMobileVikings = normalizedOperator === "mobile vikings";
  const isAutreOlo = normalizedOperator === "autre olo";
  const serviceValue = clean(isCopper ? client.na : client.utac);
  const fullName = normalizePersonName(client.fullName);

  const displayName = isMobileVikings
    ? "Mobile Vikings"
    : isAutreOlo
      ? "Autre OLO"
      : fullName;

  if (isCopper) {
    const parts: string[] = [];
    if (displayName) parts.push(displayName);
    if (serviceValue) parts.push(`NA: ${serviceValue}`);
    if (operator && !isMobileVikings && !isAutreOlo) parts.push(`chez ${operator}`);
    return parts.join(", ");
  }

  if (isMobileVikings) {
    return serviceValue ? `Mobile Vikings, UTAC: ${serviceValue}` : "Mobile Vikings";
  }
  if (isAutreOlo) {
    return serviceValue ? `Autre OLO, UTAC: ${serviceValue}` : "Autre OLO";
  }

  const parts: string[] = [];
  if (displayName) parts.push(displayName);
  if (serviceValue) parts.push(`UTAC: ${serviceValue}`);
  if (operator) parts.push(`chez ${operator}`);
  return parts.join(", ");
};

export const formatAddressClientsForComment = (
  clients: AddressClient[],
  infrastructure: string,
) => {
  const active = clients.filter(addressClientHasData);
  if (!active.length) return "";

  const isCopper = /^(?:copper|cuivre)$/i.test(infrastructure.trim());

  if (active.length === 1) {
    const client = active[0];
    const operator = clean(client.operator);
    const normalizedOperator = operator.toLocaleLowerCase("fr-FR");
    const isMobileVikings = normalizedOperator === "mobile vikings";
    const isAutreOlo = normalizedOperator === "autre olo";

    if (isCopper) {
      const na = clean(client.na);
      const name = isMobileVikings
        ? "Mobile Vikings"
        : isAutreOlo
          ? "Autre OLO"
          : normalizePersonName(client.fullName);
      const parts = [name, na ? `NA: ${na}` : ""].filter(Boolean);
      if (!isMobileVikings && !isAutreOlo && operator) parts.push(`chez ${operator}`);
      return `Un TF à l'adresse: ${parts.join(", ")};`;
    }

    const utac = clean(client.utac);
    if (isMobileVikings) {
      return `L'UTAC à l'adresse ${utac} est occupé par un Mobile Vikings;`;
    }
    if (isAutreOlo) {
      return `L'UTAC à l'adresse ${utac} est occupé par autre OLO;`;
    }

    const name = normalizePersonName(client.fullName);
    const occupant = [name, operator ? `chez ${operator}` : ""].filter(Boolean).join(", ");
    return `L'UTAC à l'adresse ${utac} est occupé par ${occupant};`;
  }

  const lines = active.map((client, index) => {
    const details = simpleClientCommentDetails(client, infrastructure);
    return `${index + 1}. ${details}${details ? ";" : ""}`;
  });

  return isCopper
    ? `Clients TF à l'adresse:\n${lines.join("\n")}`
    : `Les UTAC à l'adresse occupés par:\n${lines.join("\n")}`;
};
