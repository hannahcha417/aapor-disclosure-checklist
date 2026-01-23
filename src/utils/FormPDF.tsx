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
    fontSize: 12,
    marginTop: 15,
    marginBottom: 8,
    fontWeight: "bold",
    color: "#736be7",
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
  includeEmpty?: boolean;
};

export const FormPDF = ({
  formTitle,
  formData,
  includeEmpty = true,
}: FormPDFProps) => {
  // Group cards by section
  const immediateDisclosures = ["tasks-performed", "human-oversight"];
  const coreEnhanced = [
    "model-details",
    "access-tooling-details",
    "core-prompts",
    "additional-enhanced-disclosures",
    "human-respondents-disclosure",
  ];

  const renderCard = (card: CardData) => {
    // Check if card has any answers
    const hasAnswers = card.questions.some((q) => formData[q.id]?.trim());
    if (!includeEmpty && !hasAnswers) return null;

    return (
      <View key={card.id}>
        <Text style={styles.cardTitle}>{card.title}</Text>

        {card.questions.map((question, index) => {
          const answer = formData[question.id];

          // Skip unanswered questions if includeEmpty is false
          if (!includeEmpty && !answer?.trim()) return null;

          // Apply the same numbering logic as ExpandableCard
          let questionNumber: string | number;
          if (question.id === "q9") {
            questionNumber = "4a";
          } else if (["q10", "q11", "q12"].includes(question.id)) {
            questionNumber = index;
          } else {
            questionNumber = index + 1;
          }

          return (
            <View key={question.id}>
              <Text style={styles.questionLabel}>
                {questionNumber}. {question.label}
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
        {immediateDisclosureCards.map((card) => renderCard(card))}
        <Text style={styles.sectionTitle}>Core/Enhanced Questions</Text>
        {coreEnhancedCards.map((card) => renderCard(card))}
      </Page>
    </Document>
  );
};
