import "./Sidebar.css";

type SidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <aside className={`sidebar ${isOpen ? "open" : ""}`}>
      <button
        className="close-btn"
        onClick={onClose}
        aria-label="Close sidebar"
      >
        x
      </button>

      <nav>
        <ul>
          <header>
            AAPOR's Disclosure Checklist for the Use of AI in Surveys
          </header>
          <p>
            This checklist is organized into three categories. Immediate
            disclosures must be included in any reporting or methodological
            summaries and presented in a way that is clearly disclosed and
            easily accessible to readers. Core questions should be answered in
            all reporting scenarios ensuring consistent transparency across
            studies: this is the minimum viable disclosure to ensure that
            consumers of the polling data can understand potential bias and
            limitations. Enhanced questions are always valuable to answer, as
            they provide deeper insight into methods and AI involvement, but
            they are not mandatory in every situation: this is necessary for any
            situation that requires reproducibility. Nothing in this checklist
            is meant to override additional journal, IRB, CCPA/GDPR requirements
            for compliance and reporting. This is all in addition to other
            obligations.{" "}
          </p>
          <h2>How to fill out this form:</h2>
          <p>Placeholder</p>
          <h2>Form Submission:</h2>
          <p>Placeholder</p>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
