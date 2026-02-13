import { useState, useEffect } from "react";
import "./ExpandableCard.css";
import type { CardData } from "../data/formData";

type ExpandableCardProps = {
  card: CardData;
  initialData?: Record<string, any>;
  onDataChange?: (questionId: string, value: any) => void;
  // Multi-instance support
  instances?: Record<string, any>[];
  onInstancesChange?: (instances: Record<string, any>[]) => void;
  templateId?: string;
};

// Character limit for summary truncation
const CHAR_LIMIT = 195;

function ExpandableCard({
  card,
  initialData,
  onDataChange,
  instances: externalInstances,
  onInstancesChange,
  templateId = "ai-disclosure",
}: ExpandableCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  // Multi-instance state - array of instances, each with their own answers
  const [instances, setInstances] = useState<Record<string, string>[]>(() => {
    if (externalInstances && externalInstances.length > 0) {
      return externalInstances;
    }
    // Initialize with one instance containing initialData
    return [initialData || {}];
  });

  // Sync with external instances
  useEffect(() => {
    if (externalInstances && externalInstances.length > 0) {
      setInstances(externalInstances);
    }
  }, [externalInstances]);

  // Load initial data when provided (for backward compatibility)
  useEffect(() => {
    if (initialData && !externalInstances) {
      setInstances((prev) => {
        const newInstances = [...prev];
        newInstances[0] = { ...newInstances[0], ...initialData };
        return newInstances;
      });
    }
  }, [initialData, externalInstances]);

  const isTruncated = card.summary.length > CHAR_LIMIT;
  const displaySummary =
    summaryExpanded || !isTruncated
      ? card.summary
      : card.summary.slice(0, CHAR_LIMIT) + "...";

  // Check if any required question is incomplete across all instances
  const hasIncompleteQuestions = instances.some((instance) =>
    card.questions.some((question) => {
      if (!question.required) return false;
      const value = instance[question.id];
      return !value || value.trim() === "";
    }),
  );

  const handleValueChange = (
    instanceIndex: number,
    questionId: string,
    value: string,
  ) => {
    const newInstances = [...instances];
    newInstances[instanceIndex] = {
      ...newInstances[instanceIndex],
      [questionId]: value,
    };
    setInstances(newInstances);

    // Notify parent of changes
    if (onInstancesChange) {
      onInstancesChange(newInstances);
    }
    // Backward compatibility: also call onDataChange for first instance
    if (instanceIndex === 0 && onDataChange) {
      onDataChange(questionId, value);
    }
  };

  const addInstance = () => {
    const newInstances = [...instances, {}];
    setInstances(newInstances);
    if (onInstancesChange) {
      onInstancesChange(newInstances);
    }
  };

  const removeInstance = (index: number) => {
    if (instances.length <= 1) return;
    const newInstances = instances.filter((_, i) => i !== index);
    setInstances(newInstances);
    if (onInstancesChange) {
      onInstancesChange(newInstances);
    }
  };

  const toggleExpanded = () => {
    if (expanded) {
      setSummaryExpanded(false);
    }
    setExpanded(!expanded);
  };

  const renderInstance = (
    instance: Record<string, string>,
    instanceIndex: number,
  ) => {
    return (
      <div key={instanceIndex} className="card-instance">
        {instances.length > 1 && (
          <div className="instance-header">
            <span className="instance-label">AI Tool {instanceIndex + 1}</span>
            <button
              type="button"
              className="remove-instance-btn"
              onClick={() => removeInstance(instanceIndex)}
              aria-label="Remove this instance"
            >
              ✕
            </button>
          </div>
        )}
        {card.questions.map((question, qIndex) => {
          // Conditionally render question 9 only if question 8 is "Yes" (AI Disclosure form)
          if (question.id === "q9" && instance["q8"] !== "Yes") {
            return null;
          }

          // Conditionally render follow-up questions for AAPOR Required Disclosure form
          // Panel Information: q21 only shows if q20 is "Yes"
          if (question.id === "q21" && instance["q20"] !== "Yes") {
            return null;
          }
          // Interviewer or Coders: q23 only shows if q22 is "Yes"
          if (question.id === "q23" && instance["q22"] !== "Yes") {
            return null;
          }
          // Eligibility Screening: q25 only shows if q24 is "Yes"
          if (question.id === "q25" && instance["q24"] !== "Yes") {
            return null;
          }

          // Display conditional questions with letter suffix (e.g., "4a")
          let questionNumber: string | number;
          if (question.id === "q9") {
            questionNumber = "4a";
          } else if (["q10", "q11", "q12"].includes(question.id)) {
            questionNumber = qIndex;
          } else {
            questionNumber = qIndex + 1;
          }

          return (
            <label key={question.id}>
              <div style={{ marginBottom: "0.5rem" }}>
                <span className="question-label">
                  {questionNumber}. {question.label}
                  {question.required && <span className="red">*</span>}
                </span>
                {question.tooltip && question.tooltip.trim() && (
                  <span className="tooltip-container">
                    <span className="tooltip-icon">?</span>
                    <span className="tooltip-text">{question.tooltip}</span>
                  </span>
                )}
              </div>
              {question.type === "radio" && question.options ? (
                <div className="button-group">
                  {question.options.map((option) => (
                    <button
                      key={option}
                      type="button"
                      className={`option-button ${
                        instance[question.id] === option ? "selected" : ""
                      }`}
                      onClick={() =>
                        handleValueChange(instanceIndex, question.id, option)
                      }
                    >
                      {option}
                    </button>
                  ))}
                </div>
              ) : question.type === "textarea" ? (
                <textarea
                  placeholder={question.placeholder}
                  value={instance[question.id] || ""}
                  onChange={(e) => {
                    const textarea = e.currentTarget;
                    textarea.style.height = "auto";
                    textarea.style.height = textarea.scrollHeight + "px";
                    handleValueChange(
                      instanceIndex,
                      question.id,
                      e.target.value,
                    );
                  }}
                  rows={1}
                />
              ) : (
                <input
                  type="text"
                  placeholder={question.placeholder}
                  value={instance[question.id] || ""}
                  onChange={(e) =>
                    handleValueChange(
                      instanceIndex,
                      question.id,
                      e.target.value,
                    )
                  }
                />
              )}
            </label>
          );
        })}
      </div>
    );
  };

  return (
    <div className="card">
      <div className="card-header">
        <div className="card-title-container">
          <h1>{card.title}</h1>
          {hasIncompleteQuestions && (
            <span className="incomplete-indicator-container">
              <span className="incomplete-indicator">!</span>
              <span className="incomplete-tooltip">
                Some questions in this section are incomplete!
              </span>
            </span>
          )}
        </div>
        <button
          className="arrow-btn"
          onClick={toggleExpanded}
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? "▲" : "▼"}
        </button>
      </div>

      {expanded && (
        <div className="card-content">
          <div>
            <p className="summary">
              {displaySummary}
              {isTruncated && (
                <button
                  className="see-more-btn"
                  onClick={() => setSummaryExpanded(!summaryExpanded)}
                >
                  {summaryExpanded ? " see less" : " see more"}
                </button>
              )}
            </p>
          </div>

          {instances.map((instance, index) => renderInstance(instance, index))}

          <button
            type="button"
            className="add-instance-btn"
            onClick={addInstance}
          >
            {templateId === "ai-disclosure"
              ? "+ Add Another AI Tool or Use Case"
              : "+ Add Another Data Source"}
          </button>
        </div>
      )}
    </div>
  );
}

export default ExpandableCard;
