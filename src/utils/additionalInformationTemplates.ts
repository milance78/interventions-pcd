import type { AddressClient, CureRecord, CureRecords } from "../redux/features/newInterventionSlice";

export type AdditionalInformationTemplateId =
  | "bciThreeCures"
  | "bciWrongNumber"
  | "wioIncorrectAddress"
  | "bciReintroductionImport"
  | "bciResiliation"
  | "snowCloseImpossible"
  | "snowUtacNonAssignable"
  | "snowIfhUtacNotFound";

export interface AdditionalInformationTemplateSource {
  phone: string;
  mainAddress: string;
  streetName: string;
  streetNumber: string;
  streetAlpha: string;
  postalCode: string;
  city: string;
  mailbox: string;
  floor: string;
  apartment: string;
  blockNumber: string;
  cureRecords: CureRecords;
  infrastructure: string;
  network: string;
  clientID: string;
  na: string;
  cid: string;
  oagID: string;
  addressClients: AddressClient[];
}

export interface AdditionalInformationDynamicValue {
  label: string;
  value: string;
}

export interface AdditionalInformationTemplateDefinition {
  id: AdditionalInformationTemplateId;
  buttonLabel: string;
  headerInputLabel: string;
  dynamicValues: (
    source: AdditionalInformationTemplateSource,
  ) => AdditionalInformationDynamicValue[];
}

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
 * Fallback parser for older records that only contain mainAddress.
 * New records use the structured address states directly.
 */
export const parseMainAddress = (mainAddress: string): ParsedAddress => {
  const normalized = mainAddress.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return {
      street: "",
      houseNumber: "",
      houseAlpha: "",
      postalCode: "",
      city: "",
    };
  }

  let addressPart = normalized;
  let postalCode = "";
  let city = "";

  const postalMatch = normalized.match(/(?:,\s*|\s+)(\d{4})\s+(.+)$/);
  if (postalMatch?.index !== undefined) {
    addressPart = normalized
      .slice(0, postalMatch.index)
      .replace(/,\s*$/, "")
      .trim();
    postalCode = postalMatch[1];
    city = postalMatch[2].replace(/^,\s*/, "").trim();
  }

  let street = addressPart;
  let houseNumber = "";
  let houseAlpha = "";

  const houseMatch = addressPart.match(
    /^(.*?)[,\s]+(\d+)\s*([A-Za-zÀ-ÖØ-öø-ÿ]?)$/u,
  );
  if (houseMatch) {
    street = houseMatch[1].replace(/,\s*$/, "").trim();
    houseNumber = houseMatch[2];
    houseAlpha = houseMatch[3] || "";
  }

  return { street, houseNumber, houseAlpha, postalCode, city };
};

const getStructuredAddress = (source: AdditionalInformationTemplateSource) => {
  const parsed = parseMainAddress(source.mainAddress);

  return {
    street: source.streetName.trim() || parsed.street,
    houseNumber: source.streetNumber.trim() || parsed.houseNumber,
    houseAlpha: source.streetAlpha.trim() || parsed.houseAlpha,
    postalCode: source.postalCode.trim() || parsed.postalCode,
    city: source.city.trim() || parsed.city,
  };
};

export const additionalInformationTemplates: AdditionalInformationTemplateDefinition[] = [
  {
    id: "bciThreeCures",
    buttonLabel: "BCI après 3 tentatives CURE",
    headerInputLabel: "Numéro BCI",
    dynamicValues: (source) => [
      { label: "GSM", value: valueOrDash(source.phone) },
      { label: "Adresse", value: valueOrDash(source.mainAddress) },
      {
        label: "1er CURE",
        value: `${formatCureDate(source.cureRecords.firstCure)} · ${formatCureTime(source.cureRecords.firstCure)}`,
      },
      {
        label: "2ème CURE",
        value: `${formatCureDate(source.cureRecords.secondCure)} · ${formatCureTime(source.cureRecords.secondCure)}`,
      },
      {
        label: "3ème CURE",
        value: `${formatCureDate(source.cureRecords.thirdCure)} · ${formatCureTime(source.cureRecords.thirdCure)}`,
      },
    ],
  },
  {
    id: "bciWrongNumber",
    buttonLabel: "BCI numéro erroné ou pas accessible",
    headerInputLabel: "Numéro BCI",
    dynamicValues: (source) => [
      { label: "GSM", value: valueOrDash(source.phone) },
      { label: "Adresse", value: valueOrDash(source.mainAddress) },
    ],
  },
  {
    id: "bciReintroductionImport",
    buttonLabel: "BCI réintroduction de l'import",
    headerInputLabel: "Numéro BCI",
    dynamicValues: () => [],
  },
  {
    id: "bciResiliation",
    buttonLabel: "BCI résilation",
    headerInputLabel: "Numéro BCI",
    dynamicValues: () => [],
  },
  {
    id: "snowCloseImpossible",
    buttonLabel: "Snow - clôture intervention pas possible",
    headerInputLabel: "Numéro d'intervention",
    dynamicValues: () => [],
  },
  {
    id: "snowUtacNonAssignable",
    buttonLabel: "Snow - UTAC non assignable",
    headerInputLabel: "UTAC-UNI",
    dynamicValues: () => [],
  },
  {
    id: "snowIfhUtacNotFound",
    buttonLabel: "Snow IFH - UTAC N'existe pas dans la data base",
    headerInputLabel: "UTAC-UNI assigné",
    dynamicValues: () => [],
  },
  {
    id: "wioIncorrectAddress",
    buttonLabel: 'WIO "Adresse incorrecte en W6"',
    headerInputLabel: "Numéro WIO",
    dynamicValues: (source) => {
      const address = getStructuredAddress(source);
      return [
        { label: "Rue", value: address.street.trim() },
        { label: "N°", value: address.houseNumber.trim() },
        { label: "Alpha", value: address.houseAlpha.trim() },
        { label: "Boîte", value: source.mailbox.trim() },
        { label: "Étage", value: source.floor.trim() },
        { label: "Appartement", value: source.apartment.trim() },
        { label: "Bloc", value: source.blockNumber.trim() },
        { label: "Code postal", value: address.postalCode.trim() },
        { label: "Ville", value: address.city.trim() },
      ].filter((item) => item.value);
    },
  },
];

const formatNetworkLabel = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^proximus$/i.test(trimmed)) return "Proximus";
  if (/^scarlet$/i.test(trimmed)) return "Scarlet";
  return `${trimmed.charAt(0).toUpperCase()}${trimmed.slice(1)}`;
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

  if (templateId === "bciReintroductionImport") {
    const sameClient = source.addressClients.find((client) => client.isSameClient);
    const currentOperator = formatNetworkLabel(source.network) || "___";
    const addressOperator = formatNetworkLabel(sameClient?.operator ?? "") || "___";
    return `Bonjour,\n\nLe client est actuellement actif chez ${addressOperator} et confirme de vouloir passer chez ${currentOperator}.\n\nMerci de réintroduire l'import\n\nBien à vous,`;
  }

  if (templateId === "bciResiliation") {
    return "";
  }

  if (templateId === "snowIfhUtacNotFound") {
    return "";
  }

  const address = getStructuredAddress(source);
  const addressLines = [
    ["Rue", address.street],
    ["Numéro de maison", address.houseNumber],
    ["Alpha du Numéro de maison", address.houseAlpha],
    ["Boite", source.mailbox],
    ["Etage", source.floor],
    ["Appartement", source.apartment],
    ["Bloc", source.blockNumber],
    ["Code postal", address.postalCode],
    ["Ville", address.city],
  ]
    .filter(([, value]) => value.trim())
    .map(([label, value]) => `${label} : ${value.trim()}`)
    .join("\n");

  const clients = source.addressClients.filter((client) =>
    [client.fullName, client.utac, client.cid, client.clientId, client.operator, client.addressDetails, client.voip]
      .some((value) => value?.trim()),
  );

  let occupationText = "";
  if (clients.length === 1) {
    const client = clients[0];
    occupationText = `Bonjour, l'UTAC ${client.utac?.trim() || "___"} à l'adresse est actuellement occupé par un autre client, dont le CID est ${client.cid?.trim() || "___"}. Merci de vérifier`;
  } else if (clients.length >= 2) {
    const cids = clients.map((client) => client.cid?.trim() || "___").join(", ");
    occupationText = `Bonjour, tous les UTAC à l'adresse sont actuellement occupés par des autres clients, dont les CID sont: ${cids}. Merci de vérifier`;
  }

  return [occupationText, addressLines].filter(Boolean).join("\n\n");
};
