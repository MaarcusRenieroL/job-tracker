import {
  assessmentStatuses,
  assessmentTypes,
  priorities,
  stages,
} from "@job-tracker/application-options";

export { stages, priorities, assessmentTypes, assessmentStatuses };

export type Stage = (typeof stages)[number];

export type Priority = (typeof priorities)[number];

export type AssessmentType = (typeof assessmentTypes)[number];

export type AssessmentStatus = (typeof assessmentStatuses)[number];

export type Entry = Record<string, string | undefined> & { id: string };

export type Assessment = {
  id: string;
  title: string;
  type: AssessmentType;
  status: AssessmentStatus;
  deadline?: string;
  submittedAt?: string;
  repoUrl?: string;
  outcome?: string;
  notes?: string;
};

export type OfferData = {
  base?: number;
  bonus?: number;
  equity?: number;
  currency: string;
  deadline?: string;
  notes?: string;
};

export type Application = {
  _id: string;
  version: number;
  company: string;
  role: string;
  stage: Stage;
  priority?: Priority;
  tags?: string[];
  assessments?: Entry[];
  jobUrl?: string;
  location?: string;
  workModel?: string;
  salaryRange?: string;
  description?: string;
  source?: string;
  skills?: string[];
  deadline?: string;
  notes?: string;
  appliedAt?: string;
  resumeVersion?: string;
  resumeText?: string;
  coverLetter?: string;
  followUp?: string;
  rejectionReason?: string;
  offer?: OfferData;
  referrals?: Entry[];
  interviews?: Entry[];
  updatedAt?: string;
  createdAt?: string;
  history: { from?: Stage; to: Stage; at: string }[];
};

export type Match = {
  score: number | null;
  keywords: string[];
  location: { target: string; evidence: string | null } | null;
  seniority: { target: string; evidence: string | null } | null;
  matches: { skill: string; level: string; evidence: string | null }[];
  preparation: string[];
};

export type AgendaEventKind =
  | "application-deadline"
  | "follow-up"
  | "interview"
  | "assessment"
  | "referral-follow-up"
  | "offer-deadline";

export type AgendaEvent = {
  id: string;
  applicationId: string;
  company: string;
  role: string;
  kind: AgendaEventKind;
  title: string;
  date: string;
  dateTime?: string;
};

export type OfferRow = {
  _id: string;
  company: string;
  role: string;
  stage: Stage;
  offer: OfferData;
};
