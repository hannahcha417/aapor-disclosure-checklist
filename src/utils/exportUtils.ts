import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { cardSections } from "../data/formData";
import type { CardData } from "../data/formData";

// Group cards by section
const immediateDisclosures = ["tasks-performed", "human-oversight"];
const coreEnhanced = [
  "model-details",
  "access-tooling-details",
  "core-prompts",
  "additional-enhanced-disclosures",
  "human-respondents-disclosure",
];

const immediateDisclosureCards = cardSections.filter((card) =>
  immediateDisclosures.includes(card.id)
);
const coreEnhancedCards = cardSections.filter((card) =>
  coreEnhanced.includes(card.id)
);

// Generate detailed (numbered) content with multi-instance support
function generateDetailedContent(
  formTitle: string,
  formData: Record<string, any>,
  instancesData: Record<string, Record<string, any>[]> = {},
  includeEmpty: boolean = true
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Title
  paragraphs.push(
    new Paragraph({
      text: formTitle,
      heading: HeadingLevel.TITLE,
      spacing: { after: 400 },
    })
  );

  const renderCard = (card: CardData) => {
    // Get instances for this card, or fallback to formData
    const instances =
      instancesData[card.id] && instancesData[card.id].length > 0
        ? instancesData[card.id]
        : [formData];

    // Check if any instance has answers
    const hasAnyAnswers = instances.some((instance) =>
      card.questions.some((q) => instance[q.id]?.trim())
    );
    if (!includeEmpty && !hasAnyAnswers) return;

    // Card title
    paragraphs.push(
      new Paragraph({
        text: card.title,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 },
      })
    );

    instances.forEach((instance, instanceIndex) => {
      // Check if this instance has any answers
      const hasAnswers = card.questions.some((q) => instance[q.id]?.trim());
      if (!includeEmpty && !hasAnswers) return;

      // Instance label if multiple instances
      if (instances.length > 1) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `AI Tool ${instanceIndex + 1}`,
                bold: true,
                color: "555555",
              }),
            ],
            spacing: { before: 200, after: 100 },
          })
        );
      }

      card.questions.forEach((question) => {
        const answer = instance[question.id];

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
          })
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
          })
        );
      });
    });
  };

  // Immediate Disclosures
  paragraphs.push(
    new Paragraph({
      text: "Immediate Disclosures",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );
  immediateDisclosureCards.forEach(renderCard);

  // Core/Enhanced Questions
  paragraphs.push(
    new Paragraph({
      text: "Core/Enhanced Questions",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );
  coreEnhancedCards.forEach(renderCard);

  return paragraphs;
}

// Generate summary (paragraph) content with multi-instance support
function generateSummaryContent(
  formTitle: string,
  formData: Record<string, any>,
  instancesData: Record<string, Record<string, any>[]> = {},
  includeEmpty: boolean = true
): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Title
  paragraphs.push(
    new Paragraph({
      text: formTitle,
      heading: HeadingLevel.TITLE,
      spacing: { after: 400 },
    })
  );

  const renderCardSummary = (card: CardData) => {
    // Get instances for this card, or fallback to formData
    const instances =
      instancesData[card.id] && instancesData[card.id].length > 0
        ? instancesData[card.id]
        : [formData];

    // Check if any instance has answers
    const hasAnyAnswers = instances.some((instance) =>
      card.questions.some((q) => instance[q.id]?.trim())
    );

    // Skip card if no answers and includeEmpty is false
    if (!includeEmpty && !hasAnyAnswers) return;

    // Card title
    paragraphs.push(
      new Paragraph({
        text: card.title,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 },
      })
    );

    instances.forEach((instance, instanceIndex) => {
      // Collect all non-empty answers for this instance
      const answers = card.questions
        .map((question) => instance[question.id])
        .filter((answer) => answer && answer.trim());

      // Skip this instance if no answers and includeEmpty is false
      if (!includeEmpty && answers.length === 0) return;

      // Instance label if multiple instances
      if (instances.length > 1) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `AI Tool ${instanceIndex + 1}:`,
                bold: true,
                color: "555555",
              }),
            ],
            spacing: { before: 150, after: 50 },
          })
        );
      }

      if (answers.length > 0) {
        paragraphs.push(
          new Paragraph({
            text: answers.join(" "),
            spacing: { after: 200 },
          })
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
          })
        );
      }
    });
  };

  // Immediate Disclosures
  paragraphs.push(
    new Paragraph({
      text: "Immediate Disclosures",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );
  immediateDisclosureCards.forEach(renderCardSummary);

  // Core/Enhanced Questions
  paragraphs.push(
    new Paragraph({
      text: "Core/Enhanced Questions",
      heading: HeadingLevel.HEADING_1,
      spacing: { before: 400, after: 200 },
    })
  );
  coreEnhancedCards.forEach(renderCardSummary);

  return paragraphs;
}

export async function generateDocx(
  formTitle: string,
  formData: Record<string, any>,
  instancesData: Record<string, Record<string, any>[]> = {},
  format: "detailed" | "summary",
  includeEmpty: boolean = true
): Promise<Blob> {
  const paragraphs =
    format === "summary"
      ? generateSummaryContent(formTitle, formData, instancesData, includeEmpty)
      : generateDetailedContent(
          formTitle,
          formData,
          instancesData,
          includeEmpty
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
  includeEmpty: boolean = true
): string {
  let text = `${formTitle}\n${"=".repeat(formTitle.length)}\n\n`;

  const renderCard = (card: CardData) => {
    // Get instances for this card, or fallback to formData
    const instances =
      instancesData[card.id] && instancesData[card.id].length > 0
        ? instancesData[card.id]
        : [formData];

    // Check if any instance has answers
    const hasAnyAnswers = instances.some((instance) =>
      card.questions.some((q) => instance[q.id]?.trim())
    );
    if (!includeEmpty && !hasAnyAnswers) return;

    text += `\n${card.title}\n${"-".repeat(card.title.length)}\n`;

    instances.forEach((instance, instanceIndex) => {
      // Check if this instance has any answers
      const hasAnswers = card.questions.some((q) => instance[q.id]?.trim());
      if (!includeEmpty && !hasAnswers) return;

      // Instance label if multiple instances
      if (instances.length > 1) {
        text += `\n[AI Tool ${instanceIndex + 1}]\n`;
      }

      card.questions.forEach((question) => {
        const answer = instance[question.id];

        // Skip unanswered questions if includeEmpty is false
        if (!includeEmpty && !answer?.trim()) return;

        text += `\n${question.label}${question.required ? " *" : ""}\n`;
        text += `   ${answer || "Not answered"}\n`;
      });
    });
  };

  text += "\nIMMEDIATE DISCLOSURES\n" + "=".repeat(21) + "\n";
  immediateDisclosureCards.forEach(renderCard);

  text += "\n\nCORE/ENHANCED QUESTIONS\n" + "=".repeat(23) + "\n";
  coreEnhancedCards.forEach(renderCard);

  return text;
}

// Generate summary (paragraph) text content with multi-instance support
function generateSummaryText(
  formTitle: string,
  formData: Record<string, any>,
  instancesData: Record<string, Record<string, any>[]> = {},
  includeEmpty: boolean = true
): string {
  let text = `${formTitle}\n${"=".repeat(formTitle.length)}\n\n`;

  const renderCardSummary = (card: CardData) => {
    // Get instances for this card, or fallback to formData
    const instances =
      instancesData[card.id] && instancesData[card.id].length > 0
        ? instancesData[card.id]
        : [formData];

    // Check if any instance has answers
    const hasAnyAnswers = instances.some((instance) =>
      card.questions.some((q) => instance[q.id]?.trim())
    );

    // Skip card if no answers and includeEmpty is false
    if (!includeEmpty && !hasAnyAnswers) return;

    text += `\n${card.title}\n${"-".repeat(card.title.length)}\n`;

    instances.forEach((instance, instanceIndex) => {
      const answers = card.questions
        .map((question) => instance[question.id])
        .filter((answer) => answer && answer.trim());

      // Skip this instance if no answers and includeEmpty is false
      if (!includeEmpty && answers.length === 0) return;

      // Instance label if multiple instances
      if (instances.length > 1) {
        text += `\n[AI Tool ${instanceIndex + 1}]\n`;
      }

      if (answers.length > 0) {
        text += answers.join(" ") + "\n";
      } else {
        text += "No answer\n";
      }
    });
  };

  text += "\nIMMEDIATE DISCLOSURES\n" + "=".repeat(21) + "\n";
  immediateDisclosureCards.forEach(renderCardSummary);

  text += "\n\nCORE/ENHANCED QUESTIONS\n" + "=".repeat(23) + "\n";
  coreEnhancedCards.forEach(renderCardSummary);

  return text;
}

export function generateTxt(
  formTitle: string,
  formData: Record<string, any>,
  instancesData: Record<string, Record<string, any>[]> = {},
  format: "detailed" | "summary",
  includeEmpty: boolean = true
): Blob {
  const content =
    format === "summary"
      ? generateSummaryText(formTitle, formData, instancesData, includeEmpty)
      : generateDetailedText(formTitle, formData, instancesData, includeEmpty);

  return new Blob([content], { type: "text/plain;charset=utf-8" });
}
