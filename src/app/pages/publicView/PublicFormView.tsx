import { useState, useEffect } from "react";
import { getPublicFormByPublicId } from "../../../utils/forms";
import { cardSections } from "../../../data/formData";
import "./PublicFormView.css";

type PublicFormViewProps = {
  publicId: string;
  onBack: () => void;
};

function PublicFormView({ publicId, onBack }: PublicFormViewProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [instancesData, setInstancesData] = useState<
    Record<string, Record<string, any>[]>
  >({});

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
      } catch (err) {
        setError("Failed to load form.");
      } finally {
        setLoading(false);
      }
    };

    loadForm();
  }, [publicId]);

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

  const renderCard = (card: (typeof cardSections)[0]) => {
    // Get instances for this card, or fallback to formData
    const instances =
      instancesData[card.id] && instancesData[card.id].length > 0
        ? instancesData[card.id]
        : [formData];

    // Check if any instance has answers
    const hasAnyAnswers = instances.some((instance) =>
      card.questions.some((q) => instance[q.id]?.trim())
    );

    if (!hasAnyAnswers) return null;

    return (
      <div key={card.id} className="public-card">
        <h3 className="public-card-title">{card.title}</h3>
        {instances.map((instance, idx) => {
          const hasAnswers = card.questions.some((q) => instance[q.id]?.trim());
          if (!hasAnswers) return null;

          return (
            <div key={idx} className="public-instance">
              {instances.length > 1 && (
                <div className="public-instance-label">AI Tool {idx + 1}</div>
              )}
              {card.questions.map((question) => {
                const answer = instance[question.id];
                if (!answer?.trim()) return null;

                return (
                  <div key={question.id} className="public-question">
                    <div className="public-question-label">
                      {question.label}
                    </div>
                    <div className="public-answer">{answer}</div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    );
  };

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
      </header>

      <main className="public-main">
        <section className="public-section">
          <h2 className="public-section-title">Immediate Disclosures</h2>
          {immediateDisclosureCards.map(renderCard)}
        </section>

        <section className="public-section">
          <h2 className="public-section-title">Core/Enhanced Questions</h2>
          {coreEnhancedCards.map(renderCard)}
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
