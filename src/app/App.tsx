import { useState, useEffect } from "react";
import "./App.css";
import Login from "./pages/login/Login";
import Signup from "./pages/login/Signup";
import UpdatePassword from "./pages/login/UpdatePassword";
import Dashboard from "./pages/dashboard/Dashboard";
import FormPage from "./pages/formPage/FormPage";
import PublicFormView from "./pages/publicView/PublicFormView";
import { getCurrentUser, signOut } from "../utils/auth";
import { getTemplateById, DEFAULT_TEMPLATE_ID } from "../data/templates";

type AuthPage = "login" | "signup" | "update-password";
type AppPage = "dashboard" | "survey" | "public-view";

function App() {
  const [user, setUser] = useState<any>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [authPage, setAuthPage] = useState<AuthPage>("login");
  const [currentPage, setCurrentPage] = useState<AppPage>("dashboard");
  const [loading, setLoading] = useState(true);

  // Form state for opening existing forms
  const [currentFormId, setCurrentFormId] = useState<string | undefined>();
  const [currentFormTitle, setCurrentFormTitle] = useState<string>(
    "AAPOR AI Disclosure Checklist",
  );
  const [currentFormData, setCurrentFormData] = useState<Record<string, any>>(
    {},
  );
  const [currentFormPublicId, setCurrentFormPublicId] = useState<
    string | undefined
  >();
  const [currentFormIsPublic, setCurrentFormIsPublic] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] =
    useState<string>(DEFAULT_TEMPLATE_ID);

  // Public form viewing state
  const [publicFormId, setPublicFormId] = useState<string | null>(null);

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

      // Check if we're viewing a public form
      const publicMatch = hash.match(/\/view\/([a-f0-9-]+)/i);
      if (publicMatch) {
        setPublicFormId(publicMatch[1]);
        setCurrentPage("public-view");
        setLoading(false);
        return;
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

  const handleCreateForm = (templateId: string) => {
    // Reset form state for new form
    const template = getTemplateById(templateId);
    setCurrentFormId(undefined);
    setCurrentFormTitle(template?.name || "New Form");
    setCurrentFormData({});
    setCurrentFormPublicId(undefined);
    setCurrentFormIsPublic(false);
    setCurrentTemplateId(templateId);
    setCurrentPage("survey");
  };

  const handleOpenForm = (
    formId: string,
    title: string,
    data: Record<string, any>,
    publicId?: string,
    isPublic?: boolean,
    templateId?: string,
  ) => {
    // Load existing form
    setCurrentFormId(formId);
    setCurrentFormTitle(title);
    setCurrentFormData(data);
    setCurrentFormPublicId(publicId);
    setCurrentFormIsPublic(isPublic || false);
    setCurrentTemplateId(templateId || DEFAULT_TEMPLATE_ID);
    setCurrentPage("survey");
  };

  const handleBackToDashboard = () => {
    // Clear form state when going back
    setCurrentFormId(undefined);
    setCurrentFormTitle("New Form");
    setCurrentFormData({});
    setCurrentFormPublicId(undefined);
    setCurrentFormIsPublic(false);
    setCurrentTemplateId(DEFAULT_TEMPLATE_ID);
    setCurrentPage("dashboard");
  };

  if (loading) {
    return (
      <div className="container">
        <p>Loading...</p>
      </div>
    );
  }

  // Show public form view (no auth required)
  if (currentPage === "public-view" && publicFormId) {
    return (
      <PublicFormView
        publicId={publicFormId}
        onBack={() => {
          setPublicFormId(null);
          setCurrentPage("dashboard");
          window.location.hash = "";
        }}
      />
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
        initialTitle="AI Disclosure Checklist"
        initialData={{}}
        templateId={DEFAULT_TEMPLATE_ID}
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
      initialPublicId={currentFormPublicId}
      initialIsPublic={currentFormIsPublic}
      templateId={currentTemplateId}
      onBackToDashboard={handleBackToDashboard}
    />
  );
}

export default App;
