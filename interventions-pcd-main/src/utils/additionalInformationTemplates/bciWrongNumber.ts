import type { AdditionalInformationTemplateDefinition } from "./types";
import { valueOrDash } from "./types";

export const bciWrongNumberTemplate: AdditionalInformationTemplateDefinition = {
  id: "bciWrongNumber",
  buttonLabel: "BCI numéro erroné ou pas accessible",
  headerInputLabel: "Numéro BCI",
  generate: (source) => `Bonjour,\n\nL’ordre a été annulé en raison d’un numéro de contact erroné. Il s’agissait de vérifier l’adresse avec le client, sans possibilité de le contacter.\n\nNuméro de contact du client (numéro portable GSM): ${valueOrDash(source.phone)}\nAdresse de l’ordre : ${valueOrDash(source.mainAddress)}\n\nBonne journée`,
  dynamicValues: (source) => [
    { label: "GSM", value: valueOrDash(source.phone) },
    { label: "Adresse", value: valueOrDash(source.mainAddress) },
  ],
};
