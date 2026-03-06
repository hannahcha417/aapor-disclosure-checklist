import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import { getTemplateById, DEFAULT_TEMPLATE_ID } from "../data/templates";
import type { CardData } from "../data/formData";

// Helper function to check if a question should be shown based on conditional logic
function shouldShowQuestion(
  questionId: string,
  instance: Record<string, any>,
): boolean {
  // AI Disclosure form: q9 only shows if q8 is "Yes"
  if (questionId === "q9" && instance["q8"] !== "Yes") {
    return false;
  }
  // AAPOR Required Disclosure form conditional questions
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

  // Title
  paragraphs.push(
    new Paragraph({
      text: formTitle,
      heading: HeadingLevel.TITLE,
      spacing: { after: 400 },
    }),
  );

  const renderCard = (card: CardData) => {
    // Get instances for this card, or fallback to formData
    const instances =
      instancesData[card.id] && instancesData[card.id].length > 0
        ? instancesData[card.id]
        : [formData];

    // Check if any instance has answers
    const hasAnyAnswers = instances.some((instance) =>
      card.questions.some((q) => instance[q.id]?.trim()),
    );
    if (!includeEmpty && !hasAnyAnswers) return;

    // Card title
    paragraphs.push(
      new Paragraph({
        text: card.title,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 },
      }),
    );

    instances.forEach((instance, instanceIndex) => {
      // Check if this instance has any answers
      const hasAnswers = card.questions.some((q) => instance[q.id]?.trim());
      if (!includeEmpty && !hasAnswers) return;

      // Instance label if multiple instances
      const instanceLabel =
        templateId === "ai-disclosure" ? "AI Tool" : "Data Source";
      if (instances.length > 1) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${instanceLabel} ${instanceIndex + 1}`,
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

        // Skip conditional questions that shouldn't be shown
        if (!shouldShowQuestion(question.id, instance)) return;

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
    });
  };

  // Render sections based on template's section groups
  template.sectionGroups.forEach((group) => {
    // Add section header if title exists
    if (group.title) {
      paragraphs.push(
        new Paragraph({
          text: group.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
      );
    }

    // Render each card in the section
    group.sectionIds.forEach((sectionId) => {
      const card = template.sections.find((s) => s.id === sectionId);
      if (card) {
        renderCard(card);
      }
    });
  });

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

  // Title
  paragraphs.push(
    new Paragraph({
      text: formTitle,
      heading: HeadingLevel.TITLE,
      spacing: { after: 400 },
    }),
  );

  const renderCardSummary = (card: CardData) => {
    // Get instances for this card, or fallback to formData
    const instances =
      instancesData[card.id] && instancesData[card.id].length > 0
        ? instancesData[card.id]
        : [formData];

    // Check if any instance has answers
    const hasAnyAnswers = instances.some((instance) =>
      card.questions.some((q) => instance[q.id]?.trim()),
    );

    // Skip card if no answers and includeEmpty is false
    if (!includeEmpty && !hasAnyAnswers) return;

    // Card title
    paragraphs.push(
      new Paragraph({
        text: card.title,
        heading: HeadingLevel.HEADING_2,
        spacing: { before: 300, after: 200 },
      }),
    );

    instances.forEach((instance, instanceIndex) => {
      // Collect all non-empty answers for this instance, filtering out conditional questions
      const answers = card.questions
        .filter((question) => shouldShowQuestion(question.id, instance))
        .map((question) => instance[question.id])
        .filter((answer) => answer && answer.trim());

      // Skip this instance if no answers and includeEmpty is false
      if (!includeEmpty && answers.length === 0) return;

      // Instance label if multiple instances
      const instanceLabel =
        templateId === "ai-disclosure" ? "AI Tool" : "Data Source";
      if (instances.length > 1) {
        paragraphs.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `${instanceLabel} ${instanceIndex + 1}:`,
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

  // Render sections based on template's section groups
  template.sectionGroups.forEach((group) => {
    // Add section header if title exists
    if (group.title) {
      paragraphs.push(
        new Paragraph({
          text: group.title,
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 400, after: 200 },
        }),
      );
    }

    // Render each card in the section
    group.sectionIds.forEach((sectionId) => {
      const card = template.sections.find((s) => s.id === sectionId);
      if (card) {
        renderCardSummary(card);
      }
    });
  });

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

  const renderCard = (card: CardData) => {
    // Get instances for this card, or fallback to formData
    const instances =
      instancesData[card.id] && instancesData[card.id].length > 0
        ? instancesData[card.id]
        : [formData];

    // Check if any instance has answers
    const hasAnyAnswers = instances.some((instance) =>
      card.questions.some((q) => instance[q.id]?.trim()),
    );
    if (!includeEmpty && !hasAnyAnswers) return;

    text += `\n${card.title}\n${"-".repeat(card.title.length)}\n`;

    instances.forEach((instance, instanceIndex) => {
      // Check if this instance has any answers
      const hasAnswers = card.questions.some((q) => instance[q.id]?.trim());
      if (!includeEmpty && !hasAnswers) return;

      // Instance label if multiple instances
      const instanceLabel =
        templateId === "ai-disclosure" ? "AI Tool" : "Data Source";
      if (instances.length > 1) {
        text += `\n[${instanceLabel} ${instanceIndex + 1}]\n`;
      }

      card.questions.forEach((question) => {
        const answer = instance[question.id];

        // Skip conditional questions that shouldn't be shown
        if (!shouldShowQuestion(question.id, instance)) return;

        // Skip unanswered questions if includeEmpty is false
        if (!includeEmpty && !answer?.trim()) return;

        text += `\n${question.label}${question.required ? " *" : ""}\n`;
        text += `   ${answer || "Not answered"}\n`;
      });
    });
  };

  // Render sections based on template's section groups
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

  const renderCardSummary = (card: CardData) => {
    // Get instances for this card, or fallback to formData
    const instances =
      instancesData[card.id] && instancesData[card.id].length > 0
        ? instancesData[card.id]
        : [formData];

    // Check if any instance has answers
    const hasAnyAnswers = instances.some((instance) =>
      card.questions.some((q) => instance[q.id]?.trim()),
    );

    // Skip card if no answers and includeEmpty is false
    if (!includeEmpty && !hasAnyAnswers) return;

    text += `\n${card.title}\n${"-".repeat(card.title.length)}\n`;

    instances.forEach((instance, instanceIndex) => {
      const answers = card.questions
        .filter((question) => shouldShowQuestion(question.id, instance))
        .map((question) => instance[question.id])
        .filter((answer) => answer && answer.trim());

      // Skip this instance if no answers and includeEmpty is false
      if (!includeEmpty && answers.length === 0) return;

      // Instance label if multiple instances
      const instanceLabel =
        templateId === "ai-disclosure" ? "AI Tool" : "Data Source";
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

  // Render sections based on template's section groups
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

      const instanceLabel =
        templateId === "ai-disclosure" ? "AI Tool" : "Data Source";
      if (instances.length > 1) {
        latex += `\\textbf{${instanceLabel} ${instanceIndex + 1}}\n\n`;
      }

      card.questions.forEach((question) => {
        const answer = instance[question.id];

        if (!shouldShowQuestion(question.id, instance)) return;
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

  let latex = `\\documentclass{article}
\\usepackage[utf8]{inputenc}
\\usepackage[margin=1in]{geometry}
\\usepackage{parskip}

\\title{${escapeLatex(formTitle)}}
\\date{}

\\begin{document}
\\maketitle

`;

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
        .filter((question) => shouldShowQuestion(question.id, instance))
        .map((question) => instance[question.id])
        .filter((answer) => answer && answer.trim());

      if (!includeEmpty && answers.length === 0) return;

      const instanceLabel =
        templateId === "ai-disclosure" ? "AI Tool" : "Data Source";
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
