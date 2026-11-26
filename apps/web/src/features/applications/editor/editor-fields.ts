import {
  assessmentStatuses,
  assessmentTypes,
  priorities,
  stages,
} from "../../../types/application";

export type Field = {
  name: string;
  label: string;
  type?:
    | "text"
    | "url"
    | "date"
    | "datetime-local"
    | "number"
    | "select"
    | "textarea"
    | "plain-textarea";
  choices?: readonly string[];
  placeholder?: string;
  allowClear?: boolean;
  wide?: boolean;
};

export const postingFields: Field[] = [
  { name: "company", label: "Company", placeholder: "e.g. Stripe" },
  {
    name: "role",
    label: "Job title",
    placeholder: "e.g. Staff Product Engineer",
  },
  {
    name: "seniority",
    label: "Seniority level",
    placeholder: "e.g. Senior, Staff, Mid-level",
  },
  {
    name: "location",
    label: "Location",
    placeholder: "e.g. San Francisco, CA",
  },
  {
    name: "workModel",
    label: "Work model",
    type: "select",
    choices: ["Remote", "Hybrid", "On-site"],
    allowClear: true,
  },
  {
    name: "salaryRange",
    label: "Listed salary range",
    placeholder: "e.g. $190k – $240k",
  },
  {
    name: "source",
    label: "Source",
    placeholder: "e.g. Referral, Direct, LinkedIn",
  },
  {
    name: "jobUrl",
    label: "Job posting URL",
    type: "url",
    placeholder: "https://...",
  },
  { name: "deadline", label: "Application deadline", type: "date" },
  {
    name: "priority",
    label: "Priority",
    type: "select",
    choices: priorities,
    allowClear: true,
  },
  {
    name: "tags",
    label: "Tags (comma-separated)",
    placeholder: "fintech, typescript, distributed",
  },
  {
    name: "skills",
    label: "Required skills (comma-separated)",
    placeholder: "TypeScript, React, Distributed Systems, PostgreSQL",
    wide: true,
  },
  {
    name: "responsibilities",
    label: "Key responsibilities (one per line)",
    type: "plain-textarea",
    placeholder:
      "Design and ship resilient backend APIs\nPartner with product on roadmap execution",
    wide: true,
  },
  {
    name: "description",
    label: "Job description",
    type: "textarea",
    placeholder: "Paste key responsibilities and requirements...",
    wide: true,
  },
  {
    name: "notes",
    label: "Research & team notes",
    type: "textarea",
    placeholder: "Hiring manager context, product notes, questions to ask...",
    wide: true,
  },
];

export const applicationFields: Field[] = [
  {
    name: "stage",
    label: "Pipeline stage",
    type: "select",
    choices: stages,
  },
  { name: "appliedAt", label: "Application date", type: "date" },
  { name: "followUp", label: "Follow-up date", type: "date" },
  {
    name: "resumeVersion",
    label: "Resume version",
    placeholder: "e.g. v4-staff-fe",
  },
  {
    name: "rejectionReason",
    label: "Outcome / rejection note",
    placeholder: "Optional reason if closed",
    wide: true,
  },
  {
    name: "resumeText",
    label: "Resume text (used for deterministic skill matching)",
    type: "textarea",
    placeholder: "Paste the plain text of the resume you submitted...",
    wide: true,
  },
  {
    name: "coverLetter",
    label: "Cover letter / outreach note",
    type: "textarea",
    placeholder: "Optional cover letter or intro pitch...",
    wide: true,
  },
];

export const assessmentFields: Field[] = [
  {
    name: "title",
    label: "Assessment title",
    placeholder: "e.g. Distributed Sync Engine",
  },
  { name: "type", label: "Type", type: "select", choices: assessmentTypes },
  {
    name: "status",
    label: "Status",
    type: "select",
    choices: assessmentStatuses,
  },
  { name: "deadline", label: "Due date", type: "date" },
  { name: "submittedAt", label: "Submitted date", type: "date" },
  {
    name: "repoUrl",
    label: "Repository / submission URL",
    type: "url",
    placeholder: "https://github.com/...",
  },
  {
    name: "outcome",
    label: "Outcome",
    placeholder: "e.g. Strong pass, 96/100",
    wide: true,
  },
  {
    name: "notes",
    label: "Prompt & implementation notes",
    type: "textarea",
    wide: true,
  },
];

export const referralFields: Field[] = [
  {
    name: "employee",
    label: "Contact name",
    placeholder: "e.g. Elena Rostova",
  },
  { name: "role", label: "Contact role", placeholder: "e.g. Staff Engineer" },
  {
    name: "company",
    label: "Company",
    placeholder: "Defaults to posting company",
  },
  {
    name: "profileUrl",
    label: "Profile URL",
    type: "url",
    placeholder: "https://...",
  },
  {
    name: "status",
    label: "Outreach status",
    type: "select",
    choices: ["Identified", "Contacted", "Responded", "Referred", "Declined"],
  },
  { name: "followUp", label: "Follow-up date", type: "date" },
  {
    name: "outcome",
    label: "Referral outcome",
    placeholder: "e.g. Submitted internal portal link",
    wide: true,
  },
  { name: "message", label: "Message sent", type: "textarea", wide: true },
  { name: "response", label: "Contact response", type: "textarea", wide: true },
];

export const interviewFields: Field[] = [
  {
    name: "type",
    label: "Round type",
    type: "select",
    choices: [
      "Recruiter screening",
      "Coding assessment",
      "Technical round",
      "System design",
      "Hiring manager",
      "HR discussion",
    ],
  },
  { name: "dateTime", label: "Date & time", type: "datetime-local" },
  { name: "interviewer", label: "Interviewer", placeholder: "Name & title" },
  {
    name: "meetingLink",
    label: "Meeting URL",
    type: "url",
    placeholder: "https://...",
  },
  {
    name: "result",
    label: "Result",
    type: "select",
    choices: ["Scheduled", "Passed", "Rejected", "Pending", "Cancelled"],
    wide: true,
  },
  { name: "topics", label: "Topics covered", type: "textarea", wide: true },
  {
    name: "preparation",
    label: "Preparation notes",
    type: "textarea",
    wide: true,
  },
  { name: "questions", label: "Questions asked", type: "textarea", wide: true },
  {
    name: "review",
    label: "Self-review & debrief",
    type: "textarea",
    wide: true,
  },
];

export const offerFields: Field[] = [
  {
    name: "base",
    label: "Base salary",
    type: "number",
    placeholder: "e.g. 210000",
  },
  {
    name: "bonus",
    label: "Annual / signing bonus",
    type: "number",
    placeholder: "e.g. 30000",
  },
  {
    name: "equity",
    label: "Equity grant value",
    type: "number",
    placeholder: "e.g. 120000",
  },
  {
    name: "currency",
    label: "ISO Currency (3 letters)",
    placeholder: "USD, INR, EUR",
  },
  { name: "deadline", label: "Decision deadline", type: "date", wide: true },
  {
    name: "notes",
    label: "Vesting schedule, benefits & negotiation notes",
    type: "textarea",
    wide: true,
  },
];

export const NONE_KEY = "__none__";
