import {
  cardSections as aiDisclosureSections,
  type CardData,
  type Question,
} from "./formData";
import { cardSections as aaporSections } from "./aaporFormData";

export type { CardData, Question };

export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  sections: CardData[];
  // Section groups for display organization
  sectionGroups: {
    title: string;
    description: string;
    sectionIds: string[];
  }[];
}

// AI Disclosure Checklist Template (current form)
export const aiDisclosureTemplate: FormTemplate = {
  id: "ai-disclosure",
  name: "AAPOR AI Disclosure Checklist",
  description: "AAPOR's Disclosure Checklist for the Use of AI in Surveys",
  sections: aiDisclosureSections,
  sectionGroups: [
    {
      title: "Immediate Disclosures",
      description:
        "Immediate disclosures must be included in any reporting or methodological summaries and presented in a way that is clearly disclosed and easily accessible to readers.",
      sectionIds: [
        "tasks-performed",
        "human-oversight",
        "human-respondents-disclosure",
      ],
    },
    {
      title: "Core/Enhanced Questions",
      description:
        "Core questions should be answered in all reporting scenarios ensuring consistent transparency across studies: this is the minimum viable disclosure to ensure that consumers of the polling data can understand potential bias and limitations. Enhanced questions are always valuable to answer, as they provide deeper insight into methods and AI involvement, but they are not mandatory in every situation: this is necessary for any situation that requires reproducibility.",
      sectionIds: [
        "model-details",
        "access-tooling-details",
        "core-prompts",
        "additional-enhanced-disclosures",
      ],
    },
  ],
};

// AAPOR Transparency Initiative Template
export const aaporTemplate: FormTemplate = {
  id: "aapor-transparency",
  name: "AAPOR Required Disclosure Elements",
  description: "Standard disclosure checklist for AAPOR",
  sections: aaporSections,
  sectionGroups: [
    {
      title: "",
      description: "",
      sectionIds: [
        "first-data-source",
        "data-collection-strategy",
        "research-sponsor-and-conductor",
        "measurement-tools-instruments",
        "population-under-study",
        "methods-used-generate-and-recruit-sample",
        "methods-and-modes-of-data-collection",
        "sample-sizes-and-precision",
        "whether-and-how-data-weighted",
        "how-the-data-were-processed-procedures",
        "panel",
        "interviewer-or-coders",
        "eligibility-screening",
        "study-stimuli",
        "dispositions-response-participation-rate",
        "sample-sizes",
        "measurement-model-specification",
        "general-statement",
      ],
    },
  ],
};

// All available templates
export const allTemplates: FormTemplate[] = [
  aiDisclosureTemplate,
  aaporTemplate,
];

// Get template by ID
export function getTemplateById(templateId: string): FormTemplate | undefined {
  return allTemplates.find((t) => t.id === templateId);
}

// Get card by ID from a specific template
export function getCardByIdFromTemplate(
  templateId: string,
  cardId: string,
): CardData | undefined {
  const template = getTemplateById(templateId);
  if (!template) return undefined;
  return template.sections.find((s) => s.id === cardId);
}

// Default template
export const DEFAULT_TEMPLATE_ID = "ai-disclosure";
