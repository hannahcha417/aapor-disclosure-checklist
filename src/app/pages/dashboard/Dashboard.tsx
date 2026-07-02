import { useState, useEffect } from "react";
import "./Dashboard.css";
import { FiFileText, FiTrash2, FiLink, FiCopy, FiX } from "react-icons/fi";
import {
  getActiveForms,
  deleteForm,
  getPublishedForms,
  unpublishForm,
  type FormData,
} from "../../../utils/forms";

type DashboardProps = {
  onCreateForm: (templateId: string) => void;
  onOpenForm: (
    formId: string,
    title: string,
    data: Record<string, any>,
    publicId?: string,
    isPublic?: boolean,
    templateId?: string,
  ) => void;
  onLogout: () => void;
};

const DISCLOSURE_LEVEL_OPTIONS: {
  id: "ai-simple" | "ai-enhanced" | "ai-full" | "aapor-transparency";
  label: string;
}[] = [
  {
    id: "ai-simple",
    label: "Simple AI disclosure (i.e., just AAPOR code regarding AI)",
  },
  {
    id: "ai-enhanced",
    label:
      "Enhanced AI disclosure (e.g., for academic publication) (i.e., previous + questions designed to facilitate reproducibility)",
  },
  {
    id: "ai-full",
    label:
      "Full AAPOR code and AI disclosure for academic publication (e.g., for POQ publication) (i.e., previous + full list of AAPOR required disclosures)",
  },
  {
    id: "aapor-transparency",
    label:
      "Full AAPOR code only, no AI disclosure (e.g., for POQ publication)",
  },
];

function Dashboard({ onCreateForm, onOpenForm, onLogout }: DashboardProps) {
  const [activeForms, setActiveForms] = useState<FormData[]>([]);
  const [publishedForms, setPublishedForms] = useState<FormData[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<string>("");
  const [unpublishTarget, setUnpublishTarget] = useState<FormData | null>(
    null,
  );
  const [unpublishing, setUnpublishing] = useState(false);

  useEffect(() => {
    loadActiveForms();
    loadPublishedForms();
  }, []);

  const loadActiveForms = async () => {
    try {
      const { data, error } = await getActiveForms();
      if (data && !error) {
        setActiveForms(data);
      }
    } catch (error) {
      console.error("Error loading forms:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadPublishedForms = async () => {
    try {
      const { data, error } = await getPublishedForms();
      if (data && !error) {
        setPublishedForms(data);
      }
    } catch (error) {
      console.error("Error loading published forms:", error);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    setShowTemplateModal(false);
    setSelectedLevel("");
    onCreateForm(templateId);
  };

  const getPublicUrl = (publicId: string) => {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}#/view/${publicId}`;
  };

  const copyToClipboard = async (e: React.MouseEvent, publicId: string) => {
    e.stopPropagation();
    const url = getPublicUrl(publicId);
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(publicId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const requestUnpublish = (e: React.MouseEvent, form: FormData) => {
    e.stopPropagation();
    setUnpublishTarget(form);
  };

  const confirmUnpublish = async () => {
    if (!unpublishTarget?.id) return;
    setUnpublishing(true);
    try {
      const { error } = await unpublishForm(unpublishTarget.id);
      if (!error) {
        setPublishedForms((prev) =>
          prev.filter((f) => f.id !== unpublishTarget.id),
        );
        setUnpublishTarget(null);
        loadActiveForms();
      } else {
        console.error("Error unpublishing form:", error);
        alert("Failed to unpublish form. Please try again.");
      }
    } catch (error) {
      console.error("Error unpublishing form:", error);
      alert("Failed to unpublish form. Please try again.");
    } finally {
      setUnpublishing(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, formId: string) => {
    e.stopPropagation(); // Prevent opening the form when clicking delete

    if (!window.confirm("Are you sure you want to delete this form?")) {
      return;
    }

    try {
      const { error } = await deleteForm(formId);
      if (!error) {
        // Remove the form from the local state
        setActiveForms((prev) => prev.filter((form) => form.id !== formId));
      } else {
        console.error("Error deleting form:", error);
        alert("Failed to delete form. Please try again.");
      }
    } catch (error) {
      console.error("Error deleting form:", error);
      alert("Failed to delete form. Please try again.");
    }
  };

  return (
    <div className="dashboard-container">
      <main className="dashboard-content">
        <div className="dashboard-header">
          <h1>Dashboard</h1>
        </div>

        <div className="forms-section">
          <h3>Create a New Form: </h3>
          <button className="btn" onClick={() => setShowTemplateModal(true)}>
            Create New Form
          </button>

          {/* Disclosure Purpose Questionnaire */}
          {showTemplateModal && (
            <div
              className="modal-overlay"
              onClick={() => {
                setShowTemplateModal(false);
                setSelectedLevel("");
              }}
            >
              <div
                className="modal-content template-modal"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="modal-close"
                  onClick={() => {
                    setShowTemplateModal(false);
                    setSelectedLevel("");
                  }}
                >
                  <FiX />
                </button>
                <h2>Start a New Disclosure</h2>
                <p className="modal-description">
                  What disclosure/research purpose are you filling out this
                  form for?
                </p>
                <div className="disclosure-level-list">
                  {DISCLOSURE_LEVEL_OPTIONS.map((opt) => (
                    <label
                      key={opt.id}
                      className={`disclosure-level-option ${
                        selectedLevel === opt.id ? "selected" : ""
                      }`}
                    >
                      <input
                        type="radio"
                        name="disclosure-level"
                        value={opt.id}
                        checked={selectedLevel === opt.id}
                        onChange={() => setSelectedLevel(opt.id)}
                      />
                      <div className="disclosure-level-text">
                        <span className="disclosure-level-label">
                          {opt.label}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="modal-buttons">
                  <button
                    className="modal-btn cancel"
                    onClick={() => {
                      setShowTemplateModal(false);
                      setSelectedLevel("");
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="modal-btn confirm"
                    disabled={!selectedLevel}
                    onClick={() => handleSelectTemplate(selectedLevel)}
                  >
                    Continue
                  </button>
                </div>
              </div>
            </div>
          )}

          <h3>Active Forms</h3>
          {loading ? (
            <p>Loading forms...</p>
          ) : activeForms.length > 0 ? (
            <div className="forms-grid">
              {activeForms.map((form) => (
                <div
                  key={form.id}
                  className="form-card"
                  onClick={() =>
                    onOpenForm(
                      form.id!,
                      form.title,
                      form.form_data,
                      form.public_id,
                      form.is_public,
                      form.template_id,
                    )
                  }
                >
                  <div className="form-card-icon">
                    <FiFileText />
                  </div>
                  <div className="form-card-content">
                    <h4>{form.title}</h4>
                    <p className="form-card-date">
                      Last edited: {formatDate(form.updated_at!)}
                    </p>
                  </div>
                  <button
                    className="delete-btn"
                    onClick={(e) => handleDelete(e, form.id!)}
                    aria-label="Delete form"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <FiFileText className="empty-icon" />
              <p>No forms yet. Create your first form to get started!</p>
            </div>
          )}
          <h3>Published Links</h3>
          {publishedForms.length > 0 ? (
            <div className="forms-grid">
              {publishedForms.map((form) => (
                <div
                  key={form.id}
                  className="form-card published-card"
                  onClick={() =>
                    window.open(getPublicUrl(form.public_id!), "_blank")
                  }
                >
                  <div className="form-card-icon published-icon">
                    <FiLink />
                  </div>
                  <div className="form-card-content">
                    <h4>{form.title}</h4>
                    <p className="form-card-date public-url">
                      {getPublicUrl(form.public_id!)}
                    </p>
                  </div>
                  <div className="published-actions">
                    <button
                      className="action-btn copy-btn"
                      onClick={(e) => copyToClipboard(e, form.public_id!)}
                      aria-label="Copy link"
                      title="Copy link"
                    >
                      <FiCopy />
                      {copiedId === form.public_id && (
                        <span className="copied-tooltip">Copied!</span>
                      )}
                    </button>
                    <button
                      className="action-btn unpublish-btn"
                      onClick={(e) => requestUnpublish(e, form)}
                      aria-label="Unpublish link"
                      title="Unpublish link"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <FiLink className="empty-icon" />
              <p>
                No published forms yet. Publish a form to share it publicly!
              </p>
            </div>
          )}
        </div>
        <div className="logout-container">
          <button onClick={onLogout} className="btn">
            Logout
          </button>
        </div>

        {unpublishTarget && (
          <div
            className="modal-overlay"
            onClick={() => !unpublishing && setUnpublishTarget(null)}
          >
            <div
              className="modal-content"
              onClick={(e) => e.stopPropagation()}
            >
              <h2>Unpublish this link?</h2>
              <p>
                The public link for{" "}
                <strong>{unpublishTarget.title}</strong> will stop working.
                Anyone with the link will no longer be able to view it. The
                form itself will remain in your Active Forms and can be
                published again later.
              </p>
              <div className="modal-buttons">
                <button
                  className="modal-btn cancel"
                  onClick={() => setUnpublishTarget(null)}
                  disabled={unpublishing}
                >
                  Cancel
                </button>
                <button
                  className="modal-btn confirm"
                  onClick={confirmUnpublish}
                  disabled={unpublishing}
                >
                  {unpublishing ? "Unpublishing..." : "Unpublish"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Dashboard;
