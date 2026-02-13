import { useState, useEffect } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { getPublicFormByPublicId } from "../../../utils/forms";
import {
  getTemplateById,
  DEFAULT_TEMPLATE_ID,
  type CardData,
} from "../../../data/templates";
import "./PublicFormView.css";

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

type PublicFormViewProps = {
  publicId: string;
  onBack: () => void;
};

// Collapsible card component
function CollapsibleCard({
  card,
  instances,
  formData,
  templateId,
}: {
  card: CardData;
  instances: Record<string, any>[];
  formData: Record<string, any>;
  templateId: string;
}) {
  const [isExpanded, setIsExpanded] = useState(true);

  const actualInstances =
    instances && instances.length > 0 ? instances : [formData];

  return (
    <div className="public-card">
      <div
        className="public-card-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="public-card-title">{card.title}</h3>
        <span className="public-card-toggle">
          {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
        </span>
      </div>
      {isExpanded && (
        <div className="public-card-content">
          {actualInstances.map((instance, idx) => {
            const instanceLabel =
              templateId === "ai-disclosure" ? "AI Tool" : "Data Source";
            return (
              <div key={idx} className="public-instance">
                {actualInstances.length > 1 && (
                  <div className="public-instance-label">
                    {instanceLabel} {idx + 1}
                  </div>
                )}
                {card.questions.map((question) => {
                  const answer = instance[question.id];

                  // Skip conditional questions that shouldn't be shown
                  if (!shouldShowQuestion(question.id, instance)) return null;

                  return (
                    <div key={question.id} className="public-question">
                      <div className="public-question-label">
                        {question.label}
                      </div>
                      {answer?.trim() ? (
                        <div className="public-answer">{answer}</div>
                      ) : (
                        <div className="public-no-answer">No answer</div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PublicFormView({ publicId, onBack }: PublicFormViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [instancesData, setInstancesData] = useState<
    Record<string, Record<string, any>[]>
  >({});
  const [authorName, setAuthorName] = useState<string | null>(null);
  const [templateId, setTemplateId] = useState<string>(DEFAULT_TEMPLATE_ID);

  useEffect(() => {
    const loadForm = async () => {
      try {
        const { data, error } = await getPublicFormByPublicId(publicId);
        if (error || !data) {
          setError("Form not found or is no longer public.");
          return;
        }
        setFormTitle(data.title);
        setFormData(data.form_data || {});
        setInstancesData(data.form_data?.instances || {});
        setAuthorName(data.author_name || null);
        setTemplateId(data.template_id || DEFAULT_TEMPLATE_ID);
      } catch (err) {
        setError("Failed to load form.");
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [publicId]);

  // Get template
  const template = getTemplateById(templateId);

  if (loading) {
    return (
      <div className="public-container">
        <div className="public-loading">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="public-container">
        <div className="public-error">
          <h2>Form Not Found</h2>
          <p>{error}</p>
          <button className="public-back-btn" onClick={onBack}>
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="public-container">
      <header className="public-header">
        <h1 className="public-title">{formTitle}</h1>
        <p className="public-subtitle">
          {template?.name || "Disclosure Checklist"}
        </p>
        {authorName && (
          <p className="public-author">Authored by {authorName}</p>
        )}
      </header>

      <main className="public-main">
        {template?.sectionGroups.map((group) => (
          <section key={group.title || "default"} className="public-section">
            {group.title && (
              <h2 className="public-section-title">{group.title}</h2>
            )}
            {group.sectionIds.map((sectionId) => {
              const card = template.sections.find((s) => s.id === sectionId);
              if (!card) return null;
              return (
                <CollapsibleCard
                  key={card.id}
                  card={card}
                  instances={instancesData[card.id]}
                  formData={formData}
                  templateId={templateId}
                />
              );
            })}
          </section>
        ))}
      </main>

      <footer className="public-footer">
        <p>
          This disclosure was created using the{" "}
          <a
            href="https://hannahcha417.github.io/aapor-disclosure-checklist/"
            target="_blank"
            rel="noopener noreferrer"
          >
            AAPOR Disclosure Checklist Tool
          </a>
        </p>
      </footer>
    </div>
  );
}

export default PublicFormView;
