import { useState, useEffect } from "react";
import "./App.css";
import Login from "./pages/login/Login";
import Signup from "./pages/login/Signup";
import Dashboard from "./pages/dashboard/Dashboard";
import FormPage from "./pages/formPage/FormPage";
import { getCurrentUser, signOut } from "../utils/auth";

type AuthPage = "login" | "signup";
type AppPage = "dashboard" | "survey";

function App() {
  const [user, setUser] = useState<any>(null);
  const [authPage, setAuthPage] = useState<AuthPage>("login");
  const [currentPage, setCurrentPage] = useState<AppPage>("dashboard");
  const [loading, setLoading] = useState(true);

  // Form state for opening existing forms
  const [currentFormId, setCurrentFormId] = useState<string | undefined>();
  const [currentFormTitle, setCurrentFormTitle] = useState<string>(
    "AAPOR AI Disclosure Checklist"
  );
  const [currentFormData, setCurrentFormData] = useState<Record<string, any>>(
    {}
  );

  // Check if user is already logged in on mount
  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error("Error checking user:", error);
      } finally {
        setLoading(false);
      }
    };

    checkUser();
  }, []);

  const handleLoginSuccess = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const handleSignupSuccess = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setCurrentPage("dashboard");
  };

  const handleCreateForm = () => {
    // Reset form state for new form
    setCurrentFormId(undefined);
    setCurrentFormTitle("AAPOR AI Disclosure Checklist");
    setCurrentFormData({});
    setCurrentPage("survey");
  };

  const handleOpenForm = (
    formId: string,
    title: string,
    data: Record<string, any>
  ) => {
    // Load existing form
    setCurrentFormId(formId);
    setCurrentFormTitle(title);
    setCurrentFormData(data);
    setCurrentPage("survey");
  };

  const handleBackToDashboard = () => {
    // Clear form state when going back
    setCurrentFormId(undefined);
    setCurrentFormTitle("AAPOR AI Disclosure Checklist");
    setCurrentFormData({});
    setCurrentPage("dashboard");
  };

  if (loading) {
    return (
      <div className="container">
        <p>Loading...</p>
      </div>
    );
  }

  // Show auth screens if not logged in
  if (!user) {
    if (authPage === "signup") {
      return (
        <Signup
          onSwitchToLogin={() => setAuthPage("login")}
          onSignupSuccess={handleSignupSuccess}
        />
      );
    }
    return (
      <Login
        onSwitchToSignup={() => setAuthPage("signup")}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // Show dashboard
  if (currentPage === "dashboard") {
    return (
      <Dashboard
        onCreateForm={handleCreateForm}
        onOpenForm={handleOpenForm}
        onLogout={handleLogout}
      />
    );
  }

  // Show survey page
  return (
    <FormPage
      formId={currentFormId}
      initialTitle={currentFormTitle}
      initialData={currentFormData}
      onBackToDashboard={handleBackToDashboard}
    />
  );
}

export default App;
