import { useState, useEffect } from "react";
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { getPublicFormByPublicId } from "../../../utils/forms";
import { cardSections } from "../../../data/formData";
import "./PublicFormView.css";

type PublicFormViewProps = {
  publicId: string;
  onBack: () => void;
};

// Collapsible card component
function CollapsibleCard({
  card,
  instances,
  formData,
}: {
  card: (typeof cardSections)[0];
  instances: Record<string, any>[];
  formData: Record<string, any>;
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
          {actualInstances.map((instance, idx) => (
            <div key={idx} className="public-instance">
              {actualInstances.length > 1 && (
                <div className="public-instance-label">AI Tool {idx + 1}</div>
              )}
              {card.questions.map((question) => {
                const answer = instance[question.id];
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
          ))}
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
      } catch (err) {
        setError("Failed to load form.");
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [publicId]);

  // Group cards by section
  const immediateDisclosures = [
    "tasks-performed",
    "human-oversight",
    "human-respondents-disclosure",
  ];
  const coreEnhanced = [
    "model-details",
    "access-tooling-details",
    "core-prompts",
    "additional-enhanced-disclosures",
  ];

  const immediateDisclosureCards = cardSections.filter((card) =>
    immediateDisclosures.includes(card.id)
  );
  const coreEnhancedCards = cardSections.filter((card) =>
    coreEnhanced.includes(card.id)
  );

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
        <p className="public-subtitle">AAPOR AI Disclosure Checklist</p>
        {authorName && (
          <p className="public-author">Authored by {authorName}</p>
        )}
      </header>

      <main className="public-main">
        <section className="public-section">
          <h2 className="public-section-title">Immediate Disclosures</h2>
          {immediateDisclosureCards.map((card) => (
            <CollapsibleCard
              key={card.id}
              card={card}
              instances={instancesData[card.id]}
              formData={formData}
            />
          ))}
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Core/Enhanced Questions</h2>
          {coreEnhancedCards.map((card) => (
            <CollapsibleCard
              key={card.id}
              card={card}
              instances={instancesData[card.id]}
              formData={formData}
            />
          ))}
        </section>
      </main>

      <footer className="public-footer">
        <p>
          This disclosure was created using the{" "}
          <a
            href="https://hannahcha417.github.io/aapor-disclosure-checklist/"
            target="_blank"
            rel="noopener noreferrer"
          >
            AAPOR AI Disclosure Checklist Tool
          </a>
        </p>
      </footer>
    </div>
  );
}

export default PublicFormView;
