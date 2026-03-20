import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { getTemplateById, DEFAULT_TEMPLATE_ID } from "../data/templates";
import type { CardData } from "../data/formData";

// Helper function to check if conditional questions should be shown
function shouldShowQuestion(
  questionId: string,
  instance: Record<string, any>,
  role?: string, // Role from tasks-performed for this instance
): boolean {
  // AI Disclosure form conditionals:
  // q6 (Instrument/Interface) and q7 (Disclosure Possible) only show if q5 is third-party
  if (
    (questionId === "q6" || questionId === "q7") &&
    instance["q5"] !== "Embedded in third-party platform/tool"
  )
    return false;
  // q13 (AI as Interviewer) only shows if the role is "Interviewer"
  if (questionId === "q13") {
    const instanceRole = role || instance["q1"];
    if (instanceRole !== "Interviewer") return false;
  }
  // q18 (Fine-Tuning Details) only shows if q17 is "Yes"
  if (questionId === "q18" && instance["q17"] !== "Yes") return false;
  // AAPOR form conditionals:
  // q21 is conditional on q20 being "Yes"
  if (questionId === "q21" && instance["q20"] !== "Yes") return false;
  // q23 is conditional on q22 being "Yes"
  if (questionId === "q23" && instance["q22"] !== "Yes") return false;
  // q25 is conditional on q24 being "Yes"
  if (questionId === "q25" && instance["q24"] !== "Yes") return false;
  return true;
}

// Helper function to check if a section should be shown for a specific instance
function shouldShowSection(
  sectionId: string,
  instancesData: Record<string, Record<string, any>[]>,
  instanceIndex: number,
): boolean {
  // model-details (4a) only shows if:
  // - q5 = Direct or First-party, OR
  // - q5 = Third-party AND q7 = Yes
  if (sectionId === "model-details") {
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

  // Helper to render a single card instance
  const renderCardInstance = (
    card: CardData,
    instance: Record<string, any>,
    instanceIndex: number,
  ) => {
    const hasAnswers = card.questions.some((q) => instance[q.id]?.trim());
    if (!includeEmpty && !hasAnswers) return null;

    return (
      <View key={`${card.id}-${instanceIndex}`}>
        <Text style={styles.cardTitle}>{card.title}</Text>
        {card.questions.map((question) => {
          const answer = instance[question.id];
          if (
            !shouldShowQuestion(question.id, instance, getRole(instanceIndex))
          )
            return null;
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

  // For AI Disclosure: render USE CASE by USE CASE
  if (templateId === "ai-disclosure") {
    const numUseCases = (instancesData["tasks-performed"] || [{}]).length;

    return (
      <Document>
        <Page style={styles.page}>
          <Text style={styles.title}>{formTitle}</Text>
          {Array.from({ length: numUseCases }).map((_, useCaseIndex) => {
            const useCaseLabel = getRoleLabel(useCaseIndex);
            const useCaseTitle =
              numUseCases > 1
                ? `${useCaseLabel} ${useCaseIndex + 1}`
                : useCaseLabel;

            return (
              <View key={useCaseIndex}>
                <Text style={styles.sectionTitle}>{useCaseTitle}</Text>
                {template.sectionGroups.map((group) => (
                  <View key={`${useCaseIndex}-${group.title}`}>
                    {group.title && (
                      <Text style={styles.cardTitle}>{group.title}</Text>
                    )}
                    {group.sectionIds.map((sectionId) => {
                      const card = template.sections.find(
                        (s) => s.id === sectionId,
                      );
                      if (!card) return null;
                      if (
                        !shouldShowSection(
                          sectionId,
                          instancesData,
                          useCaseIndex,
                        )
                      )
                        return null;

                      const instance =
                        instancesData[sectionId]?.[useCaseIndex] || formData;
                      return renderCardInstance(card, instance, useCaseIndex);
                    })}
                  </View>
                ))}
              </View>
            );
          })}
        </Page>
      </Document>
    );
  }

  // For non-AI-disclosure templates: render section by section
  const renderInstance = (
    card: CardData,
    instance: Record<string, any>,
    instanceIndex: number,
    totalInstances: number,
  ) => {
    const hasAnswers = card.questions.some((q) => instance[q.id]?.trim());
    if (!includeEmpty && !hasAnswers) return null;

    const instanceLabel = getRoleLabel(instanceIndex);
    return (
      <View key={instanceIndex}>
        {totalInstances > 1 && (
          <Text style={styles.instanceLabel}>
            {instanceLabel} {instanceIndex + 1}
          </Text>
        )}
        {card.questions.map((question) => {
          const answer = instance[question.id];
          if (
            !shouldShowQuestion(question.id, instance, getRole(instanceIndex))
          )
            return null;
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
    const instances =
      instancesData[card.id] && instancesData[card.id].length > 0
        ? instancesData[card.id]
        : [formData];

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
