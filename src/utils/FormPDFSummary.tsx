import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { getTemplateById, DEFAULT_TEMPLATE_ID } from "../data/templates";
import type { CardData } from "../data/formData";

// Helper function to check if conditional questions should be shown
function shouldShowQuestion(
  questionId: string,
  instance: Record<string, any>,
  role?: string, // Role from tasks-performed for this instance
  templateId?: string, // Template ID to check which conditionals apply
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
  // AAPOR form conditionals (only for non-AI-disclosure templates):
  if (templateId !== "ai-disclosure") {
    // q21 is conditional on q20 being "Yes"
    if (questionId === "q21" && instance["q20"] !== "Yes") return false;
    // q23 is conditional on q22 being "Yes"
    if (questionId === "q23" && instance["q22"] !== "Yes") return false;
    // q25 is conditional on q24 being "Yes"
    if (questionId === "q25" && instance["q24"] !== "Yes") return false;
  }
  return true;
}

// Helper function to check if a section should be shown for a specific instance
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

    if (!includeEmpty && answers.length === 0) return null;

    return (
      <View key={`${card.id}-${instanceIndex}`}>
        <Text style={styles.cardTitle}>{card.title}</Text>
        {answers.length > 0 ? (
          <Text style={styles.summaryParagraph}>{answers.join(" ")}</Text>
        ) : (
          <Text style={styles.noAnswer}>No answer</Text>
        )}
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
                      return renderCardInstanceSummary(
                        card,
                        instance,
                        useCaseIndex,
                      );
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
  const renderCardSummary = (card: CardData) => {
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
        {instances.map((instance, idx) => {
          const answers = card.questions
            .filter((question) =>
              shouldShowQuestion(
                question.id,
                instance,
                getRole(idx),
                templateId,
              ),
            )
            .map((question) => instance[question.id])
            .filter((answer) => answer && answer.trim());

          if (!includeEmpty && answers.length === 0) return null;

          const instanceLabel = getRoleLabel(idx);
          return (
            <View key={idx}>
              {instances.length > 1 && (
                <Text style={styles.instanceLabel}>
                  {instanceLabel} {idx + 1}:
                </Text>
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
