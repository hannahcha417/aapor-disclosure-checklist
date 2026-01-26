import { useState, useEffect, useRef } from "react";
import { FiEdit, FiArrowLeft, FiSave } from "react-icons/fi";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import Sidebar from "../../../components/Sidebar";
import ExpandableCard from "../../../components/ExpandableCard";
import { getCardById } from "../../../data/formData";
import { createForm, updateForm } from "../../../utils/forms";
import { FormPDF } from "../../../utils/FormPDF";
import { FormPDFSummary } from "../../../utils/FormPDFSummary";
import { generateDocx, generateTxt } from "../../../utils/exportUtils";
import "./FormPage.css";

// TODO: Put sections into tooltips

type FormPageProps = {
  onBackToDashboard: () => void;
  formId?: string;
  initialTitle?: string;
  initialData?: Record<string, any>;
  isGuest?: boolean;
};

function FormPage({
  onBackToDashboard,
  formId: initialFormId,
  initialTitle,
  initialData,
  isGuest = false,
}: FormPageProps) {
  const [sideBarOpen, setSidebarOpen] = useState(false);
  const [formTitle, setFormTitle] = useState(initialTitle || "Untitled Form");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [formId, setFormId] = useState<string | undefined>(initialFormId);
  const [formData, setFormData] = useState<Record<string, any>>(
    initialData || {}
  );
  // Multi-instance data: { cardId: [instance1, instance2, ...] }
  const [instancesData, setInstancesData] = useState<
    Record<string, Record<string, any>[]>
  >(initialData?.instances || {});
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "">("");
  const [instructionsExpanded, setInstructionsExpanded] = useState(true);
  const [showGuestExitWarning, setShowGuestExitWarning] = useState(false);
  const [exportFormat, setExportFormat] = useState<"detailed" | "summary">(
    "detailed"
  );
  const [exportFileType, setExportFileType] = useState<"pdf" | "docx" | "txt">(
    "pdf"
  );
  const [includeEmpty, setIncludeEmpty] = useState(true);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  // Auto-save every 5 seconds (only for logged-in users)
  useEffect(() => {
    // Skip auto-save for guests
    if (isGuest) return;

    const saveForm = async () => {
      if (!formTitle.trim()) return;

      setIsSaving(true);
      setSaveStatus("saving");

      // Combine formData with instances data for saving
      const dataToSave = { ...formData, instances: instancesData };

      try {
        if (formId) {
          // Update existing form
          await updateForm(formId, formTitle, dataToSave);
        } else {
          // Create new form
          const { data, error } = await createForm(formTitle, dataToSave);
          if (data && !error) {
            setFormId(data.id);
          }
        }
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus(""), 2000);
      } catch (error) {
        console.error("Error saving form:", error);
      } finally {
        setIsSaving(false);
      }
    };

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    // Set new timer for auto-save
    autoSaveTimerRef.current = setTimeout(saveForm, 5000);

    // Cleanup on unmount
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [formTitle, formData, instancesData, formId, isGuest]);

  const handleManualSave = async () => {
    if (!formTitle.trim()) return;

    setIsSaving(true);
    setSaveStatus("saving");

    // Combine formData with instances data for saving
    const dataToSave = { ...formData, instances: instancesData };

    try {
      if (formId) {
        await updateForm(formId, formTitle, dataToSave);
      } else {
        const { data, error } = await createForm(formTitle, dataToSave);
        if (data && !error) {
          setFormId(data.id);
        }
      }
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus(""), 2000);
    } catch (error) {
      console.error("Error saving form:", error);
    } finally {
      setIsSaving(false);
    }
  };

  // Handler for instances changes from ExpandableCard
  const handleInstancesChange = (
    cardId: string,
    instances: Record<string, any>[]
  ) => {
    setInstancesData((prev) => ({
      ...prev,
      [cardId]: instances,
    }));
  };

  const handleExport = async () => {
    try {
      const suffix = exportFormat === "summary" ? "_summary" : "";
      const baseFileName = formTitle.replace(/\s+/g, "_");

      if (exportFileType === "pdf") {
        const component =
          exportFormat === "summary" ? (
            <FormPDFSummary
              formTitle={formTitle}
              formData={formData}
              instancesData={instancesData}
              includeEmpty={includeEmpty}
            />
          ) : (
            <FormPDF
              formTitle={formTitle}
              formData={formData}
              instancesData={instancesData}
              includeEmpty={includeEmpty}
            />
          );
        const blob = await pdf(component).toBlob();
        saveAs(blob, `${baseFileName}${suffix}.pdf`);
      } else if (exportFileType === "docx") {
        const blob = await generateDocx(
          formTitle,
          formData,
          instancesData,
          exportFormat,
          includeEmpty
        );
        // Use direct download link approach for DOCX
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${baseFileName}${suffix}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (exportFileType === "txt") {
        const blob = generateTxt(
          formTitle,
          formData,
          instancesData,
          exportFormat,
          includeEmpty
        );
        saveAs(blob, `${baseFileName}${suffix}.txt`);
      }
    } catch (error) {
      console.error("Error generating export:", error);
    }
  };

  return (
    <div className="container">
      <Sidebar isOpen={sideBarOpen} onClose={() => setSidebarOpen(false)} />

      <button
        className="tab-btn left"
        onClick={() => {
          if (isGuest) {
            setShowGuestExitWarning(true);
          } else {
            onBackToDashboard();
          }
        }}
      >
        <FiArrowLeft />
      </button>

      {showGuestExitWarning && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Leave Form?</h2>
            <p>
              You are in <strong>guest mode</strong>. Leaving this page will{" "}
              <strong>lose all your form progress</strong>.
            </p>
            <p>Are you sure you want to go back?</p>
            <div className="modal-buttons">
              <button
                className="modal-btn cancel"
                onClick={() => setShowGuestExitWarning(false)}
              >
                Stay
              </button>
              <button
                className="modal-btn confirm"
                onClick={() => {
                  setShowGuestExitWarning(false);
                  onBackToDashboard();
                }}
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}

      {sideBarOpen && (
        <div className="overlay" onClick={() => setSidebarOpen(false)} />
      )}
      {!sideBarOpen && (
        <button className="tab-btn right" onClick={() => setSidebarOpen(true)}>
          ☰
        </button>
      )}
      <header className="header">
        <div className="header-content">
          <div className="title-container">
            {isEditingTitle ? (
              <input
                type="text"
                className="title-input"
                value={formTitle}
                onChange={(e) => setFormTitle(e.target.value)}
                onBlur={() => setIsEditingTitle(false)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    setIsEditingTitle(false);
                  }
                }}
                autoFocus
              />
            ) : (
              <h1 onClick={() => setIsEditingTitle(true)}>
                {formTitle}
                <FiEdit className="edit-icon" />
              </h1>
            )}
          </div>
          <div className="save-section">
            {saveStatus === "saving" && (
              <span className="save-status saving">Saving...</span>
            )}
            {saveStatus === "saved" && (
              <span className="save-status saved">Saved ✓</span>
            )}
            {!isGuest && (
              <button
                onClick={handleManualSave}
                disabled={isSaving}
                className="save-btn"
              >
                <FiSave /> Save
              </button>
            )}
            {isGuest && <span className="guest-indicator">Guest Mode</span>}
          </div>
        </div>
      </header>

      <main className="content">
        <div className="instructions">
          <div className="instructions-header">
            <h3>
              For each question in this checklist, the researcher should
              indicate one of the following:
            </h3>
            <button
              className="arrow-btn"
              onClick={() => setInstructionsExpanded(!instructionsExpanded)}
              aria-label={instructionsExpanded ? "Collapse" : "Expand"}
            >
              {instructionsExpanded ? "▲" : "▼"}
            </button>
          </div>
          {instructionsExpanded && (
            <div className="instructions-content">
              <ul>
                <li>The answer to the question</li>
                <li>Question is not applicable</li>
                <li>Answer is unknown to the researcher and explain why </li>
                <li>Answer is proprietary and explainwhy </li>
                <li>
                  Answer would violate privacy of participants and explain why{" "}
                </li>
              </ul>
            </div>
          )}
        </div>

        <section>
          <h2>Immediate Disclosures</h2>
          <p>
            Immediate disclosures must be included in any reporting or
            methodological summaries and presented in a way that is clearly
            disclosed and easily accessible to readers.
          </p>
          {getCardById("tasks-performed") && (
            <ExpandableCard
              card={getCardById("tasks-performed")!}
              initialData={formData}
              instances={instancesData["tasks-performed"]}
              onDataChange={(questionId, value) =>
                setFormData((prev) => ({ ...prev, [questionId]: value }))
              }
              onInstancesChange={(instances) =>
                handleInstancesChange("tasks-performed", instances)
              }
            />
          )}
          {getCardById("human-oversight") && (
            <ExpandableCard
              card={getCardById("human-oversight")!}
              initialData={formData}
              instances={instancesData["human-oversight"]}
              onDataChange={(questionId, value) =>
                setFormData((prev) => ({ ...prev, [questionId]: value }))
              }
              onInstancesChange={(instances) =>
                handleInstancesChange("human-oversight", instances)
              }
            />
          )}
        </section>
        <section>
          <h2>Core/Enhanced Questions</h2>
          <p>
            Core questions should be answered in all reporting scenarios
            ensuring consistent transparency across studies: this is the minimum
            viable disclosure to ensure that consumers of the polling data can
            understand potential bias and limitations. Enhanced questions are
            always valuable to answer, as they provide deeper insight into
            methods and AI involvement, but they are not mandatory in every
            situation: this is necessary for any situation that requires
            reproducibility.
          </p>
          {getCardById("model-details") && (
            <ExpandableCard
              card={getCardById("model-details")!}
              initialData={formData}
              instances={instancesData["model-details"]}
              onDataChange={(questionId, value) =>
                setFormData((prev) => ({ ...prev, [questionId]: value }))
              }
              onInstancesChange={(instances) =>
                handleInstancesChange("model-details", instances)
              }
            />
          )}
          {getCardById("access-tooling-details") && (
            <ExpandableCard
              card={getCardById("access-tooling-details")!}
              initialData={formData}
              instances={instancesData["access-tooling-details"]}
              onDataChange={(questionId, value) =>
                setFormData((prev) => ({ ...prev, [questionId]: value }))
              }
              onInstancesChange={(instances) =>
                handleInstancesChange("access-tooling-details", instances)
              }
            />
          )}
          {getCardById("core-prompts") && (
            <ExpandableCard
              card={getCardById("core-prompts")!}
              initialData={formData}
              instances={instancesData["core-prompts"]}
              onDataChange={(questionId, value) =>
                setFormData((prev) => ({ ...prev, [questionId]: value }))
              }
              onInstancesChange={(instances) =>
                handleInstancesChange("core-prompts", instances)
              }
            />
          )}
          {getCardById("additional-enhanced-disclosures") && (
            <ExpandableCard
              card={getCardById("additional-enhanced-disclosures")!}
              initialData={formData}
              instances={instancesData["additional-enhanced-disclosures"]}
              onDataChange={(questionId, value) =>
                setFormData((prev) => ({ ...prev, [questionId]: value }))
              }
              onInstancesChange={(instances) =>
                handleInstancesChange(
                  "additional-enhanced-disclosures",
                  instances
                )
              }
            />
          )}
          {getCardById("human-respondents-disclosure") && (
            <ExpandableCard
              card={getCardById("human-respondents-disclosure")!}
              initialData={formData}
              instances={instancesData["human-respondents-disclosure"]}
              onDataChange={(questionId, value) =>
                setFormData((prev) => ({ ...prev, [questionId]: value }))
              }
              onInstancesChange={(instances) =>
                handleInstancesChange("human-respondents-disclosure", instances)
              }
            />
          )}
        </section>

        <div className="submit-container">
          <div className="export-options">
            <div className="export-option">
              <label>Format:</label>
              <select
                value={exportFormat}
                onChange={(e) =>
                  setExportFormat(e.target.value as "detailed" | "summary")
                }
              >
                <option value="detailed">List</option>
                <option value="summary">Paragraph Summary</option>
              </select>
            </div>
            <div className="export-option">
              <label>File Type:</label>
              <select
                value={exportFileType}
                onChange={(e) =>
                  setExportFileType(e.target.value as "pdf" | "docx" | "txt")
                }
              >
                <option value="pdf">PDF</option>
                <option value="docx">Word (DOCX)</option>
                <option value="txt">Text (TXT)</option>
              </select>
            </div>
          </div>
          <label className="export-checkbox">
            <input
              type="checkbox"
              checked={includeEmpty}
              onChange={(e) => setIncludeEmpty(e.target.checked)}
            />
            Include unanswered questions
          </label>
          <button className="submit-btn" onClick={handleExport}>
            Export
          </button>
        </div>
      </main>
    </div>
  );
}

export default FormPage;
