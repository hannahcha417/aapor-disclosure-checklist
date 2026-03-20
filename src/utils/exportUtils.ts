import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { getTemplateById, DEFAULT_TEMPLATE_ID } from "../data/templates";
import type { CardData } from "../data/formData";

// Helper function to check if a question should be shown based on conditional logic
function shouldShowQuestion(
  questionId: string,
  instance: Record<string, any>,
  role?: string, // Role from tasks-performed (q1) for this instance
  templateId?: string, // Template ID to check which conditionals apply
): boolean {
  // AI Disclosure form conditionals:
  // q6 (Instrument/Interface) and q7 (Disclosure Possible) only show if q5 is "Embedded in third-party platform/tool"
  if (
    (questionId === "q6" || questionId === "q7") &&
    instance["q5"] !== "Embedded in third-party platform/tool"
  ) {
    return false;
  }
  // q13 (AI as Interviewer) only shows if the role is "Interviewer"
  if (questionId === "q13") {
    const instanceRole = role || instance["q1"];
    if (instanceRole !== "Interviewer") {
      return false;
    }
  }
  // q18 (Fine-Tuning Details) only shows if q17 is "Yes"
  if (questionId === "q18" && instance["q17"] !== "Yes") {
    return false;
  }
  // AAPOR Required Disclosure form conditional questions (only for non-AI-disclosure templates)
  if (templateId !== "ai-disclosure") {
    // Panel Information: q21 only shows if q20 is "Yes"
    if (questionId === "q21" && instance["q20"] !== "Yes") {
      return false;
    }
    // Interviewer or Coders: q23 only shows if q22 is "Yes"
    if (questionId === "q23" && instance["q22"] !== "Yes") {
      return false;
    }
    // Eligibility Screening: q25 only shows if q24 is "Yes"
    if (questionId === "q25" && instance["q24"] !== "Yes") {
      return false;
    }
  }
  return true;
}

// Helper function to check if a section should be shown based on conditional logic
function shouldShowSection(
  sectionId: string,
  instancesData: Record<string, Record<string, any>[]>,
  instanceIndex: number,
): boolean {
  // model-details (4a) and core-prompts (4b) only show if:
  // - q5 = Direct or First-party, OR
  // - q5 = Third-party AND q7 = Yes
  if (sectionId === "model-details" || sectionId === "core-prompts") {
    const accessMethod =
      instancesData["access-infrastructure"]?.[instanceIndex]?.["q5"] || "";
    const disclosurePossible =
      instancesData["access-infrastructure"]?.[instanceIndex]?.["q7"] || "";

    const isDirect = accessMethod.includes("Direct");
    const isFirstParty = accessMethod.includes("First-party");
    const isThirdPartyWithDisclosure =
      accessMethod.includes("third-party") && disclosurePossible === "Yes";

    if (!isDirect && !isFirstParty && !isThirdPartyWithDisclosure) {
      return false;
    }
  }
  return true;
}

// Generate detailed (numbered) content with multi-instance support
function generateDetailedContent(
  formTitle: string,
  formData: Record<string, any>,
  instancesData: Record<string, Record<string, any>[]> = {},
  includeEmpty: boolean = true,
  templateId: string = DEFAULT_TEMPLATE_ID,
): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const template = getTemplateById(templateId);

  if (!template) {
    return paragraphs;
  }

  // Get role labels from first card for AI disclosure template
  const getRoleLabel = (instanceIndex: number): string => {
    if (templateId === "ai-disclosure") {
      const firstCardInstances = instancesData["tasks-performed"] || [];
      const role = firstCardInstances[instanceIndex]?.["q1"];
      if (role) return `${role} Use Case`;
    }
    return templateId === "ai-disclosure" ? "AI Tool" : "Data Source";
  };
  // Get raw role value for conditional logic
  const getRole = (instanceIndex: number): string | undefined => {
    if (templateId === "ai-disclosure") {
      const firstCardInstances = instancesData["tasks-performed"] || [];
      return firstCardInstances[instanceIndex]?.["q1"];
    }
    return undefined;
  };

  // Title
  paragraphs.push(
    new Paragraph({
      text: formTitle,
      heading: HeadingLevel.TITLE,
      spacing: { after: 400 },
    }),
  );

  // Helper to render a single instance of a card
  const renderCardInstance = (
    card: CardData,
    instance: Record<string, any>,
    instanceIndex: number,
  ) => {
    // Check if this instance has any answers
    const hasAnswers = card.questions.some((q) => instance[q.id]?.trim());
    if (!includeEmpty && !hasAnswers) return;

    // Card title
    paragraphs.push(
      new Paragraph({
        text: card.title,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
      }),
    );

    card.questions.forEach((question) => {
      const answer = instance[question.id];

      // Skip conditional questions that shouldn't be shown
      if (
        !shouldShowQuestion(
          question.id,
          instance,
          getRole(instanceIndex),
          templateId,
        )
      )
        return;

      // Skip unanswered questions if includeEmpty is false
      if (!includeEmpty && !answer?.trim()) return;

      // Question
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${question.label}${question.required ? " *" : ""}`,
              bold: true,
            }),
          ],
          spacing: { before: 150 },
        }),
      );

      // Answer
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: answer || "Not answered",
              italics: !answer,
              color: answer ? "000000" : "999999",
            }),
          ],
          indent: { left: 400 },
          spacing: { after: 100 },
        }),
      );
    });
  };

  // For AI Disclosure: render USE CASE by USE CASE
  if (templateId === "ai-disclosure") {
    const numUseCases = (instancesData["tasks-performed"] || [{}]).length;

    for (let useCaseIndex = 0; useCaseIndex < numUseCases; useCaseIndex++) {
      const useCaseLabel = getRoleLabel(useCaseIndex);
      const useCaseTitle =
        numUseCases > 1 ? `${useCaseLabel} ${useCaseIndex + 1}` : useCaseLabel;

      // Use case header
      paragraphs.push(
        new Paragraph({
          text: useCaseTitle,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
      );

      // Render each section group for this use case
      template.sectionGroups.forEach((group) => {
        // Section group header (Immediate Disclosures, Core/Enhanced Questions)
        if (group.title) {
          paragraphs.push(
            new Paragraph({
              text: group.title,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 100 },
            }),
          );
        }
        if (group.description) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: group.description,
                  italics: true,
                  color: "666666",
                }),
              ],
              spacing: { after: 150 },
            }),
          );
        }

        // Render each card for this use case
        group.sectionIds.forEach((sectionId) => {
          const card = template.sections.find((s) => s.id === sectionId);
          if (!card) return;

          // Check if this section should be shown for this use case
          if (!shouldShowSection(sectionId, instancesData, useCaseIndex))
            return;

          const instance = instancesData[sectionId]?.[useCaseIndex] || formData;
          renderCardInstance(card, instance, useCaseIndex);
        });
      });
    }
  } else {
    // For non-AI-disclosure templates: render section by section (original behavior)
    const renderCard = (card: CardData) => {
      const instances =
        instancesData[card.id] && instancesData[card.id].length > 0
          ? instancesData[card.id]
          : [formData];

      const hasAnyAnswers = instances.some((instance) =>
        card.questions.some((q) => instance[q.id]?.trim()),
      );
      if (!includeEmpty && !hasAnyAnswers) return;

      paragraphs.push(
        new Paragraph({
          text: card.title,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        }),
      );

      instances.forEach((instance, idx) => {
        const hasAnswers = card.questions.some((q) => instance[q.id]?.trim());
        if (!includeEmpty && !hasAnswers) return;

        const instanceLabel = getRoleLabel(idx);
        if (instances.length > 1) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${instanceLabel} ${idx + 1}`,
                  bold: true,
                  color: "555555",
                }),
              ],
              spacing: { before: 200, after: 100 },
            }),
          );
        }

        card.questions.forEach((question) => {
          const answer = instance[question.id];
          if (
            !shouldShowQuestion(question.id, instance, getRole(idx), templateId)
          )
            return;
          if (!includeEmpty && !answer?.trim()) return;

          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${question.label}${question.required ? " *" : ""}`,
                  bold: true,
                }),
              ],
              spacing: { before: 150 },
            }),
          );

          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: answer || "Not answered",
                  italics: !answer,
                  color: answer ? "000000" : "999999",
                }),
              ],
              indent: { left: 400 },
              spacing: { after: 100 },
            }),
          );
        });
      });
    };

    template.sectionGroups.forEach((group) => {
      if (group.title) {
        paragraphs.push(
          new Paragraph({
            text: group.title,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
        );
      }

      group.sectionIds.forEach((sectionId) => {
        const card = template.sections.find((s) => s.id === sectionId);
        if (card) {
          renderCard(card);
        }
      });
    });
  }

  return paragraphs;
}

// Generate summary (paragraph) content with multi-instance support
function generateSummaryContent(
  formTitle: string,
  formData: Record<string, any>,
  instancesData: Record<string, Record<string, any>[]> = {},
  includeEmpty: boolean = true,
  templateId: string = DEFAULT_TEMPLATE_ID,
): Paragraph[] {
  const paragraphs: Paragraph[] = [];
  const template = getTemplateById(templateId);

  if (!template) {
    return paragraphs;
  }

  // Get role labels from first card for AI disclosure template
  const getRoleLabel = (instanceIndex: number): string => {
    if (templateId === "ai-disclosure") {
      const firstCardInstances = instancesData["tasks-performed"] || [];
      const role = firstCardInstances[instanceIndex]?.["q1"];
      if (role) return `${role} Use Case`;
    }
    return templateId === "ai-disclosure" ? "AI Tool" : "Data Source";
  };
  // Get raw role value for conditional logic
  const getRole = (instanceIndex: number): string | undefined => {
    if (templateId === "ai-disclosure") {
      const firstCardInstances = instancesData["tasks-performed"] || [];
      return firstCardInstances[instanceIndex]?.["q1"];
    }
    return undefined;
  };

  // Title
  paragraphs.push(
    new Paragraph({
      text: formTitle,
      heading: HeadingLevel.TITLE,
      spacing: { after: 400 },
    }),
  );

  // Helper to render a single instance of a card as summary
  const renderCardInstanceSummary = (
    card: CardData,
    instance: Record<string, any>,
    instanceIndex: number,
  ) => {
    // Collect all non-empty answers for this instance, filtering out conditional questions
    const answers = card.questions
      .filter((question) =>
        shouldShowQuestion(
          question.id,
          instance,
          getRole(instanceIndex),
          templateId,
        ),
      )
      .map((question) => instance[question.id])
      .filter((answer) => answer && answer.trim());

    // Skip if no answers and includeEmpty is false
    if (!includeEmpty && answers.length === 0) return;

    // Card title
    paragraphs.push(
      new Paragraph({
        text: card.title,
        heading: HeadingLevel.HEADING_3,
        spacing: { before: 200, after: 100 },
      }),
    );

    if (answers.length > 0) {
      paragraphs.push(
        new Paragraph({
          text: answers.join(" "),
          spacing: { after: 200 },
        }),
      );
    } else {
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: "No answer",
              italics: true,
              color: "999999",
            }),
          ],
          spacing: { after: 200 },
        }),
      );
    }
  };

  // For AI Disclosure: render USE CASE by USE CASE
  if (templateId === "ai-disclosure") {
    const numUseCases = (instancesData["tasks-performed"] || [{}]).length;

    for (let useCaseIndex = 0; useCaseIndex < numUseCases; useCaseIndex++) {
      const useCaseLabel = getRoleLabel(useCaseIndex);
      const useCaseTitle =
        numUseCases > 1 ? `${useCaseLabel} ${useCaseIndex + 1}` : useCaseLabel;

      // Use case header
      paragraphs.push(
        new Paragraph({
          text: useCaseTitle,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
      );

      // Render each section group for this use case
      template.sectionGroups.forEach((group) => {
        // Section group header
        if (group.title) {
          paragraphs.push(
            new Paragraph({
              text: group.title,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 300, after: 100 },
            }),
          );
        }

        // Render each card for this use case
        group.sectionIds.forEach((sectionId) => {
          const card = template.sections.find((s) => s.id === sectionId);
          if (!card) return;

          // Check if this section should be shown for this use case
          if (!shouldShowSection(sectionId, instancesData, useCaseIndex))
            return;

          const instance = instancesData[sectionId]?.[useCaseIndex] || formData;
          renderCardInstanceSummary(card, instance, useCaseIndex);
        });
      });
    }
  } else {
    // For non-AI-disclosure templates: render section by section (original behavior)
    const renderCardSummary = (card: CardData) => {
      const instances =
        instancesData[card.id] && instancesData[card.id].length > 0
          ? instancesData[card.id]
          : [formData];

      const hasAnyAnswers = instances.some((instance) =>
        card.questions.some((q) => instance[q.id]?.trim()),
      );
      if (!includeEmpty && !hasAnyAnswers) return;

      paragraphs.push(
        new Paragraph({
          text: card.title,
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 300, after: 200 },
        }),
      );

      instances.forEach((instance, idx) => {
        const answers = card.questions
          .filter((question) =>
            shouldShowQuestion(question.id, instance, getRole(idx), templateId),
          )
          .map((question) => instance[question.id])
          .filter((answer) => answer && answer.trim());

        if (!includeEmpty && answers.length === 0) return;

        const instanceLabel = getRoleLabel(idx);
        if (instances.length > 1) {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: `${instanceLabel} ${idx + 1}:`,
                  bold: true,
                  color: "555555",
                }),
              ],
              spacing: { before: 150, after: 50 },
            }),
          );
        }

        if (answers.length > 0) {
          paragraphs.push(
            new Paragraph({
              text: answers.join(" "),
              spacing: { after: 200 },
            }),
          );
        } else {
          paragraphs.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: "No answer",
                  italics: true,
                  color: "999999",
                }),
              ],
              spacing: { after: 200 },
            }),
          );
        }
      });
    };

    template.sectionGroups.forEach((group) => {
      if (group.title) {
        paragraphs.push(
          new Paragraph({
            text: group.title,
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 400, after: 200 },
          }),
        );
      }

      group.sectionIds.forEach((sectionId) => {
        const card = template.sections.find((s) => s.id === sectionId);
        if (card) {
          renderCardSummary(card);
        }
      });
    });
  }

  return paragraphs;
}

export async function generateDocx(
  formTitle: string,
  formData: Record<string, any>,
  instancesData: Record<string, Record<string, any>[]> = {},
  format: "detailed" | "summary",
  includeEmpty: boolean = true,
  templateId: string = DEFAULT_TEMPLATE_ID,
): Promise<Blob> {
  const paragraphs =
    format === "summary"
      ? generateSummaryContent(
          formTitle,
          formData,
          instancesData,
          includeEmpty,
          templateId,
        )
      : generateDetailedContent(
          formTitle,
          formData,
          instancesData,
          includeEmpty,
          templateId,
        );

  const doc = new Document({
    sections: [
      {
        children: paragraphs,
      },
    ],
  });

  const buffer = await Packer.toBlob(doc);
  return new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });
}

// Generate detailed (numbered) text content with multi-instance support
function generateDetailedText(
  formTitle: string,
  formData: Record<string, any>,
  instancesData: Record<string, Record<string, any>[]> = {},
  includeEmpty: boolean = true,
  templateId: string = DEFAULT_TEMPLATE_ID,
): string {
  let text = `${formTitle}\n${"=".repeat(formTitle.length)}\n\n`;
  const template = getTemplateById(templateId);

  if (!template) {
    return text;
  }

  // Get role labels from first card for AI disclosure template
  const getRoleLabel = (instanceIndex: number): string => {
    if (templateId === "ai-disclosure") {
      const firstCardInstances = instancesData["tasks-performed"] || [];
      const role = firstCardInstances[instanceIndex]?.["q1"];
      if (role) return `${role} Use Case`;
    }
    return templateId === "ai-disclosure" ? "AI Tool" : "Data Source";
  };
  // Get raw role value for conditional logic
  const getRole = (instanceIndex: number): string | undefined => {
    if (templateId === "ai-disclosure") {
      const firstCardInstances = instancesData["tasks-performed"] || [];
      return firstCardInstances[instanceIndex]?.["q1"];
    }
    return undefined;
  };

  // Helper to render a single card instance
  const renderCardInstance = (
    card: CardData,
    instance: Record<string, any>,
    instanceIndex: number,
  ) => {
    const hasAnswers = card.questions.some((q) => instance[q.id]?.trim());
    if (!includeEmpty && !hasAnswers) return;

    text += `\n${card.title}\n${"-".repeat(card.title.length)}\n`;

    card.questions.forEach((question) => {
      const answer = instance[question.id];
      if (
        !shouldShowQuestion(
          question.id,
          instance,
          getRole(instanceIndex),
          templateId,
        )
      )
        return;
      if (!includeEmpty && !answer?.trim()) return;

      text += `\n${question.label}${question.required ? " *" : ""}\n`;
      text += `   ${answer || "Not answered"}\n`;
    });
  };

  // For AI Disclosure: render USE CASE by USE CASE
  if (templateId === "ai-disclosure") {
    const numUseCases = (instancesData["tasks-performed"] || [{}]).length;

    for (let useCaseIndex = 0; useCaseIndex < numUseCases; useCaseIndex++) {
      const useCaseLabel = getRoleLabel(useCaseIndex);
      const useCaseTitle =
        numUseCases > 1 ? `${useCaseLabel} ${useCaseIndex + 1}` : useCaseLabel;

      text += `\n${useCaseTitle.toUpperCase()}\n${"=".repeat(useCaseTitle.length)}\n`;

      template.sectionGroups.forEach((group) => {
        if (group.title) {
          text += `\n${group.title}\n${"-".repeat(group.title.length)}\n`;
        }

        group.sectionIds.forEach((sectionId) => {
          const card = template.sections.find((s) => s.id === sectionId);
          if (!card) return;
          if (!shouldShowSection(sectionId, instancesData, useCaseIndex))
            return;

          const instance = instancesData[sectionId]?.[useCaseIndex] || formData;
          renderCardInstance(card, instance, useCaseIndex);
        });
      });
    }
  } else {
    // For non-AI-disclosure templates: render section by section
    const renderCard = (card: CardData) => {
      const instances =
        instancesData[card.id] && instancesData[card.id].length > 0
          ? instancesData[card.id]
          : [formData];

      const hasAnyAnswers = instances.some((instance) =>
        card.questions.some((q) => instance[q.id]?.trim()),
      );
      if (!includeEmpty && !hasAnyAnswers) return;

      text += `\n${card.title}\n${"-".repeat(card.title.length)}\n`;

      instances.forEach((instance, instanceIndex) => {
        const hasAnswers = card.questions.some((q) => instance[q.id]?.trim());
        if (!includeEmpty && !hasAnswers) return;

        const instanceLabel = getRoleLabel(instanceIndex);
        if (instances.length > 1) {
          text += `\n[${instanceLabel} ${instanceIndex + 1}]\n`;
        }

        card.questions.forEach((question) => {
          const answer = instance[question.id];
          if (
            !shouldShowQuestion(
              question.id,
              instance,
              getRole(instanceIndex),
              templateId,
            )
          )
            return;
          if (!includeEmpty && !answer?.trim()) return;

          text += `\n${question.label}${question.required ? " *" : ""}\n`;
          text += `   ${answer || "Not answered"}\n`;
        });
      });
    };

    template.sectionGroups.forEach((group) => {
      if (group.title) {
        text +=
          `\n${group.title.toUpperCase()}\n` +
          "=".repeat(group.title.length) +
          "\n";
      }

      group.sectionIds.forEach((sectionId) => {
        const card = template.sections.find((s) => s.id === sectionId);
        if (card) {
          renderCard(card);
        }
      });
    });
  }

  return text;
}

// Generate summary (paragraph) text content with multi-instance support
function generateSummaryText(
  formTitle: string,
  formData: Record<string, any>,
  instancesData: Record<string, Record<string, any>[]> = {},
  includeEmpty: boolean = true,
  templateId: string = DEFAULT_TEMPLATE_ID,
): string {
  let text = `${formTitle}\n${"=".repeat(formTitle.length)}\n\n`;
  const template = getTemplateById(templateId);

  if (!template) {
    return text;
  }

  // Get role labels from first card for AI disclosure template
  const getRoleLabel = (instanceIndex: number): string => {
    if (templateId === "ai-disclosure") {
      const firstCardInstances = instancesData["tasks-performed"] || [];
      const role = firstCardInstances[instanceIndex]?.["q1"];
      if (role) return `${role} Use Case`;
    }
    return templateId === "ai-disclosure" ? "AI Tool" : "Data Source";
  };
  // Get raw role value for conditional logic
  const getRole = (instanceIndex: number): string | undefined => {
    if (templateId === "ai-disclosure") {
      const firstCardInstances = instancesData["tasks-performed"] || [];
      return firstCardInstances[instanceIndex]?.["q1"];
    }
    return undefined;
  };

  // Helper to render a single card instance as summary
  const renderCardInstanceSummary = (
    card: CardData,
    instance: Record<string, any>,
    instanceIndex: number,
  ) => {
    const answers = card.questions
      .filter((question) =>
        shouldShowQuestion(
          question.id,
          instance,
          getRole(instanceIndex),
          templateId,
        ),
      )
      .map((question) => instance[question.id])
      .filter((answer) => answer && answer.trim());

    if (!includeEmpty && answers.length === 0) return;

    text += `\n${card.title}\n${"-".repeat(card.title.length)}\n`;

    if (answers.length > 0) {
      text += answers.join(" ") + "\n";
    } else {
      text += "No answer\n";
    }
  };

  // For AI Disclosure: render USE CASE by USE CASE
  if (templateId === "ai-disclosure") {
    const numUseCases = (instancesData["tasks-performed"] || [{}]).length;

    for (let useCaseIndex = 0; useCaseIndex < numUseCases; useCaseIndex++) {
      const useCaseLabel = getRoleLabel(useCaseIndex);
      const useCaseTitle =
        numUseCases > 1 ? `${useCaseLabel} ${useCaseIndex + 1}` : useCaseLabel;

      text += `\n${useCaseTitle.toUpperCase()}\n${"=".repeat(useCaseTitle.length)}\n`;

      template.sectionGroups.forEach((group) => {
        if (group.title) {
          text += `\n${group.title}\n${"-".repeat(group.title.length)}\n`;
        }

        group.sectionIds.forEach((sectionId) => {
          const card = template.sections.find((s) => s.id === sectionId);
          if (!card) return;
          if (!shouldShowSection(sectionId, instancesData, useCaseIndex))
            return;

          const instance = instancesData[sectionId]?.[useCaseIndex] || formData;
          renderCardInstanceSummary(card, instance, useCaseIndex);
        });
      });
    }
  } else {
    // For non-AI-disclosure templates: render section by section
    const renderCardSummary = (card: CardData) => {
      const instances =
        instancesData[card.id] && instancesData[card.id].length > 0
          ? instancesData[card.id]
          : [formData];

      const hasAnyAnswers = instances.some((instance) =>
        card.questions.some((q) => instance[q.id]?.trim()),
      );
      if (!includeEmpty && !hasAnyAnswers) return;

      text += `\n${card.title}\n${"-".repeat(card.title.length)}\n`;

      instances.forEach((instance, instanceIndex) => {
        const answers = card.questions
          .filter((question) =>
            shouldShowQuestion(
              question.id,
              instance,
              getRole(instanceIndex),
              templateId,
            ),
          )
          .map((question) => instance[question.id])
          .filter((answer) => answer && answer.trim());

        if (!includeEmpty && answers.length === 0) return;

        const instanceLabel = getRoleLabel(instanceIndex);
        if (instances.length > 1) {
          text += `\n[${instanceLabel} ${instanceIndex + 1}]\n`;
        }

        if (answers.length > 0) {
          text += answers.join(" ") + "\n";
        } else {
          text += "No answer\n";
        }
      });
    };

    template.sectionGroups.forEach((group) => {
      if (group.title) {
        text +=
          `\n${group.title.toUpperCase()}\n` +
          "=".repeat(group.title.length) +
          "\n";
      }

      group.sectionIds.forEach((sectionId) => {
        const card = template.sections.find((s) => s.id === sectionId);
        if (card) {
          renderCardSummary(card);
        }
      });
    });
  }

  return text;
}

export function generateTxt(
  formTitle: string,
  formData: Record<string, any>,
  instancesData: Record<string, Record<string, any>[]> = {},
  format: "detailed" | "summary",
  includeEmpty: boolean = true,
  templateId: string = DEFAULT_TEMPLATE_ID,
): Blob {
  const content =
    format === "summary"
      ? generateSummaryText(
          formTitle,
          formData,
          instancesData,
          includeEmpty,
          templateId,
        )
      : generateDetailedText(
          formTitle,
          formData,
          instancesData,
          includeEmpty,
          templateId,
        );

  return new Blob([content], { type: "text/plain;charset=utf-8" });
}

// Helper function to escape LaTeX special characters
function escapeLatex(text: string): string {
  if (!text) return "";
  return text
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

// Generate detailed LaTeX content with multi-instance support
function generateDetailedLatex(
  formTitle: string,
  formData: Record<string, any>,
  instancesData: Record<string, Record<string, any>[]> = {},
  includeEmpty: boolean = true,
  templateId: string = DEFAULT_TEMPLATE_ID,
): string {
  const template = getTemplateById(templateId);

  if (!template) {
    return "";
  }

  // Get role labels from first card for AI disclosure template
  const getRoleLabel = (instanceIndex: number): string => {
    if (templateId === "ai-disclosure") {
      const firstCardInstances = instancesData["tasks-performed"] || [];
      const role = firstCardInstances[instanceIndex]?.["q1"];
      if (role) return `${role} Use Case`;
    }
    return templateId === "ai-disclosure" ? "AI Tool" : "Data Source";
  };
  // Get raw role value for conditional logic
  const getRole = (instanceIndex: number): string | undefined => {
    if (templateId === "ai-disclosure") {
      const firstCardInstances = instancesData["tasks-performed"] || [];
      return firstCardInstances[instanceIndex]?.["q1"];
    }
    return undefined;
  };

  let latex = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=1in]{geometry}
\\usepackage{parskip}
\\usepackage{enumitem}

\\title{${escapeLatex(formTitle)}}
\\date{}

\\begin{document}
\\maketitle

`;

  // Helper to render a single card instance
  const renderCardInstance = (
    card: CardData,
    instance: Record<string, any>,
    instanceIndex: number,
  ) => {
    const hasAnswers = card.questions.some((q) => instance[q.id]?.trim());
    if (!includeEmpty && !hasAnswers) return;

    latex += `\\subsubsection*{${escapeLatex(card.title)}}\n\n`;

    card.questions.forEach((question) => {
      const answer = instance[question.id];
      if (
        !shouldShowQuestion(
          question.id,
          instance,
          getRole(instanceIndex),
          templateId,
        )
      )
        return;
      if (!includeEmpty && !answer?.trim()) return;

      latex += `\\textbf{${escapeLatex(question.label)}${question.required ? " *" : ""}}\n\n`;
      if (answer) {
        latex += `\\quad ${escapeLatex(answer)}\n\n`;
      } else {
        latex += `\\quad \\textit{Not answered}\n\n`;
      }
    });
  };

  // For AI Disclosure: render USE CASE by USE CASE
  if (templateId === "ai-disclosure") {
    const numUseCases = (instancesData["tasks-performed"] || [{}]).length;

    for (let useCaseIndex = 0; useCaseIndex < numUseCases; useCaseIndex++) {
      const useCaseLabel = getRoleLabel(useCaseIndex);
      const useCaseTitle =
        numUseCases > 1 ? `${useCaseLabel} ${useCaseIndex + 1}` : useCaseLabel;

      latex += `\\section*{${escapeLatex(useCaseTitle)}}\n\n`;

      template.sectionGroups.forEach((group) => {
        if (group.title) {
          latex += `\\subsection*{${escapeLatex(group.title)}}\n\n`;
        }

        group.sectionIds.forEach((sectionId) => {
          const card = template.sections.find((s) => s.id === sectionId);
          if (!card) return;
          if (!shouldShowSection(sectionId, instancesData, useCaseIndex))
            return;

          const instance = instancesData[sectionId]?.[useCaseIndex] || formData;
          renderCardInstance(card, instance, useCaseIndex);
        });
      });
    }
  } else {
    // For non-AI-disclosure templates: render section by section
    const renderCard = (card: CardData) => {
      const instances =
        instancesData[card.id] && instancesData[card.id].length > 0
          ? instancesData[card.id]
          : [formData];

      const hasAnyAnswers = instances.some((instance) =>
        card.questions.some((q) => instance[q.id]?.trim()),
      );
      if (!includeEmpty && !hasAnyAnswers) return;

      latex += `\\subsection*{${escapeLatex(card.title)}}\n\n`;

      instances.forEach((instance, instanceIndex) => {
        const hasAnswers = card.questions.some((q) => instance[q.id]?.trim());
        if (!includeEmpty && !hasAnswers) return;

        const instanceLabel = getRoleLabel(instanceIndex);
        if (instances.length > 1) {
          latex += `\\textbf{${instanceLabel} ${instanceIndex + 1}}\n\n`;
        }

        card.questions.forEach((question) => {
          const answer = instance[question.id];
          if (
            !shouldShowQuestion(
              question.id,
              instance,
              getRole(instanceIndex),
              templateId,
            )
          )
            return;
          if (!includeEmpty && !answer?.trim()) return;

          latex += `\\textbf{${escapeLatex(question.label)}${question.required ? " *" : ""}}\n\n`;
          if (answer) {
            latex += `\\quad ${escapeLatex(answer)}\n\n`;
          } else {
            latex += `\\quad \\textit{Not answered}\n\n`;
          }
        });
      });
    };

    template.sectionGroups.forEach((group) => {
      if (group.title) {
        latex += `\\section*{${escapeLatex(group.title)}}\n\n`;
      }

      group.sectionIds.forEach((sectionId) => {
        const card = template.sections.find((s) => s.id === sectionId);
        if (card) {
          renderCard(card);
        }
      });
    });
  }

  latex += `\\end{document}\n`;
  return latex;
}

// Generate summary LaTeX content with multi-instance support
function generateSummaryLatex(
  formTitle: string,
  formData: Record<string, any>,
  instancesData: Record<string, Record<string, any>[]> = {},
  includeEmpty: boolean = true,
  templateId: string = DEFAULT_TEMPLATE_ID,
): string {
  const template = getTemplateById(templateId);

  if (!template) {
    return "";
  }

  // Get role labels from first card for AI disclosure template
  const getRoleLabel = (instanceIndex: number): string => {
    if (templateId === "ai-disclosure") {
      const firstCardInstances = instancesData["tasks-performed"] || [];
      const role = firstCardInstances[instanceIndex]?.["q1"];
      if (role) return `${role} Use Case`;
    }
    return templateId === "ai-disclosure" ? "AI Tool" : "Data Source";
  };
  // Get raw role value for conditional logic
  const getRole = (instanceIndex: number): string | undefined => {
    if (templateId === "ai-disclosure") {
      const firstCardInstances = instancesData["tasks-performed"] || [];
      return firstCardInstances[instanceIndex]?.["q1"];
    }
    return undefined;
  };

  let latex = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=1in]{geometry}
\\usepackage{parskip}

\\title{${escapeLatex(formTitle)}}
\\date{}

\\begin{document}
\\maketitle

`;

  // Helper to render a single card instance as summary
  const renderCardInstanceSummary = (
    card: CardData,
    instance: Record<string, any>,
    instanceIndex: number,
  ) => {
    const answers = card.questions
      .filter((question) =>
        shouldShowQuestion(
          question.id,
          instance,
          getRole(instanceIndex),
          templateId,
        ),
      )
      .map((question) => instance[question.id])
      .filter((answer) => answer && answer.trim());

    if (!includeEmpty && answers.length === 0) return;

    latex += `\\subsubsection*{${escapeLatex(card.title)}}\n\n`;

    if (answers.length > 0) {
      latex += `${escapeLatex(answers.join(" "))}\n\n`;
    } else {
      latex += `\\textit{No answer}\n\n`;
    }
  };

  // For AI Disclosure: render USE CASE by USE CASE
  if (templateId === "ai-disclosure") {
    const numUseCases = (instancesData["tasks-performed"] || [{}]).length;

    for (let useCaseIndex = 0; useCaseIndex < numUseCases; useCaseIndex++) {
      const useCaseLabel = getRoleLabel(useCaseIndex);
      const useCaseTitle =
        numUseCases > 1 ? `${useCaseLabel} ${useCaseIndex + 1}` : useCaseLabel;

      latex += `\\section*{${escapeLatex(useCaseTitle)}}\n\n`;

      template.sectionGroups.forEach((group) => {
        if (group.title) {
          latex += `\\subsection*{${escapeLatex(group.title)}}\n\n`;
        }

        group.sectionIds.forEach((sectionId) => {
          const card = template.sections.find((s) => s.id === sectionId);
          if (!card) return;
          if (!shouldShowSection(sectionId, instancesData, useCaseIndex))
            return;

          const instance = instancesData[sectionId]?.[useCaseIndex] || formData;
          renderCardInstanceSummary(card, instance, useCaseIndex);
        });
      });
    }
  } else {
    // For non-AI-disclosure templates: render section by section
    const renderCardSummary = (card: CardData) => {
      const instances =
        instancesData[card.id] && instancesData[card.id].length > 0
          ? instancesData[card.id]
          : [formData];

      const hasAnyAnswers = instances.some((instance) =>
        card.questions.some((q) => instance[q.id]?.trim()),
      );
      if (!includeEmpty && !hasAnyAnswers) return;

      latex += `\\subsection*{${escapeLatex(card.title)}}\n\n`;

      instances.forEach((instance, instanceIndex) => {
        const answers = card.questions
          .filter((question) =>
            shouldShowQuestion(
              question.id,
              instance,
              getRole(instanceIndex),
              templateId,
            ),
          )
          .map((question) => instance[question.id])
          .filter((answer) => answer && answer.trim());

        if (!includeEmpty && answers.length === 0) return;

        const instanceLabel = getRoleLabel(instanceIndex);
        if (instances.length > 1) {
          latex += `\\textbf{${instanceLabel} ${instanceIndex + 1}:} `;
        }

        if (answers.length > 0) {
          latex += `${escapeLatex(answers.join(" "))}\n\n`;
        } else {
          latex += `\\textit{No answer}\n\n`;
        }
      });
    };

    template.sectionGroups.forEach((group) => {
      if (group.title) {
        latex += `\\section*{${escapeLatex(group.title)}}\n\n`;
      }

      group.sectionIds.forEach((sectionId) => {
        const card = template.sections.find((s) => s.id === sectionId);
        if (card) {
          renderCardSummary(card);
        }
      });
    });
  }

  latex += `\\end{document}\n`;
  return latex;
}

export function generateLatex(
  formTitle: string,
  formData: Record<string, any>,
  instancesData: Record<string, Record<string, any>[]> = {},
  format: "detailed" | "summary",
  includeEmpty: boolean = true,
  templateId: string = DEFAULT_TEMPLATE_ID,
): Blob {
  const content =
    format === "summary"
      ? generateSummaryLatex(
          formTitle,
          formData,
          instancesData,
          includeEmpty,
          templateId,
        )
      : generateDetailedLatex(
          formTitle,
          formData,
          instancesData,
          includeEmpty,
          templateId,
        );

  return new Blob([content], { type: "application/x-latex;charset=utf-8" });
}
