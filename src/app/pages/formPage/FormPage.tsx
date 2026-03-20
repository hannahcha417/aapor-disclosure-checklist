import { useState, useEffect, useRef } from "react";
import {
  FiEdit,
  FiArrowLeft,
  FiSave,
  FiShare2,
  FiCopy,
  FiCheck,
} from "react-icons/fi";
import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import Sidebar from "../../../components/Sidebar";
import ExpandableCard from "../../../components/ExpandableCard";
import {
  getTemplateById,
  DEFAULT_TEMPLATE_ID,
  type FormTemplate,
} from "../../../data/templates";
import { createForm, updateForm, publishForm } from "../../../utils/forms";
import { FormPDF } from "../../../utils/FormPDF";
import { FormPDFSummary } from "../../../utils/FormPDFSummary";
import {
  generateDocx,
  generateTxt,
  generateLatex,
} from "../../../utils/exportUtils";
import "./FormPage.css";

// TODO: Put sections into tooltips

type FormPageProps = {
  onBackToDashboard: () => void;
  formId?: string;
  initialTitle?: string;
  initialData?: Record<string, any>;
  initialPublicId?: string;
  initialIsPublic?: boolean;
  templateId?: string;
  isGuest?: boolean;
};

function FormPage({
  onBackToDashboard,
  formId: initialFormId,
  initialTitle,
  initialData,
  initialPublicId,
  initialIsPublic = false,
  templateId = DEFAULT_TEMPLATE_ID,
  isGuest = false,
}: FormPageProps) {
  const [sideBarOpen, setSidebarOpen] = useState(false);
  const [formTitle, setFormTitle] = useState(initialTitle || "Untitled Form");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [formId, setFormId] = useState<string | undefined>(initialFormId);
  const [formData, setFormData] = useState<Record<string, any>>(
    initialData || {},
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
    "detailed",
  );
  const [exportFileType, setExportFileType] = useState<
    "pdf" | "docx" | "txt" | "tex"
  >("pdf");
  const [includeEmpty, setIncludeEmpty] = useState(true);
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined,
  );

  // Get the template
  const template: FormTemplate | undefined = getTemplateById(templateId);

  // Helper to get card by ID from template
  const getCardById = (cardId: string) => {
    return template?.sections.find((s) => s.id === cardId);
  };

  // Initialize instancesData with one instance per card when template loads
  useEffect(() => {
    if (template && Object.keys(instancesData).length === 0) {
      const allSectionIds = template.sectionGroups.flatMap(
        (group) => group.sectionIds,
      );
      const initialData: Record<string, Record<string, any>[]> = {};
      allSectionIds.forEach((sectionId) => {
        initialData[sectionId] = [{}];
      });
      setInstancesData(initialData);
    }
  }, [template]);

  // Public sharing state
  const [publicId, setPublicId] = useState<string | undefined>(initialPublicId);
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [showAuthorModal, setShowAuthorModal] = useState(false);
  const [authorName, setAuthorName] = useState("");
  const [copied, setCopied] = useState(false);

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
          const { data, error } = await createForm(
            formTitle,
            dataToSave,
            templateId,
          );
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
        const { data, error } = await createForm(
          formTitle,
          dataToSave,
          templateId,
        );
        if (data && !error) {
          setFormId(data.id);
          setPublicId(data.public_id);
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

  // Handle publishing the form - first show author modal
  const handlePublish = () => {
    setShowAuthorModal(true);
  };

  // Actually publish after author name is entered
  const handleConfirmPublish = async () => {
    if (!authorName.trim()) return;

    setShowAuthorModal(false);

    if (!formId) {
      // Need to save first
      const dataToSave = { ...formData, instances: instancesData };
      const { data, error } = await createForm(
        formTitle,
        dataToSave,
        templateId,
      );
      if (error || !data) {
        console.error("Error creating form:", error);
        return;
      }
      setFormId(data.id);
      setPublicId(data.public_id);
    }

    setIsPublishing(true);
    try {
      const dataToSave = { ...formData, instances: instancesData };
      const { data, error } = await publishForm(
        formId!,
        formTitle,
        dataToSave,
        authorName,
      );
      if (error) {
        console.error("Error publishing form:", error);
        return;
      }
      setIsPublic(true);
      setPublicId(data.public_id);
      setShowPublishModal(true);
    } catch (error) {
      console.error("Error publishing form:", error);
    } finally {
      setIsPublishing(false);
    }
  };

  const getPublicUrl = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#/view/${publicId}`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getPublicUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handler for instances changes from ExpandableCard
  const handleInstancesChange = (
    cardId: string,
    instances: Record<string, any>[],
  ) => {
    setInstancesData((prev) => ({
      ...prev,
      [cardId]: instances,
    }));
  };

  // Handler for adding a global instance across ALL cards (for AI disclosure)
  const handleAddGlobalInstance = () => {
    if (!template) return;

    const allSectionIds = template.sectionGroups.flatMap(
      (group) => group.sectionIds,
    );

    setInstancesData((prev) => {
      const newData = { ...prev };
      allSectionIds.forEach((sectionId) => {
        const existingInstances = prev[sectionId] || [{}];
        newData[sectionId] = [...existingInstances, {}];
      });
      return newData;
    });
  };

  // Handler for removing a global instance across ALL cards (for AI disclosure)
  const handleRemoveGlobalInstance = (index: number) => {
    if (!template) return;

    const allSectionIds = template.sectionGroups.flatMap(
      (group) => group.sectionIds,
    );

    setInstancesData((prev) => {
      const newData = { ...prev };
      allSectionIds.forEach((sectionId) => {
        const existingInstances = prev[sectionId] || [{}];
        if (existingInstances.length > 1) {
          newData[sectionId] = existingInstances.filter((_, i) => i !== index);
        }
      });
      return newData;
    });
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
              templateId={templateId}
            />
          ) : (
            <FormPDF
              formTitle={formTitle}
              formData={formData}
              instancesData={instancesData}
              includeEmpty={includeEmpty}
              templateId={templateId}
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
          includeEmpty,
          templateId,
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
          includeEmpty,
          templateId,
        );
        saveAs(blob, `${baseFileName}${suffix}.txt`);
      } else if (exportFileType === "tex") {
        const blob = generateLatex(
          formTitle,
          formData,
          instancesData,
          exportFormat,
          includeEmpty,
          templateId,
        );
        saveAs(blob, `${baseFileName}${suffix}.tex`);
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

      {showPublishModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>{isPublic ? "Form Published!" : "Publish Form"}</h2>
            <p>Your form is now publicly accessible at:</p>
            <div className="public-url-container">
              <input
                type="text"
                className="public-url-input"
                value={getPublicUrl()}
                readOnly
              />
              <button className="copy-btn" onClick={copyToClipboard}>
                {copied ? <FiCheck /> : <FiCopy />}
              </button>
            </div>
            <p className="modal-hint">
              Anyone with this link can view your disclosure. Updates you make
              will be reflected when you publish again.
            </p>
            <div className="modal-buttons">
              <button
                className="modal-btn confirm"
                onClick={() => setShowPublishModal(false)}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuthorModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Publish Form</h2>
            <p>Enter your name to be displayed as the author:</p>
            <input
              type="text"
              className="author-input"
              placeholder="First Name Last Name"
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              autoFocus
            />
            <div className="modal-buttons">
              <button
                className="modal-btn cancel"
                onClick={() => setShowAuthorModal(false)}
              >
                Cancel
              </button>
              <button
                className="modal-btn confirm"
                onClick={handleConfirmPublish}
                disabled={!authorName.trim()}
              >
                Publish
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
              {templateId === "ai-disclosure"
                ? "For each question in this checklist, the researcher should indicate one of the following:"
                : "Instructions for AAPOR Required Disclosure Elements:"}
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
              {templateId === "ai-disclosure" ? (
                <ul>
                  <li>The answer to the question</li>
                  <li>Question is not applicable</li>
                  <li>Answer is unknown to the researcher and explain why </li>
                  <li>Answer is proprietary and explainwhy </li>
                  <li>
                    Answer would violate privacy of participants and explain
                    why{" "}
                  </li>
                </ul>
              ) : (
                <ul>
                  {/* TODO: Add instructions for AAPOR Required Disclosure Elements */}
                  <li>
                    Every note and article or note must have an Appendix A that
                    provides the AAPOR required disclosure elements for each
                    data source used. This appendix will be type set and
                    published with the final version of your manuscript. Copy
                    and paste the completed Appendix A at the end of your final
                    manuscript.
                  </li>
                  <li>
                    Instructions shown in italtics should be deleted when the
                    Appendix is finalized. You can insert a link to an online
                    reference in lieu of a description if it is a study-specific
                    methodological description and permanently archived. Please
                    indicate if a required element does not apply to each data
                    source and why.
                  </li>
                  <li>
                    Insert additional sets of information if your manuscript
                    uses more than one data source using the "Add Another Data
                    Source" button under each section.
                  </li>
                </ul>
              )}
            </div>
          )}
        </div>

        {/* For AI Disclosure: render by USE CASE, each containing all sections */}
        {templateId === "ai-disclosure" && template && (
          <>
            {(instancesData["tasks-performed"] || [{}]).map(
              (_, useCaseIndex) => {
                const roleLabel =
                  instancesData["tasks-performed"]?.[useCaseIndex]?.["q1"] ||
                  "AI Tool";
                const useCaseTitle =
                  `${roleLabel} Use Case ${(instancesData["tasks-performed"] || [{}]).length > 1 ? useCaseIndex + 1 : ""}`.trim();

                return (
                  <section key={useCaseIndex} className="use-case-section">
                    <div className="use-case-header">
                      <h2 className="use-case-title">{useCaseTitle}</h2>
                      {(instancesData["tasks-performed"] || []).length > 1 && (
                        <button
                          type="button"
                          className="remove-use-case-btn"
                          onClick={() =>
                            handleRemoveGlobalInstance(useCaseIndex)
                          }
                        >
                          Remove Use Case
                        </button>
                      )}
                    </div>

                    {template.sectionGroups.map((group) => (
                      <div key={group.title} className="use-case-group">
                        {group.title && (
                          <h3 className="use-case-group-title">
                            {group.title}
                          </h3>
                        )}
                        {group.description && (
                          <p className="use-case-group-description">
                            {group.description}
                          </p>
                        )}
                        {group.sectionIds.map((sectionId) => {
                          const card = getCardById(sectionId);
                          if (!card) return null;

                          // Conditional: hide "model-details" (4a) unless:
                          // - q5 = Direct or First-party, OR
                          // - q5 = Third-party AND q7 = Yes
                          if (sectionId === "model-details") {
                            const accessMethod =
                              instancesData["access-infrastructure"]?.[
                                useCaseIndex
                              ]?.["q5"] || "";
                            const disclosurePossible =
                              instancesData["access-infrastructure"]?.[
                                useCaseIndex
                              ]?.["q7"] || "";

                            const isDirect = accessMethod.includes("Direct");
                            const isFirstParty =
                              accessMethod.includes("First-party");
                            const isThirdPartyWithDisclosure =
                              accessMethod.includes("third-party") &&
                              disclosurePossible === "Yes";

                            if (
                              !isDirect &&
                              !isFirstParty &&
                              !isThirdPartyWithDisclosure
                            ) {
                              return null;
                            }
                          }

                          return (
                            <ExpandableCard
                              key={sectionId}
                              card={card}
                              initialData={formData}
                              instances={
                                instancesData[sectionId]?.[useCaseIndex]
                                  ? [instancesData[sectionId][useCaseIndex]]
                                  : [{}]
                              }
                              templateId={templateId}
                              onDataChange={(questionId, value) =>
                                setFormData((prev) => ({
                                  ...prev,
                                  [questionId]: value,
                                }))
                              }
                              onInstancesChange={(instances) => {
                                // Update just this use case's instance for this card
                                setInstancesData((prev) => {
                                  const cardInstances = [
                                    ...(prev[sectionId] || []),
                                  ];
                                  cardInstances[useCaseIndex] =
                                    instances[0] || {};
                                  return {
                                    ...prev,
                                    [sectionId]: cardInstances,
                                  };
                                });
                              }}
                              showAddButton={false}
                              // Pass role for conditional question logic (q13 interviewer check)
                              // Don't pass roleLabels for model-details (4a) to hide use case wrapper
                              roleLabels={
                                sectionId === "model-details"
                                  ? undefined
                                  : [roleLabel]
                              }
                            />
                          );
                        })}
                      </div>
                    ))}
                  </section>
                );
              },
            )}

            <div className="add-use-case-container">
              <button
                type="button"
                className="add-use-case-btn"
                onClick={handleAddGlobalInstance}
              >
                + Add Another Use Case
              </button>
            </div>
          </>
        )}

        {/* For AAPOR template: render by SECTION (original behavior) */}
        {templateId !== "ai-disclosure" &&
          template?.sectionGroups.map((group) => (
            <section key={group.title}>
              <h2>{group.title}</h2>
              <p>{group.description}</p>
              {group.sectionIds.map((sectionId) => {
                const card = getCardById(sectionId);
                if (!card) return null;

                return (
                  <ExpandableCard
                    key={sectionId}
                    card={card}
                    initialData={formData}
                    instances={instancesData[sectionId]}
                    templateId={templateId}
                    onDataChange={(questionId, value) =>
                      setFormData((prev) => ({ ...prev, [questionId]: value }))
                    }
                    onInstancesChange={(instances) =>
                      handleInstancesChange(sectionId, instances)
                    }
                    showAddButton={true}
                  />
                );
              })}
            </section>
          ))}

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
                  setExportFileType(
                    e.target.value as "pdf" | "docx" | "txt" | "tex",
                  )
                }
              >
                <option value="pdf">PDF</option>
                <option value="docx">Word (DOCX)</option>
                <option value="txt">Text (TXT)</option>
                <option value="tex">LaTeX (TEX)</option>
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
          <div className="button-row">
            <button className="submit-btn" onClick={handleExport}>
              Export
            </button>
            {!isGuest && (
              <button
                className="publish-btn"
                onClick={handlePublish}
                disabled={isPublishing}
              >
                <FiShare2 />
                {isPublishing
                  ? "Publishing..."
                  : isPublic
                    ? "Update Public Link"
                    : "Publish & Share"}
              </button>
            )}
          </div>
          {isPublic && !isGuest && (
            <div className="public-link-display">
              <span className="public-status">✓ Published</span>
              <button
                className="view-link-btn"
                onClick={() => setShowPublishModal(true)}
              >
                View Link
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default FormPage;
