import { useState } from "react";
import { FiFileText, FiX } from "react-icons/fi";
import { signIn, resetPassword } from "../../../utils/auth";
import { allTemplates } from "../../../data/templates";
import "./Auth.css";

type LoginProps = {
  onSwitchToSignup: () => void;
  onLoginSuccess: () => void;
  onGuestLogin: (templateId: string) => void;
};

function Login({ onSwitchToSignup, onLoginSuccess, onGuestLogin }: LoginProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetMessage, setResetMessage] = useState("");
  const [showGuestWarning, setShowGuestWarning] = useState(false);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else if (data.user) {
        onLoginSuccess();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setResetMessage("");
    setLoading(true);

    try {
      const { error } = await resetPassword(email, "");
      if (error) {
        setError(error.message);
      } else {
        setResetMessage("Check your email for a password reset link!");
        setTimeout(() => {
          setShowForgotPassword(false);
          setResetMessage("");
        }, 3000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>AAPOR's Disclosure Checklist for the Use of AI in Surveys</h1>
        {!showForgotPassword ? (
          <>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="form-group">
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                />
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <p className="auth-switch">
              <button
                onClick={() => setShowForgotPassword(true)}
                className="switch-btn"
                style={{ marginRight: "10px" }}
              >
                Forgot password?
              </button>
            </p>

            <p className="auth-switch">
              Don't have an account?{" "}
              <button onClick={onSwitchToSignup} className="switch-btn">
                Sign up here
              </button>
            </p>

            <div className="guest-divider">
              <span>or</span>
            </div>

            <button
              type="button"
              className="guest-btn"
              onClick={() => setShowGuestWarning(true)}
            >
              Continue as Guest
            </button>

            {/* Template Selection Modal for Guests */}
            {showTemplateSelector && (
              <div
                className="modal-overlay"
                onClick={() => setShowTemplateSelector(false)}
              >
                <div
                  className="modal-content template-modal"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="modal-close"
                    onClick={() => setShowTemplateSelector(false)}
                  >
                    <FiX />
                  </button>
                  <h2>Choose a Template</h2>
                  <p className="modal-description">
                    Select a form template to get started
                  </p>
                  <div className="template-grid">
                    {allTemplates.map((template) => (
                      <div
                        key={template.id}
                        className="template-card"
                        onClick={() => onGuestLogin(template.id)}
                      >
                        <div className="template-card-icon">
                          <FiFileText />
                        </div>
                        <h4>{template.name}</h4>
                        <p>{template.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {showGuestWarning && (
              <div className="modal-overlay">
                <div className="modal-content">
                  <h2>Guest Mode Warning</h2>
                  <p>
                    Proceeding as a guest will{" "}
                    <strong>not allow you to save</strong> your progress on the
                    form (although you can still download a copy of your
                    responses).
                  </p>
                  <p>
                    We recommend <strong>creating an account</strong> to save
                    your work and access it later.
                  </p>
                  <div className="modal-buttons">
                    <button
                      className="modal-btn cancel"
                      onClick={() => setShowGuestWarning(false)}
                    >
                      Go Back
                    </button>
                    <button
                      className="modal-btn confirm"
                      onClick={() => {
                        setShowGuestWarning(false);
                        setShowTemplateSelector(true);
                      }}
                    >
                      Continue as Guest
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            <h2>Reset Password</h2>
            <form onSubmit={handleResetPassword}>
              <div className="form-group">
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  required
                />
              </div>

              {error && <div className="error-message">{error}</div>}
              {resetMessage && (
                <div className="success-message">{resetMessage}</div>
              )}

              <button type="submit" disabled={loading} className="submit-btn">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <p className="auth-switch">
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setError("");
                  setResetMessage("");
                }}
                className="switch-btn"
              >
                Back to login
              </button>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default Login;
