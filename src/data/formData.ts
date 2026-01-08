export interface Question {
  id: string;
  label: string;
  type: "text" | "textarea" | "radio" | "checkbox";
  placeholder?: string;
  options?: string[];
  tooltip?: string;
  required?: boolean;
}

export interface CardData {
  id: string;
  title: string;
  summary: string;
  questions: Question[];
}

export const cardSections: CardData[] = [
  {
    id: "tasks-performed",
    title: "Tasks Performed by AI",
    summary:
      "Documenting what the AI did and why it was used is essential because different tasks introduce different risks. For example, if AI generated survey questions, bias could enter through wording choices influenced by training data. If AI cleaned data, errors might arise from misclassification or assumptions embedded in algorithms. Knowing the task helps readers assess where automation might affect validity.",
    questions: [
      {
        id: "q1",
        label: "How was the AI tool used?",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip:
          "Was AI used as a colleague helping to write the survey instrument, as an interviewer asking questions or even adding questions in response to answer, as a respondent simulating the target population, as an analyst cleaning or labelling or modelling the raw data, as briefer helping to create the report or other deliverable, or did AI work through multiple tasks?",
        required: true,
      },
      {
        id: "q2",
        label: "Briefly describe what the AI did.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip:
          "e.g., A voice-enabled AI chatbot administered the survey, adapting follow-up questions based on prior responses, while maintaining neutrality and standardized delivery.",
        required: true,
      },
    ],
  },
  {
    id: "human-oversight",
    title: "Human Oversight or Validation",
    summary:
      "Human review is a critical safeguard against AI-driven errors. Disclosing when and how oversight occurred shows whether potential mistakes—such as misinterpretation of responses or biased coding—were caught. Enhanced details (e.g., double-blind checks or statistical validation) indicate the rigor of error control. Without this, consumers cannot judge whether AI outputs were trusted blindly or verified systematically. What needs to be verified and how will evolve over time with model, infrastructure, and research into their validity.",
    questions: [
      {
        id: "q3",
        label:
          " For which task(s) was AI output reviewed or validated by researchers?",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip:
          "e.g., research design, generating responses, interviewing/assisting in interviewing, cleaning data, producing estimates, coding/labeling data, creating report",
        required: true,
      },
      {
        id: "q4",
        label: "How was oversight conducted?",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip:
          "e.g., manual review by two researchers, statistical checks, cross-validation with human-coded data",
        required: true,
      },
    ],
  },
  {
    id: "model-details",
    title: " Model Details",
    summary:
      "The model’s identity, version, and fine-tuning status matter because different models have different capabilities and biases. Proprietary models may lack transparency about training data, while open-source models might allow scrutiny. Custom configurations like temperature affect creativity and precision, influencing question phrasing or response generation. Reporting these settings helps explain variability and potential systematic bias in outputs.",
    questions: [
      {
        id: "q5",
        label: "What specific AI system was used?",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "e.g. GPT-4.0, GPT-5, etc",
        required: true,
      },
      {
        id: "q6",
        label:
          "Was the AI open source (publicly available) or proprietary (owned by a company)?",
        type: "radio",
        options: ["Open Source", "Proprietary", "Mixed/Hybrid"],
        required: true,
      },
      {
        id: "q7",
        label: "When was the AI model used for the task?",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "e.g. November 18, 2025",
        required: true,
      },
      {
        id: "q8",
        label:
          "Was the model fine-tuned (i.e. adjusting the AI to specialize in a certain task) for survey-related work?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "q9",
        label:
          "For finetuning, what data was used, and from what source(s)? If possible, please provide the link to access the data (e.g. Hugging Face dataset link), or cite the data's source.",
        type: "textarea",
        placeholder: "Type your answer here.",
        required: true,
      },
      {
        id: "q10",
        label: "Provide the link to the official model documentation.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "e.g. GPT-4.0, GPT-5, etc",
        required: true,
      },
      {
        id: "q11",
        label:
          "If and how RAG was used to ground information, and if so, what documents were used.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip:
          "e.g. RAG-powered the chatbot administering the survey, by using a catalog of approved questions",
        required: true,
      },
      {
        id: "q12",
        label:
          "Custom Configuration Settings: Temperature, max tokens, seed, number of runs, or other variation off of the default settings.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip:
          "Temperature controls creativity: lower = more precise, higher = more creative. Max tokens is the maximum length of AI output. Seed is a number that makes results reproducible. Number of runs is how many times the AI was ased to generate an output. Sample answer: temperature = 0.7, max tokens = 2,000, seed = 42, number of runs = 3",
        required: true,
      },
    ],
  },
  {
    id: "access-tooling-details",
    title: " Access/Tooling Details",
    summary:
      "How the AI was accessed (API vs. embedded tool) and the interface used can affect consistency and control. For instance, an interviewer bot embedded in a survey platform might introduce conversational bias differently than a static API call. Understanding the tooling context helps identify sources of error related to interaction design or technical constraints.",
    questions: [
      {
        id: "q13",
        label: "How was the model accessed?",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "e.g. API, website, embedded in a platform",
        required: true,
      },
      {
        id: "q14",
        label:
          "Where and how was the AI embedded or interacted with (if applicable)?",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip:
          "e.g. Qualtrics integration, custom dashboard, interviewer bot",
        required: true,
      },
    ],
  },
  {
    id: "core-prompts",
    title: "Core Prompts or Instructions",
    summary:
      "Prompts shape AI behavior. If instructions were vague or biased, outputs may reflect those biases. Exact prompts and system-wide instructions allow others to evaluate whether wording or framing introduced systematic error. For example, a prompt emphasizing “concise answers” might truncate nuanced responses, affecting data quality",
    questions: [
      {
        id: "q15",
        label:
          "While exact prompts are preferred, researchers can report high-level, plausibly abstracted prompts used to guide the model.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "Placeholder",
        required: true,
      },
      {
        id: "q16",
        label:
          "If available, please provide the exact prompts used to guide the model.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: false,
      },
      {
        id: "q17",
        label:
          "If applicable, please provide any global settings or instructions used to guide AI behavior.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: false,
      },
    ],
  },
  {
    id: "additional-enhanced-disclosures",
    title: "Additional Enhanced Disclosures",
    summary:
      "Code reveals whether automation introduced errors through implementation choices. For AI as interviewer, variability in questions can lead to measurement error, and documenting this helps assess comparability. For memory, stateful systems may carry context across interactions, introducing bias if prior responses influence later ones. Known biases help explicitly acknowledging biases (e.g. language or cultural skew), helping readers interpret findings cautiously.",
    questions: [
      {
        id: "q18",
        label: "Please provide any scripts or code used to call the AI.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: false,
      },
      {
        id: "q19",
        label:
          "If an AI tool was used as an interviewer, describe the characterization of variance in questions asked or representative samples of conversations.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: false,
      },
      {
        id: "q20",
        label: "Was the system stateful or stateless during interaction?",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip:
          "e.g. does the AI tool remember previous interactions and let them affect future interactions?",
        required: false,
      },
      {
        id: "q21",
        label: "Document any known biases that could affect survey results.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip:
          "e.g. cultural biases, language biases, demographic biases, all of which have been well documented in AI systems",
        required: false,
      },
      {
        id: "q22",
        label: "Why was the specific model and access/tooling chosen?",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip:
          "Some reasonable considerations include: performance, transparency, reproducibility, ethical considerations, cost, ease-of-use, no choice (i.e., model or access/tooling was the only option given some other constraint)",
        required: false,
      },
      {
        id: "q23",
        label:
          "If and where the AI failed or was wrong, was manual intervention needed? Please describe.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: false,
      },
    ],
  },
  {
    id: "human-respondents-disclosure",
    title: "Human Respondents Disclosure",
    summary:
      "Do NOT report: The number of AI instances used for any task, as this figure is often ambiguous, non-independent, and requires excessive context to interpret meaningfully. Reporting the number of human respondents clarifies the scale of human input versus automation. This matters because human validation often mitigates AI error. Not reporting AI instance counts avoids confusion, as that figure does not meaningfully indicate bias risk.",
    questions: [
      {
        id: "q24",
        label: "Report the total number of humans who performed the task",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip:
          "e.g., responded to the survey, validated AI outputs, coded data",
        required: true,
      },
      {
        id: "q25",
        label:
          "If human data was augmented in any way using synthetic data, describe how the synthetic data was created and used, and if or how the biases in the data were controlled for. Disclose if synthetic respondents are used in figures/tables/standard errors.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip:
          "e.g., responded to the survey, validated AI outputs, coded data",
        required: true,
      },
    ],
  },
];

export const getCardById = (id: string): CardData | undefined => {
  return cardSections.find((card) => card.id === id);
};
