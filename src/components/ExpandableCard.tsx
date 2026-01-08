import { useState, useEffect } from "react";
import "./ExpandableCard.css";
import type { CardData } from "../data/formData";

type ExpandableCardProps = {
  card: CardData;
  initialData?: Record<string, any>;
  onDataChange?: (questionId: string, value: any) => void;
};

// Character limit for summary truncation
const CHAR_LIMIT = 195;

function ExpandableCard({
  card,
  initialData,
  onDataChange,
}: ExpandableCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [summaryExpanded, setSummaryExpanded] = useState(false);
  const [textareaValues, setTextareaValues] = useState<Record<string, string>>(
    {}
  );
  const [inputValues, setInputValues] = useState<Record<string, string>>({});

  // Load initial data when provided
  useEffect(() => {
    if (initialData) {
      setTextareaValues((prev) => ({ ...prev, ...initialData }));
      setInputValues((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const isTruncated = card.summary.length > CHAR_LIMIT;
  const displaySummary =
    summaryExpanded || !isTruncated
      ? card.summary
      : card.summary.slice(0, CHAR_LIMIT) + "...";

  // Check if any required question is incomplete (has no value)
  const hasIncompleteQuestions = card.questions.some((question) => {
    if (!question.required) return false;
    const value =
      question.type === "textarea"
        ? textareaValues[question.id]
        : inputValues[question.id];
    return !value || value.trim() === "";
  });

  const handleTextareaChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    questionId: string
  ) => {
    const textarea = e.currentTarget;
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";

    const value = textarea.value;
    setTextareaValues((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    // Notify parent component of data change
    onDataChange?.(questionId, value);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    questionId: string
  ) => {
    const value = e.target.value;
    setInputValues((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    // Notify parent component of data change
    onDataChange?.(questionId, value);
  };

  const toggleExpanded = () => {
    if (expanded) {
      setSummaryExpanded(false);
    }
    setExpanded(!expanded);
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
          {card.questions.map((question, index) => {
            // Conditionally render question 9 only if question 8 is "Yes"
            if (question.id === "q9" && inputValues["q8"] !== "Yes") {
              return null;
            }

            // Display conditional questions with letter suffix (e.g., "4a")
            let questionNumber;
            if (question.id === "q9") {
              questionNumber = "4a";
            } else if (["q10", "q11", "q12"].includes(question.id)) {
              questionNumber = index;
            } else {
              questionNumber = index + 1;
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
                          inputValues[question.id] === option ? "selected" : ""
                        }`}
                        onClick={() => {
                          setInputValues((prev) => ({
                            ...prev,
                            [question.id]: option,
                          }));
                          // Notify parent component of data change
                          onDataChange?.(question.id, option);
                        }}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                ) : question.type === "textarea" ? (
                  <textarea
                    placeholder={question.placeholder}
                    value={textareaValues[question.id] || ""}
                    onChange={(e) => handleTextareaChange(e, question.id)}
                    rows={1}
                  />
                ) : (
                  <input
                    type="text"
                    placeholder={question.placeholder}
                    value={inputValues[question.id] || ""}
                    onChange={(e) => handleInputChange(e, question.id)}
                  />
                )}
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ExpandableCard;
