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

// Generate detailed (numbered) content
function generateDetailedContent(
  formTitle: string,
  formData: Record<string, any>,
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
    // Check if card has any answers
    const hasAnswers = card.questions.some((q) => formData[q.id]?.trim());
    if (!includeEmpty && !hasAnswers) return;

    // Card title
    paragraphs.push(
      new Paragraph({
        text: card.title,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 },
      })
    );

    card.questions.forEach((question, index) => {
      const answer = formData[question.id];

      // Skip unanswered questions if includeEmpty is false
      if (!includeEmpty && !answer?.trim()) return;

      // Apply the same numbering logic as ExpandableCard
      let questionNumber: string | number;
      if (question.id === "q9") {
        questionNumber = "4a";
      } else if (["q10", "q11", "q12"].includes(question.id)) {
        questionNumber = index;
      } else {
        questionNumber = index + 1;
      }

      // Question
      paragraphs.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `${questionNumber}. ${question.label}${
                question.required ? " *" : ""
              }`,
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

// Generate summary (paragraph) content
function generateSummaryContent(
  formTitle: string,
  formData: Record<string, any>,
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
    // Collect all non-empty answers
    const answers = card.questions
      .map((question) => formData[question.id])
      .filter((answer) => answer && answer.trim());

    // Skip card if no answers and includeEmpty is false
    if (!includeEmpty && answers.length === 0) return;

    // Card title
    paragraphs.push(
      new Paragraph({
        text: card.title,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 },
      })
    );

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
  format: "detailed" | "summary",
  includeEmpty: boolean = true
): Promise<Blob> {
  const paragraphs =
    format === "summary"
      ? generateSummaryContent(formTitle, formData, includeEmpty)
      : generateDetailedContent(formTitle, formData, includeEmpty);

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

// Generate detailed (numbered) text content
function generateDetailedText(
  formTitle: string,
  formData: Record<string, any>,
  includeEmpty: boolean = true
): string {
  let text = `${formTitle}\n${"=".repeat(formTitle.length)}\n\n`;

  const renderCard = (card: CardData) => {
    // Check if card has any answers
    const hasAnswers = card.questions.some((q) => formData[q.id]?.trim());
    if (!includeEmpty && !hasAnswers) return;

    text += `\n${card.title}\n${"-".repeat(card.title.length)}\n`;

    card.questions.forEach((question, index) => {
      const answer = formData[question.id];

      // Skip unanswered questions if includeEmpty is false
      if (!includeEmpty && !answer?.trim()) return;

      let questionNumber: string | number;
      if (question.id === "q9") {
        questionNumber = "4a";
      } else if (["q10", "q11", "q12"].includes(question.id)) {
        questionNumber = index;
      } else {
        questionNumber = index + 1;
      }

      text += `\n${questionNumber}. ${question.label}${
        question.required ? " *" : ""
      }\n`;
      text += `   ${answer || "Not answered"}\n`;
    });
  };

  text += "\nIMMEDIATE DISCLOSURES\n" + "=".repeat(21) + "\n";
  immediateDisclosureCards.forEach(renderCard);

  text += "\n\nCORE/ENHANCED QUESTIONS\n" + "=".repeat(23) + "\n";
  coreEnhancedCards.forEach(renderCard);

  return text;
}

// Generate summary (paragraph) text content
function generateSummaryText(
  formTitle: string,
  formData: Record<string, any>,
  includeEmpty: boolean = true
): string {
  let text = `${formTitle}\n${"=".repeat(formTitle.length)}\n\n`;

  const renderCardSummary = (card: CardData) => {
    const answers = card.questions
      .map((question) => formData[question.id])
      .filter((answer) => answer && answer.trim());

    // Skip card if no answers and includeEmpty is false
    if (!includeEmpty && answers.length === 0) return;

    text += `\n${card.title}\n${"-".repeat(card.title.length)}\n`;

    if (answers.length > 0) {
      text += answers.join(" ") + "\n";
    } else {
      text += "No answer\n";
    }
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
  format: "detailed" | "summary",
  includeEmpty: boolean = true
): Blob {
  const content =
    format === "summary"
      ? generateSummaryText(formTitle, formData, includeEmpty)
      : generateDetailedText(formTitle, formData, includeEmpty);

  return new Blob([content], { type: "text/plain;charset=utf-8" });
}
