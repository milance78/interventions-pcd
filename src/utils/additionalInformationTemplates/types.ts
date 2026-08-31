import type { CureRecords } from "../../redux/features/newInterventionSlice";

export type AdditionalInformationTemplateId =
  | "bciThreeCures"
  | "bciWrongNumber"
  | "wioIncorrectAddress"
  | "wioOperatorChange"
  | "tache173"
  | "tache79"
  | "tache96";

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
}

export interface TemplateDynamicValue {
  label: string;
  value: string;
}

export interface AdditionalInformationTemplateDefinition {
  id: AdditionalInformationTemplateId;
  buttonLabel: string;
  headerInputLabel: string;
  generate: (source: AdditionalInformationTemplateSource) => string;
  dynamicValues: (source: AdditionalInformationTemplateSource) => TemplateDynamicValue[];
}

export const valueOrDash = (value: string | null | undefined): string =>
  value?.trim() || "—";
