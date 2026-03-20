import { useState } from "react";
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
  // Global instance management (for syncing across sections)
  showAddButton?: boolean;
  onAddGlobalInstance?: () => void;
  onRemoveGlobalInstance?: (index: number) => void;
  roleLabels?: string[]; // Labels from first card's q1 selections
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
  showAddButton = true,
  onAddGlobalInstance,
  onRemoveGlobalInstance,
  roleLabels,
}: ExpandableCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);

  // Multi-instance state - array of instances, each with their own answers
  // Always prefer external instances if provided (controlled component pattern)
  const instances =
    externalInstances && externalInstances.length > 0
      ? externalInstances
      : [initialData || {}];

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

    // Notify parent of changes (controlled component)
    if (onInstancesChange) {
      onInstancesChange(newInstances);
    }
    // Backward compatibility: also call onDataChange for first instance
    if (instanceIndex === 0 && onDataChange) {
      onDataChange(questionId, value);
    }
  };

  const addInstance = () => {
    if (onAddGlobalInstance) {
      onAddGlobalInstance();
    } else {
      const newInstances = [...instances, {}];
      if (onInstancesChange) {
        onInstancesChange(newInstances);
      }
    }
  };

  const removeInstance = (index: number) => {
    if (instances.length <= 1) return;
    if (onRemoveGlobalInstance) {
      onRemoveGlobalInstance(index);
    } else {
      const newInstances = instances.filter((_, i) => i !== index);
      if (onInstancesChange) {
        onInstancesChange(newInstances);
      }
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
    // Determine instance label: use roleLabels if provided, otherwise fall back to generic labels
    let instanceLabel: string;
    if (roleLabels && roleLabels[instanceIndex]) {
      instanceLabel = `${roleLabels[instanceIndex]} Use Case`;
    } else if (templateId === "ai-disclosure") {
      // For first card, use the q1 value if available
      const role = instance["q1"];
      instanceLabel = role ? `${role} Use Case` : "AI Tool";
    } else {
      instanceLabel = "Data Source";
    }

    // For AI disclosure, always show the instance header with role label
    // For other templates, only show when multiple instances exist
    const showInstanceHeader =
      templateId === "ai-disclosure" || instances.length > 1;

    return (
      <div key={instanceIndex} className="card-instance">
        {showInstanceHeader && (
          <div className="instance-header">
            <span className="instance-label">
              {instanceLabel} {instances.length > 1 ? instanceIndex + 1 : ""}
            </span>
            {instances.length > 1 && (
              <button
                type="button"
                className="remove-instance-btn"
                onClick={() => removeInstance(instanceIndex)}
                aria-label="Remove this instance"
              >
                ✕
              </button>
            )}
          </div>
        )}
        {card.questions.map((question, qIndex) => {
          // AI Disclosure form conditionals:
          // q6 (Instrument/Interface) and q7 (Disclosure Possible) only show if q5 is "Embedded in third-party platform/tool"
          if (
            (question.id === "q6" || question.id === "q7") &&
            instance["q5"] !== "Embedded in third-party platform/tool"
          ) {
            return null;
          }
          // q13 (AI as Interviewer) only shows if the role for this instance is "Interviewer"
          if (question.id === "q13") {
            // For tasks-performed card, check instance["q1"] directly
            // For other cards, check roleLabels
            const role = roleLabels
              ? roleLabels[instanceIndex]
              : instance["q1"];
            if (role !== "Interviewer") {
              return null;
            }
          }
          // q18 (Fine-Tuning Details) only shows if q17 is "Yes"
          if (question.id === "q18" && instance["q17"] !== "Yes") {
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

          // Custom numbering for access-infrastructure section
          let questionNumber: string;
          if (card.id === "access-infrastructure") {
            // q5 = 1, q6 = 1a, q7 = 1b, q8 = 2, q9 = 3, etc.
            if (question.id === "q5") {
              questionNumber = "1";
            } else if (question.id === "q6") {
              questionNumber = "1a";
            } else if (question.id === "q7") {
              questionNumber = "1b";
            } else {
              // q8 -> 2, q9 -> 3, q10 -> 4, etc.
              const qNum = parseInt(question.id.replace("q", ""), 10);
              questionNumber = String(qNum - 6); // q8=2, q9=3, q10=4...
            }
          } else if (card.id === "model-details") {
            // q17 = Fine-Tuning Status, q18 = Fine-Tuning Details (conditional)
            if (question.id === "q17") {
              questionNumber = "4";
            } else if (question.id === "q18") {
              questionNumber = "4a";
            } else if (question.id === "q19" || question.id === "q20") {
              // q19 = 5, q20 = 6
              const qNum = parseInt(question.id.replace("q", ""), 10);
              questionNumber = String(qNum - 14); // q19=5, q20=6
            } else {
              questionNumber = String(qIndex + 1);
            }
          } else {
            questionNumber = String(qIndex + 1);
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
                  {question.options.map((option) => {
                    const optionTooltip = question.optionTooltips?.[option];
                    return (
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
                        {optionTooltip && (
                          <span className="option-tooltip-container">
                            <span className="option-tooltip-icon">?</span>
                            <span className="option-tooltip-text">
                              {optionTooltip}
                            </span>
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : question.type === "checkbox" && question.options ? (
                <div className="checkbox-group">
                  {question.options.map((option) => {
                    const currentValues = instance[question.id]
                      ? instance[question.id].split(", ")
                      : [];
                    const isChecked = currentValues.includes(option);
                    const optionTooltip = question.optionTooltips?.[option];

                    return (
                      <label key={option} className="checkbox-option">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            let newValues: string[];
                            if (isChecked) {
                              newValues = currentValues.filter(
                                (v) => v !== option,
                              );
                            } else {
                              newValues = [...currentValues, option];
                            }
                            handleValueChange(
                              instanceIndex,
                              question.id,
                              newValues.join(", "),
                            );
                          }}
                        />
                        <span className="checkbox-label">{option}</span>
                        {optionTooltip && (
                          <span className="option-tooltip-container">
                            <span className="option-tooltip-icon">?</span>
                            <span className="option-tooltip-text">
                              {optionTooltip}
                            </span>
                          </span>
                        )}
                      </label>
                    );
                  })}
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

          {showAddButton && (
            <button
              type="button"
              className="add-instance-btn"
              onClick={addInstance}
            >
              {templateId === "ai-disclosure"
                ? "+ Add Another AI Tool or Use Case"
                : "+ Add Another Data Source"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ExpandableCard;
