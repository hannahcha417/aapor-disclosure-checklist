import { useState, useEffect, useRef } from "react";
import { FiEdit, FiArrowLeft, FiSave } from "react-icons/fi";
import Sidebar from "../../../components/Sidebar";
import ExpandableCard from "../../../components/ExpandableCard";
import { getCardById } from "../../../data/formData";
import { createForm, updateForm } from "../../../utils/forms";
import "./FormPage.css";

type FormPageProps = {
  onBackToDashboard: () => void;
  formId?: string;
  initialTitle?: string;
  initialData?: Record<string, any>;
};

function FormPage({
  onBackToDashboard,
  formId: initialFormId,
  initialTitle,
  initialData,
}: FormPageProps) {
  const [sideBarOpen, setSidebarOpen] = useState(false);
  const [formTitle, setFormTitle] = useState(initialTitle || "Untitled Form");
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [formId, setFormId] = useState<string | undefined>(initialFormId);
  const [formData, setFormData] = useState<Record<string, any>>(
    initialData || {}
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "">("");
  const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  // Auto-save every 5 seconds
  useEffect(() => {
    const saveForm = async () => {
      if (!formTitle.trim()) return;

      setIsSaving(true);
      setSaveStatus("saving");

      try {
        if (formId) {
          // Update existing form
          await updateForm(formId, formTitle, formData);
        } else {
          // Create new form
          const { data, error } = await createForm(formTitle, formData);
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
  }, [formTitle, formData, formId]);

  const handleManualSave = async () => {
    if (!formTitle.trim()) return;

    setIsSaving(true);
    setSaveStatus("saving");

    try {
      if (formId) {
        await updateForm(formId, formTitle, formData);
      } else {
        const { data, error } = await createForm(formTitle, formData);
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

  const handleSubmit = () => {
    // Placeholder for submit logic
    console.log("Form submitted!");
  };

  return (
    <div className="container">
      <Sidebar isOpen={sideBarOpen} onClose={() => setSidebarOpen(false)} />

      <button className="tab-btn left" onClick={onBackToDashboard}>
        <FiArrowLeft />
      </button>

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
            <button
              onClick={handleManualSave}
              disabled={isSaving}
              className="save-btn"
            >
              <FiSave /> Save
            </button>
          </div>
        </div>
      </header>

      <main className="content">
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
              onDataChange={(questionId, value) =>
                setFormData((prev) => ({ ...prev, [questionId]: value }))
              }
            />
          )}
          {getCardById("human-oversight") && (
            <ExpandableCard
              card={getCardById("human-oversight")!}
              initialData={formData}
              onDataChange={(questionId, value) =>
                setFormData((prev) => ({ ...prev, [questionId]: value }))
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
              onDataChange={(questionId, value) =>
                setFormData((prev) => ({ ...prev, [questionId]: value }))
              }
            />
          )}
          {getCardById("access-tooling-details") && (
            <ExpandableCard
              card={getCardById("access-tooling-details")!}
              initialData={formData}
              onDataChange={(questionId, value) =>
                setFormData((prev) => ({ ...prev, [questionId]: value }))
              }
            />
          )}
          {getCardById("core-prompts") && (
            <ExpandableCard
              card={getCardById("core-prompts")!}
              initialData={formData}
              onDataChange={(questionId, value) =>
                setFormData((prev) => ({ ...prev, [questionId]: value }))
              }
            />
          )}
          {getCardById("additional-enhanced-disclosures") && (
            <ExpandableCard
              card={getCardById("additional-enhanced-disclosures")!}
              initialData={formData}
              onDataChange={(questionId, value) =>
                setFormData((prev) => ({ ...prev, [questionId]: value }))
              }
            />
          )}
          {getCardById("human-respondents-disclosure") && (
            <ExpandableCard
              card={getCardById("human-respondents-disclosure")!}
              initialData={formData}
              onDataChange={(questionId, value) =>
                setFormData((prev) => ({ ...prev, [questionId]: value }))
              }
            />
          )}
        </section>

        <div className="submit-container">
          <button className="submit-btn" onClick={handleSubmit}>
            Approve
          </button>
        </div>
      </main>
    </div>
  );
}

export default FormPage;
