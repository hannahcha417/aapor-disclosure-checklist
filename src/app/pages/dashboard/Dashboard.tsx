import { useState, useEffect } from "react";
import "./Dashboard.css";
import { FiFileText, FiTrash2 } from "react-icons/fi";
import {
  getActiveForms,
  deleteForm,
  type FormData,
} from "../../../utils/forms";

type DashboardProps = {
  onCreateForm: () => void;
  onOpenForm: (
    formId: string,
    title: string,
    data: Record<string, any>
  ) => void;
  onLogout: () => void;
};

function Dashboard({ onCreateForm, onOpenForm, onLogout }: DashboardProps) {
  const [activeForms, setActiveForms] = useState<FormData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveForms();
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
          <button className="btn" onClick={onCreateForm}>
            Create Blank Form
          </button>
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
                    onOpenForm(form.id!, form.title, form.form_data)
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
          <h3>Previous Submissions</h3>
          <div className="empty-state">
            <FiFileText className="empty-icon" />
            <p>No forms yet. Create your first form to get started!</p>
          </div>
        </div>
        <div className="logout-container">
          <button onClick={onLogout} className="btn">
            Logout
          </button>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
