import { bciThreeCuresTemplate } from "./bciThreeCures";
import { bciWrongNumberTemplate } from "./bciWrongNumber";
import { wioIncorrectAddressTemplate } from "./wioIncorrectAddress";
import type {
  AdditionalInformationTemplateDefinition,
  AdditionalInformationTemplateId,
  AdditionalInformationTemplateSource,
} from "./types";

export type {
  AdditionalInformationTemplateDefinition,
  AdditionalInformationTemplateId,
  AdditionalInformationTemplateSource,
  TemplateDynamicValue,
} from "./types";

export const additionalInformationTemplates: AdditionalInformationTemplateDefinition[] = [
  bciThreeCuresTemplate,
  bciWrongNumberTemplate,
  wioIncorrectAddressTemplate,
];

export const getAdditionalInformationTemplate = (
  id: AdditionalInformationTemplateId,
) => additionalInformationTemplates.find((template) => template.id === id);

export const buildAdditionalInformationTemplate = (
  templateId: AdditionalInformationTemplateId,
  source: AdditionalInformationTemplateSource,
): string => getAdditionalInformationTemplate(templateId)?.generate(source) ?? "";
