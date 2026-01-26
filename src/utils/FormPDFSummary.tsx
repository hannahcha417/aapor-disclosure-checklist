import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { cardSections } from "../data/formData";
import type { CardData } from "../data/formData";

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
};

export const FormPDFSummary = ({
  formTitle,
  formData,
  instancesData = {},
  includeEmpty = true,
}: FormPDFSummaryProps) => {
  // Group cards by section
  const immediateDisclosures = ["tasks-performed", "human-oversight"];
  const coreEnhanced = [
    "model-details",
    "access-tooling-details",
    "core-prompts",
    "additional-enhanced-disclosures",
    "human-respondents-disclosure",
  ];

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
    if (!includeEmpty && !hasAnyAnswers) return null;

    return (
      <View key={card.id}>
        <Text style={styles.cardTitle}>{card.title}</Text>
        {instances.map((instance, idx) => {
          // Collect all non-empty answers for this instance
          const answers = card.questions
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

  // Group cards by section
  const immediateDisclosureCards = cardSections.filter((card) =>
    immediateDisclosures.includes(card.id)
  );
  const coreEnhancedCards = cardSections.filter((card) =>
    coreEnhanced.includes(card.id)
  );

  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.title}>{formTitle}</Text>
        <Text style={styles.sectionTitle}>Immediate Disclosures</Text>
        {immediateDisclosureCards.map((card) => renderCardSummary(card))}
        <Text style={styles.sectionTitle}>Core/Enhanced Questions</Text>
        {coreEnhancedCards.map((card) => renderCardSummary(card))}
      </Page>
    </Document>
  );
};
