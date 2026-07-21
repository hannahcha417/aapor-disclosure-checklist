import { getTemplateById, isAIDisclosureTemplate } from "../data/templates";

// Shape of the payload persisted in `forms.form_data`.
// Instances live under the `instances` key keyed by sectionId.
type FormPayload = {
  instances?: Record<string, Record<string, any>[]>;
  [key: string]: any;
};

const isAnswered = (val: any): boolean => {
  if (val === undefined || val === null) return false;
  if (typeof val === "string") return val.trim() !== "";
  if (Array.isArray(val)) return val.length > 0;
  return true;
};

// Mirrors the per-question conditional visibility used by ExpandableCard
// and FormPage's iterateVisibleRequired.
const isQuestionVisible = (
  templateId: string,
  questionId: string,
  instance: Record<string, any>,
  role?: string,
): boolean => {
  if (isAIDisclosureTemplate(templateId)) {
    if (
      (questionId === "q6" || questionId === "q7") &&
      instance["q5"] !== "Embedded in third-party platform/tool"
    ) {
      return false;
    }
    if (questionId === "q13") {
      const instanceRole = role ?? instance["q1"];
      const roleValues = String(instanceRole || "")
        .split(",")
        .map((v) => v.trim());
      if (!roleValues.includes("Interviewer")) return false;
    }
    if (questionId === "q18" && instance["q17"] !== "Yes") return false;
  } else {
    if (questionId === "q21" && instance["q20"] !== "Yes") return false;
    if (questionId === "q23" && instance["q22"] !== "Yes") return false;
    if (questionId === "q25" && instance["q24"] !== "Yes") return false;
  }
  return true;
};

export type ProgressCounts = {
  answered: number;
  total: number;
  percent: number;
};

// Count answered vs total for every currently-visible required question,
// honoring the same conditional-visibility rules as the renderer.
export function computeFormProgress(
  templateId: string,
  formData: FormPayload | null | undefined,
): ProgressCounts {
  const template = getTemplateById(templateId);
  if (!template) return { answered: 0, total: 0, percent: 0 };

  const instancesData: Record<string, Record<string, any>[]> =
    formData?.instances || {};

  let answered = 0;
  let total = 0;

  const visitRequired = (
    sectionId: string,
    instance: Record<string, any>,
    role?: string,
  ) => {
    const card = template.sections.find((s) => s.id === sectionId);
    if (!card) return;
    card.questions.forEach((q) => {
      if (!q.required) return;
      if (!isQuestionVisible(templateId, q.id, instance, role)) return;
      total++;
      if (isAnswered(instance[q.id])) answered++;
    });
  };

  if (isAIDisclosureTemplate(templateId)) {
    const useCases = instancesData["tasks-performed"] || [{}];
    useCases.forEach((_, useCaseIndex) => {
      const roleLabel =
        instancesData["tasks-performed"]?.[useCaseIndex]?.["q1"] || "AI Tool";

      template.sectionGroups.forEach((group) => {
        group.sectionIds.forEach((sectionId) => {
          // Same conditional skip as the renderer for 4a / 4b
          if (sectionId === "model-details" || sectionId === "core-prompts") {
            const accessMethod =
              instancesData["access-infrastructure"]?.[useCaseIndex]?.[
                "q5"
              ] || "";
            const disclosurePossible =
              instancesData["access-infrastructure"]?.[useCaseIndex]?.[
                "q7"
              ] || "";
            const isDirect = accessMethod.includes("Direct");
            const isFirstParty = accessMethod.includes("First-party");
            const isThirdPartyWithDisclosure =
              accessMethod.includes("third-party") &&
              disclosurePossible === "Yes";
            if (!isDirect && !isFirstParty && !isThirdPartyWithDisclosure) {
              return;
            }
          }

          const instance =
            instancesData[sectionId]?.[useCaseIndex] || {};
          visitRequired(sectionId, instance, roleLabel);
        });
      });
    });

    // Extra AAPOR sections for the "full" template.
    (template.extraAaporSectionIds || []).forEach((sectionId) => {
      const instances = instancesData[sectionId] || [{}];
      instances.forEach((instance) => visitRequired(sectionId, instance));
    });
  } else {
    template.sectionGroups.forEach((group) => {
      group.sectionIds.forEach((sectionId) => {
        const instances = instancesData[sectionId] || [{}];
        instances.forEach((instance) => visitRequired(sectionId, instance));
      });
    });
  }

  const percent =
    total > 0 ? Math.round((answered / total) * 100) : 0;
  return { answered, total, percent };
}
