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
    fontSize: 12,
    marginTop: 15,
    marginBottom: 8,
    fontWeight: "bold",
    color: "#736be7",
  },
  instanceLabel: {
    fontSize: 11,
    marginTop: 10,
    marginBottom: 6,
    fontWeight: "bold",
    color: "#555",
    backgroundColor: "#f5f5f5",
    padding: 4,
  },
  cardSummary: {
    fontSize: 9,
    marginBottom: 10,
    color: "#666",
    fontStyle: "italic",
  },
  questionLabel: {
    fontSize: 11,
    marginTop: 8,
    marginBottom: 4,
    fontWeight: "bold",
    color: "#333",
  },
  answer: {
    fontSize: 10,
    marginBottom: 8,
    marginLeft: 10,
    color: "#555",
  },
  noAnswer: {
    fontSize: 10,
    marginBottom: 8,
    marginLeft: 10,
    color: "#999",
    fontStyle: "italic",
  },
});

type FormPDFProps = {
  formTitle: string;
  formData: Record<string, any>;
  instancesData?: Record<string, Record<string, any>[]>;
  includeEmpty?: boolean;
  templateId?: string;
};

export const FormPDF = ({
  formTitle,
  formData,
  instancesData = {},
  includeEmpty = true,
  templateId = DEFAULT_TEMPLATE_ID,
}: FormPDFProps) => {
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

  const renderInstance = (
    card: CardData,
    instance: Record<string, any>,
    instanceIndex: number,
    totalInstances: number,
  ) => {
    // Check if this instance has any answers
    const hasAnswers = card.questions.some((q) => instance[q.id]?.trim());
    if (!includeEmpty && !hasAnswers) return null;

    return (
      <View key={instanceIndex}>
        {totalInstances > 1 && (
          <Text style={styles.instanceLabel}>AI Tool {instanceIndex + 1}</Text>
        )}
        {card.questions.map((question) => {
          const answer = instance[question.id];

          // Skip conditional questions that shouldn't be shown
          if (!shouldShowQuestion(question.id, instance)) return null;

          // Skip unanswered questions if includeEmpty is false
          if (!includeEmpty && !answer?.trim()) return null;

          return (
            <View key={`${instanceIndex}-${question.id}`}>
              <Text style={styles.questionLabel}>
                {question.label}
                {question.required && " *"}
              </Text>
              {answer ? (
                <Text style={styles.answer}>{answer}</Text>
              ) : (
                <Text style={styles.noAnswer}>Not answered</Text>
              )}
            </View>
          );
        })}
      </View>
    );
  };

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
    if (!includeEmpty && !hasAnyAnswers) return null;

    return (
      <View key={card.id}>
        <Text style={styles.cardTitle}>{card.title}</Text>
        {instances.map((instance, idx) =>
          renderInstance(card, instance, idx, instances.length),
        )}
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
              return card ? renderCard(card) : null;
            })}
          </View>
        ))}
      </Page>
    </Document>
  );
};
