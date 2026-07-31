import { formatCureDate, formatCureTime } from "./cureFormatting";
import type { AdditionalInformationTemplateDefinition } from "./types";
import { valueOrDash } from "./types";

export const bciThreeCuresTemplate: AdditionalInformationTemplateDefinition = {
  id: "bciThreeCures",
  buttonLabel: "BCI après 3 tentatives CURE",
  headerInputLabel: "Numéro BCI",
  generate: (source) => {
    const first = source.cureRecords.firstCure;
    const second = source.cureRecords.secondCure;
    const third = source.cureRecords.thirdCure;
    return `Bonjour,\n\nL’ordre a été annulé après 3 tentatives de contact sans succès avec le client. Il s’agissait de vérifier l’adresse avec le client, aucune réponse n’a été reçue du client.\n\nNuméro de contact du client : ${valueOrDash(source.phone)}\nAdresse de l’ordre : ${valueOrDash(source.mainAddress)}\n\nTentative de contact 1 (Appel - Message vocal et SMS):\nDate : ${formatCureDate(first)}\nHeure : ${formatCureTime(first)}\nTentative de contact 2 (Appel - Message vocal et SMS):\nDate : ${formatCureDate(second)}\nHeure : ${formatCureTime(second)}\nTentative de contact 3 (Appel):\nDate : ${formatCureDate(third)}\nHeure : ${formatCureTime(third)}\n\nBonne journée`;
  },
  dynamicValues: (source) => [
    { label: "GSM", value: valueOrDash(source.phone) },
    { label: "Adresse", value: valueOrDash(source.mainAddress) },
    { label: "1er CURE", value: `${formatCureDate(source.cureRecords.firstCure)} · ${formatCureTime(source.cureRecords.firstCure)}` },
    { label: "2ème CURE", value: `${formatCureDate(source.cureRecords.secondCure)} · ${formatCureTime(source.cureRecords.secondCure)}` },
    { label: "3ème CURE", value: `${formatCureDate(source.cureRecords.thirdCure)} · ${formatCureTime(source.cureRecords.thirdCure)}` },
  ],
};
