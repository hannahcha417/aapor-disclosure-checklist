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
    id: "first-data-source",
    title: "First Data Source",
    summary: "",
    questions: [
      {
        id: "q1",
        label:
          "Describe type (e.g. survey, government records, text or other media, etc.) and source of data (collected by the authors, scraped from the web source such as social media, secondary data analysis, etc.)",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: true,
      },
    ],
  },
  {
    id: "data-collection-strategy",
    title: "Data Collection Strategy",
    summary: "",
    questions: [
      {
        id: "q2",
        label: "Describe the data collection strategies employed",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "e.g. surveys, focus groups, content analyses",
        required: true,
      },
    ],
  },
  {
    id: "research-sponsor-and-conductor",
    title: "Research Sponsor and Conductor",
    summary: "",
    questions: [
      {
        id: "q3",
        label:
          "Name the sponsor of the research and the party(ies) who conducted it. If the original source of funding is different than the sponsor, this source will also be disclosed.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: true,
      },
    ],
  },
  {
    id: "measurement-tools-instruments",
    title: "Measurement Tools/Instruments",
    summary:
      "Measurement tools include questionnaires with survey questions and response options, show cards, vignettes, or scripts used to guide discussions or interviews. The exact wording and presentation of any measurement tool from which rresults are reported as well as any preceding contextual information that might reasonably be expected to influence responses to the reported results and instructions to respondents or interviewers should be included. Also included are scripts used to guide discussions and semi-structured interviews and any instructions to researchers, interviewers, moderators, and participants in the research. Content analyses and ethnographic research will provide the scheme or guide used to categorize the data; researchers will also disclose if no formal scheme was used.",
    questions: [
      {
        id: "q4",
        label:
          "Describe the measurement tools and instruments used in the research.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: true,
      },
    ],
  },
  {
    id: "population-under-study",
    title: "Population Under Study",
    summary:
      "Survey and public opinion research can be conducted with many different populations including, but not limited to, the general public, voters, people working in particular sectors, blog postings, news broadcasts, an elected official's social media feed. Researchers will be specific about the decision rules used to define the population when describing the study population, including location, age, other social or demographic characteristics (e.g. persons who access the internet), time (e.g. immigrants entering the US between 2015 and 2019). Content analyses will also include the unit of analysis (e.g. news article, social media post) and the source of the data (e.g. Twitter, Lexis-Nexis).",
    questions: [
      {
        id: "q4",
        label: "Describe the population under study.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: true,
      },
    ],
  },
  {
    id: "methods-used-generate-and-recruit-sample",
    title: "Methods Used to Generate and Recruit the Sample",
    summary:
      "The description of the methods of sampling includes the sample design and methods used to contact or recruit research participants or collect units of analysis (content analysis).",
    questions: [
      {
        id: "q5",
        label:
          "Explicitly state whether the sample comes from a frame selected using a probability-based methodology, or if the sample was selected using non-probability methods.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip:
          "A probability-based methodology means selecting potential participants with a known non-zero probability from a known frame. A non-probability method could be potential participants from opt-in, volunteer, or other sources.",
        required: true,
      },
      {
        id: "q6",
        label:
          "Explicitly state whether the sample comes from a frame selected using a probability-based methodology, or if the sample was selected using non-probability methods.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip:
          "A probability-based methodology means selecting potential participants with a known non-zero probability from a known frame. A non-probability method could be potential participants from opt-in, volunteer, or other sources.",
        required: true,
      },
      {
        id: "q7",
        label:
          "For surveys, focus groups, or other forms of interviews, provide a clear indication of method(s) by which participants were contacted, selected, recruited, and intercepted, or otherwise contacted or encountered, along with any eligibility requirements and/or oversampling.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: true,
      },
      {
        id: "q8",
        label: "Describe any use of quotas.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: true,
      },
      {
        id: "q9",
        label:
          "Include the geographic location of data collection activities for any in-person research.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: true,
      },
      {
        id: "q10",
        label:
          "For content analysis, detail the criteria or decision rules used to include or exclude elements of content and any approaches used to sample content. If a census of the target population of content was used, that will be explicitly stated.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: true,
      },
      {
        id: "q11",
        label:
          "Provide details of any strategies used to help gain cooperation (e.g. advance contact, letters, scripts, compensation or incentives, refusal conversion contacts) whether for participants in a survey, group, panel, or for participation in a particular research project.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: true,
      },
      {
        id: "q12",
        label:
          "Describe any compensation/incentives provided to research subjects and the method of delivery (debit card, gift card, cash).",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: true,
      },
    ],
  },
  {
    id: "methods-and-modes-of-data-collection",
    title: "Method(s) and Mode(s) of Data Collection",
    summary:
      "Include a description of all mode(s) used to contact participants or collect data or information (e.g. CATI, CAPI, ACASI, IVR, mail, web for survey; paper and pencil, audio or video recording for qualitative research, etc) and the language(s) offered or included. For qualitative research such as in-depth interviews and focus groups, also include length of interviews or the focus group session.",
    questions: [
      {
        id: "q13",
        label:
          "Based on the description above, provide a description of method(s) and mode(s) of data collection.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "e.g. API, website, embedded in a platform",
        required: true,
      },
    ],
  },
  {
    id: "sample-sizes-and-precision",
    title: "Sample Sizes",
    summary:
      "Sample Sizes (by sampling frame if more than one frame was used) and (if applicable) discussion of the precision of the results",
    questions: [
      {
        id: "q15",
        label:
          "Provide sample sizes for each mode of data collection (for surveys include sample sizes for each frame, list, or panel used). If a sample was drawn from a larger frame, provide the size of the frame and the sampling fraction. For content analyses, provide the number of content units analyzed and the size of the population from which they were drawn.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: true,
      },
      {
        id: "q16",
        label:
          "For probability sample surveys, report estimates of sampling error (often described as the margin of error) and discuss whether or not the reported sampling error or statistical analyses have been adjusted for the design effect due to weighting, clustering, or other factors.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: true,
      },
      {
        id: "q17",
        label:
          "Reports of non-probability sample surveys will only provide measures of precision if they are defined and accompanied by a detailed description of how the underlying model was specified, its assumptions validated, and the measure(s) calculated.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: true,
      },
      {
        id: "q18",
        label:
          "If content was analyzed using human coders, report the number of coders, whether inter-coder reliability estimates were calculated for any variables, and the resulting estimates.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: true,
      },
    ],
  },
  {
    id: "whether-and-how-data-weighted",
    title: "Whether and How the Data Were Weighted",
    summary: "",
    questions: [
      {
        id: "q18",
        label:
          "Specify whether the data were weighted. If weights were used, describe how the weights were calculated, including the variables used and the sources of the weighing parameters.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: true,
      },
    ],
  },
  {
    id: "how-the-data-were-processed-procedures",
    title: "Data Processes and Procedures for Data Quality",
    summary: "",
    questions: [
      {
        id: "q19",
        label:
          "Describe validity checks, where applicable, including but not limited to whether the researcher added attention checks, logic checks, or excluded respondents who straight-lined or completed the survey under a certain time constraint, any screening of content for evidence that it originated from bots or fabricated profiles, recontacts to confirm that the interview occurred or to verify respondents' identity or both, and measures to prevent respondents from completing the survey more than once. Any data imputation or other data exclusions or replacement will also be discussed. Researchers will provide information about whether any coding was done by software or human coders (or both); if automated coding was done, name the software and specify the parameters or decision rules that occurred.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: true,
      },
    ],
  },
  {
    id: "panel",
    title: "Panel Information",
    summary: "",
    questions: [
      {
        id: "q20",
        label: "Was a panel used?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "q21",
        label:
          "Please describe the procedures for managing the membership, participation, and attrition of the panel, and if a pool, panel, or access panel was used. This should be disclosed for both probability and non-probability surveys relying on recruited panels of participants.",
        type: "textarea",
        placeholder: "Type your answer here.",
        required: true,
      },
    ],
  },
  {
    id: "interviewer-or-coders",
    title: "Interviewer or Coders Information",
    summary: "",
    questions: [
      {
        id: "q22",
        label: "Was an interviewer or coder used?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "q23",
        label:
          "Please provide interviewer details, such as methods of interviewer or coder training and details of supervision and monitoring of interviewers or human coders. If machine coding was conducted, include a description of the machine learning involved in the coding.",
        type: "textarea",
        placeholder: "Type your answer here.",
        required: true,
      },
    ],
  },
  {
    id: "eligibility-screening",
    title: "Eligibility Screening",
    summary: "",
    questions: [
      {
        id: "q24",
        label: "Was eligibility screening used?",
        type: "radio",
        options: ["Yes", "No"],
        required: true,
      },
      {
        id: "q25",
        label:
          "Please provide details about the screening procedures, including any screening for other surveys or data collection that would have made sample or selected members ineligible for the current data collection (e.g. survey, focus group, interview) will be disclosed (e.g., in the case of online surveys if a router was used).",
        type: "textarea",
        placeholder: "Type your answer here.",
        required: true,
      },
    ],
  },
  {
    id: "study-stimuli",
    title: "Study Stimuli",
    summary: "",
    questions: [
      {
        id: "q26",
        label:
          "Any relevant stimuli, such as visual or sensory exhibits or show cards. In the cae of surveys conducted via self-administered computer-assisted interviewing, providing the relevant screenshot(s) is strongly encouraged, though not required.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: true,
      },
    ],
  },
  {
    id: "dispositions-response-participation-rate",
    title: "Dispositions, Response, or Participation Rate",
    summary: "",
    questions: [
      {
        id: "q27",
        label:
          "Summaries of the disposition of study-specific sample records so that response rates for probability samples and participation rates for non-probability samples can be computed. If response or cooperation rates are reported, they will be computed according to the AAPOR Standard Definitions. If dispositions cannot be provided, explain the reason(s) why they cannot be disclosed, and this will be mentioned as a limitation of the study.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: true,
      },
    ],
  },
  {
    id: "sample-sizes",
    title: "Sample Sizes",
    summary: "",
    questions: [
      {
        id: "q28",
        label:
          "The unweighted sample size(s) on which each estimate or analysis is based and an explanation of sample sizes (e.g. why cases are dropped from analyses)",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: true,
      },
    ],
  },
  {
    id: "measurement-model-specification",
    title: "Measurement and Model Specification",
    summary: "",
    questions: [
      {
        id: "q29",
        label:
          "Specifications adequate for replication of indices or statistical modeling included in the paper.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: true,
      },
    ],
  },
  {
    id: "general-statement",
    title: "Limitations of the Design and Data Collection",
    summary: "",
    questions: [
      {
        id: "q30",
        label:
          "Please provide a general and brief statement summarizing the limitations of the specific data collection procedures used.",
        type: "textarea",
        placeholder: "Type your answer here.",
        tooltip: "",
        required: true,
      },
    ],
  },
];

export const getCardById = (id: string): CardData | undefined => {
  return cardSections.find((card) => card.id === id);
};
