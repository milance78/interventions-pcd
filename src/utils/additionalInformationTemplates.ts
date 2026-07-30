import type { CureRecord, CureRecords } from "../redux/features/newInterventionSlice";

export type AdditionalInformationTemplateId =
  | "bciThreeCures"
  | "bciWrongNumber"
  | "wioIncorrectAddress";

export interface AdditionalInformationTemplateSource {
  phone: string;
  mainAddress: string;
  addressDetails: string;
  mailbox: string;
  floor: string;
  apartment: string;
  blockNumber: string;
  cureRecords: CureRecords;
}

export interface AdditionalInformationTemplateDefinition {
  id: AdditionalInformationTemplateId;
  buttonLabel: string;
  headerInputLabel: string;
}

export const additionalInformationTemplates: AdditionalInformationTemplateDefinition[] = [
  {
    id: "bciThreeCures",
    buttonLabel: "BCI après 3 tentatives CURE",
    headerInputLabel: "Numéro BCI",
  },
  {
    id: "bciWrongNumber",
    buttonLabel: "BCI numéro erroné ou pas accessible",
    headerInputLabel: "Numéro BCI",
  },
  {
    id: "wioIncorrectAddress",
    buttonLabel: 'WIO "Adresse incorrecte en S6"',
    headerInputLabel: "Numéro WIO",
  },
];

const valueOrDash = (value: string | null | undefined): string =>
  value?.trim() || "—";

const formatCureDate = (record: CureRecord | null): string => {
  if (!record?.date) return "—";
  const [year, month, day] = record.date.split("-");
  return year && month && day ? `${day}/${month}/${year}` : record.date;
};

const formatCureTime = (record: CureRecord | null): string =>
  record?.time?.trim() || "—";

interface ParsedAddress {
  street: string;
  houseNumber: string;
  houseAlpha: string;
  postalCode: string;
  city: string;
}

/**
 * Best-effort parser for the compact main address entered in the intervention.
 * Explicit address detail fields are handled separately by the template.
 */
export const parseMainAddress = (mainAddress: string): ParsedAddress => {
  const normalized = mainAddress.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return { street: "", houseNumber: "", houseAlpha: "", postalCode: "", city: "" };
  }

  let addressPart = normalized;
  let postalCode = "";
  let city = "";

  const postalMatch = normalized.match(/(?:,\s*|\s+)(\d{4})\s+(.+)$/);
  if (postalMatch?.index !== undefined) {
    addressPart = normalized.slice(0, postalMatch.index).replace(/,\s*$/, "").trim();
    postalCode = postalMatch[1];
    city = postalMatch[2].replace(/^,\s*/, "").trim();
  }

  let street = addressPart;
  let houseNumber = "";
  let houseAlpha = "";

  const houseMatch = addressPart.match(/^(.*?)[,\s]+(\d+)\s*([A-Za-zÀ-ÖØ-öø-ÿ]?)$/u);
  if (houseMatch) {
    street = houseMatch[1].replace(/,\s*$/, "").trim();
    houseNumber = houseMatch[2];
    houseAlpha = houseMatch[3] || "";
  }

  return { street, houseNumber, houseAlpha, postalCode, city };
};

export const buildAdditionalInformationTemplate = (
  templateId: AdditionalInformationTemplateId,
  source: AdditionalInformationTemplateSource,
): string => {
  const first = source.cureRecords.firstCure;
  const second = source.cureRecords.secondCure;
  const third = source.cureRecords.thirdCure;

  if (templateId === "bciThreeCures") {
    return `Bonjour,\n\nL’ordre a été annulé après 3 tentatives de contact sans succès avec le client. Il s’agissait de vérifier l’adresse avec le client, aucune réponse n’a été reçue du client.\n\nNuméro de contact du client : ${valueOrDash(source.phone)}\nAdresse de l’ordre : ${valueOrDash(source.mainAddress)}\n\nTentative de contact 1 (Appel - Message vocal et SMS):\nDate : ${formatCureDate(first)}\nHeure : ${formatCureTime(first)}\nTentative de contact 2 (Appel - Message vocal et SMS):\nDate : ${formatCureDate(second)}\nHeure : ${formatCureTime(second)}\nTentative de contact 3 (Appel):\nDate : ${formatCureDate(third)}\nHeure : ${formatCureTime(third)}\n\nBonne journée`;
  }

  if (templateId === "bciWrongNumber") {
    return `Bonjour,\n\nL’ordre a été annulé en raison d’un numéro de contact erroné. Il s’agissait de vérifier l’adresse avec le client, sans possibilité de le contacter.\n\nNuméro de contact du client (numéro portable GSM): ${valueOrDash(source.phone)}\nAdresse de l’ordre : ${valueOrDash(source.mainAddress)}\n\nBonne journée`;
  }

  const address = parseMainAddress(source.mainAddress);
  return `Rue : ${valueOrDash(address.street)}\nNuméro de maison : ${valueOrDash(address.houseNumber)}\nAlpha du Numéro de maison: ${valueOrDash(address.houseAlpha)}\nBoite : ${valueOrDash(source.mailbox)}\nEtage : ${valueOrDash(source.floor)}\nAppartement : ${valueOrDash(source.apartment)}\nBloc : ${valueOrDash(source.blockNumber)}\nCode postal : ${valueOrDash(address.postalCode)}\nVille : ${valueOrDash(address.city)}`;
};
