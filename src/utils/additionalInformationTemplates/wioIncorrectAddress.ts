import type { AdditionalInformationTemplateDefinition } from "./types";
import { valueOrDash } from "./types";

export const wioIncorrectAddressTemplate: AdditionalInformationTemplateDefinition = {
  id: "wioIncorrectAddress",
  buttonLabel: 'WIO "Adresse incorrecte en W6"',
  headerInputLabel: "Numéro WIO",
  generate: (source) => `Rue : ${valueOrDash(source.streetName)}\nNuméro de maison : ${valueOrDash(source.streetNumber)}\nAlpha du Numéro de maison: ${valueOrDash(source.streetAlpha)}\nBoite : ${valueOrDash(source.mailbox)}\nEtage : ${valueOrDash(source.floor)}\nAppartement : ${valueOrDash(source.apartment)}\nBloc : ${valueOrDash(source.blockNumber)}\nCode postal : ${valueOrDash(source.postalCode)}\nVille : ${valueOrDash(source.city)}`,
  dynamicValues: (source) => [
    { label: "Rue", value: valueOrDash(source.streetName) },
    { label: "Numéro", value: valueOrDash(source.streetNumber) },
    { label: "Alpha", value: valueOrDash(source.streetAlpha) },
    { label: "Boîte", value: valueOrDash(source.mailbox) },
    { label: "Étage", value: valueOrDash(source.floor) },
    { label: "Appartement", value: valueOrDash(source.apartment) },
    { label: "Bloc", value: valueOrDash(source.blockNumber) },
    { label: "Code postal", value: valueOrDash(source.postalCode) },
    { label: "Ville", value: valueOrDash(source.city) },
  ],
};
