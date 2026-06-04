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
  // Optional: extra AAPOR sections to render in section-by-section
  // style after the AI use-case sections (used by the "full" level).
  extraAaporSectionIds?: string[];
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
      sectionIds: ["access-infrastructure", "model-details", "core-prompts"],
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

// AI Simple — only Immediate Disclosures
export const aiSimpleTemplate: FormTemplate = {
  id: "ai-simple",
  name: "Simple AI Disclosure",
  description:
    "Required AI disclosure questions only (AAPOR code regarding AI).",
  sections: aiDisclosureSections,
  sectionGroups: [aiDisclosureTemplate.sectionGroups[0]],
};

// AI Enhanced — Immediate + Core/Enhanced
export const aiEnhancedTemplate: FormTemplate = {
  id: "ai-enhanced",
  name: "Enhanced AI Disclosure",
  description:
    "Required + enhanced AI disclosure questions designed to facilitate reproducibility.",
  sections: aiDisclosureSections,
  sectionGroups: aiDisclosureTemplate.sectionGroups,
};

// AI Full — Immediate + Core/Enhanced + full AAPOR disclosure
export const aiFullTemplate: FormTemplate = {
  id: "ai-full",
  name: "Full AAPOR + AI Disclosure",
  description:
    "Full AAPOR code and AI disclosure for academic publication.",
  sections: [...aiDisclosureSections, ...aaporSections],
  sectionGroups: aiDisclosureTemplate.sectionGroups,
  extraAaporSectionIds: aaporTemplate.sectionGroups[0].sectionIds,
};

// All available templates (legacy + new tiered templates)
export const allTemplates: FormTemplate[] = [
  aiDisclosureTemplate,
  aaporTemplate,
  aiSimpleTemplate,
  aiEnhancedTemplate,
  aiFullTemplate,
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

// Returns true for any AI-disclosure-style template (legacy + simple/enhanced/full).
export function isAIDisclosureTemplate(
  templateId: string | undefined,
): boolean {
  if (!templateId) return false;
  return (
    templateId === "ai-disclosure" ||
    templateId === "ai-simple" ||
    templateId === "ai-enhanced" ||
    templateId === "ai-full"
  );
}

// Default template
export const DEFAULT_TEMPLATE_ID = "ai-enhanced";