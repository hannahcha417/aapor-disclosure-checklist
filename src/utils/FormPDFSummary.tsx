import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { getTemplateById, DEFAULT_TEMPLATE_ID } from "../data/templates";
import type { CardData } from "../data/formData";

// Helper function to check if conditional questions should be shown
function shouldShowQuestion(
  questionId: string,
  instance: Record<string, any>,
): boolean {
  // q9 is conditional on q8 being "Yes"
  if (questionId === "q9" && instance["q8"] !== "Yes") return false;
  // q21 is conditional on q20 being "Yes"
  if (questionId === "q21" && instance["q20"] !== "Yes") return false;
  // q23 is conditional on q22 being "Yes"
  if (questionId === "q23" && instance["q22"] !== "Yes") return false;
  // q25 is conditional on q24 being "Yes"
  if (questionId === "q25" && instance["q24"] !== "Yes") return false;
  return true;
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
  },
  sectionTitle: {
    fontSize: 16,
    marginTop: 20,
    fontWeight: "bold",
    color: "#333",
  },
  cardTitle: {
    fontSize: 13,
    marginTop: 8,
    marginBottom: 8,
    fontWeight: "bold",
    color: "#736be7",
  },
  instanceLabel: {
    fontSize: 11,
    marginTop: 6,
    marginBottom: 4,
    fontWeight: "bold",
    color: "#555",
  },
  summaryParagraph: {
    fontSize: 10,
    marginBottom: 12,
    lineHeight: 1.5,
    color: "#555",
    textAlign: "justify",
  },
  noAnswer: {
    fontSize: 10,
    marginBottom: 12,
    color: "#999",
    fontStyle: "italic",
  },
});

type FormPDFSummaryProps = {
  formTitle: string;
  formData: Record<string, any>;
  instancesData?: Record<string, Record<string, any>[]>;
  includeEmpty?: boolean;
  templateId?: string;
};

export const FormPDFSummary = ({
  formTitle,
  formData,
  instancesData = {},
  includeEmpty = true,
  templateId = DEFAULT_TEMPLATE_ID,
}: FormPDFSummaryProps) => {
  const template = getTemplateById(templateId);

  if (!template) {
    return (
      <Document>
        <Page style={styles.page}>
          <Text style={styles.title}>{formTitle}</Text>
          <Text>Template not found</Text>
        </Page>
      </Document>
    );
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
    if (!includeEmpty && !hasAnyAnswers) return null;

    return (
      <View key={card.id}>
        <Text style={styles.cardTitle}>{card.title}</Text>
        {instances.map((instance, idx) => {
          // Collect all non-empty answers for this instance, filtering out conditional questions
          const answers = card.questions
            .filter((question) => shouldShowQuestion(question.id, instance))
            .map((question) => instance[question.id])
            .filter((answer) => answer && answer.trim());

          // Skip this instance if no answers and includeEmpty is false
          if (!includeEmpty && answers.length === 0) return null;

          return (
            <View key={idx}>
              {instances.length > 1 && (
                <Text style={styles.instanceLabel}>AI Tool {idx + 1}:</Text>
              )}
              {answers.length > 0 ? (
                <Text style={styles.summaryParagraph}>{answers.join(" ")}</Text>
              ) : (
                <Text style={styles.noAnswer}>No answer</Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.title}>{formTitle}</Text>
        {template.sectionGroups.map((group) => (
          <View key={group.title || "default"}>
            {group.title && (
              <Text style={styles.sectionTitle}>{group.title}</Text>
            )}
            {group.sectionIds.map((sectionId) => {
              const card = template.sections.find((s) => s.id === sectionId);
              return card ? renderCardSummary(card) : null;
            })}
          </View>
        ))}
      </Page>
    </Document>
  );
};
