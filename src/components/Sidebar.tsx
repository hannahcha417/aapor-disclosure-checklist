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
            This form is intended to make it easy and straightforward to fill
            out AAPOR's Disclosure Checklist for the Use of AI in Surveys
            through an online form. It also allows you to easily export your
            answers to integrate in your paper, or make your completed form
            publicly available for greater transparency.
          </p>
          <p>
            This checklist is organized into two categories. Immediate
            disclosures must be included in any reporting or methodological
            summaries. Core/enhanced questions should be answered in all
            reporting scenarios ensuring consistent transparency across
            studies and are always valuable to answer, as they provide deeper
            insight into methods and AI involvement. Nothing in this checklist
            is meant to override additional journal, IRB, CCPA/GDPR
            requirements for compliance and reporting.
          </p>
          <h2>How to fill out this form:</h2>
          <p>
            This form is estimated to take ~10-15 minutes. Each major section
            in the form can be expanded to show the required questions to
            fill. Save your form using the button on the top right, which
            saves your progress so you can return to it at any time in your
            account. If you do not have an account, your answers will not be
            saved unless you export your form to save locally. Each set of
            questions is intended to be answered about one use case for an AI
            system (e.g. to interview participants) within your study. You can
            add different use cases for an AI system by using the button on
            the bottom right.
          </p>
          <h2>Form Submission:</h2>
          <p>
            You can export your answers to this question using the "Export"
            option at the bottom of the page. There are a few export options,
            such as exporting as a question list or in paragraph prose. You
            can also make your form publicly available by publishing a link,
            which would allow anyone to see your form responses.
          </p>
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;
