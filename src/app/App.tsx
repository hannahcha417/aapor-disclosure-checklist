import { useState, useEffect } from "react";
import "./App.css";
import Login from "./pages/login/Login";
import Signup from "./pages/login/Signup";
import UpdatePassword from "./pages/login/UpdatePassword";
import Dashboard from "./pages/dashboard/Dashboard";
import FormPage from "./pages/formPage/FormPage";
import { getCurrentUser, signOut } from "../utils/auth";

type AuthPage = "login" | "signup" | "update-password";
type AppPage = "dashboard" | "survey";

function App() {
  const [user, setUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);
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
      // Check if we're on the update-password route first
      const hash = window.location.hash;
      if (hash.includes("type=recovery")) {
        setAuthPage("update-password");
        setLoading(false);
        return; // Don't check user yet, let password update handle it
      }

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

  const handlePasswordUpdated = async () => {
    const currentUser = await getCurrentUser();
    setUser(currentUser);
    setAuthPage("login");
  };

  const handleLogout = async () => {
    await signOut();
    setUser(null);
    setIsGuest(false);
    setCurrentPage("dashboard");
  };

  const handleGuestLogin = () => {
    setIsGuest(true);
    setCurrentPage("survey");
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
  if (!user && !isGuest) {
    if (authPage === "update-password") {
      return <UpdatePassword onPasswordUpdated={handlePasswordUpdated} />;
    }
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
        onGuestLogin={handleGuestLogin}
      />
    );
  }

  // Guest users go directly to form page
  if (isGuest) {
    return (
      <FormPage
        initialTitle="AAPOR AI Disclosure Checklist"
        initialData={{}}
        onBackToDashboard={() => {
          setIsGuest(false);
          setCurrentPage("dashboard");
        }}
        isGuest={true}
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
