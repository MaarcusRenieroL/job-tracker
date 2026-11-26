export {
  agendaEventKinds,
  assessmentStatuses,
  assessmentTypes,
  clearableApplicationKeys,
  interviewResults,
  interviewTypes,
  priorities,
  referralStatuses,
  stages,
  workModels,
  type AgendaEvent,
  type AgendaEventKind,
  type Assessment,
  type AssessmentStatus,
  type AssessmentType,
  type ClearableApplicationKey,
  type FitEvidenceItem,
  type FitExplanation,
  type InterviewPrep,
  type InterviewPrepQuestion,
  type InterviewPrepTopic,
  type InterviewResult,
  type InterviewRound,
  type InterviewType,
  type Match,
  type OfferData,
  type OfferRow,
  type PostingSuggestions,
  type Priority,
  type ReferralContact,
  type ReferralStatus,
  type ResumeVersion,
  type Stage,
  type WorkModel,
} from "@job-tracker/application-options";
import type {
  Assessment,
  InterviewRound,
  OfferData,
  Priority,
  ReferralContact,
  Stage,
  StageTransition,
  WorkModel,
} from "@job-tracker/application-options";

export type Entry = Record<string, string | undefined> & { id: string };

export type Application = {
  _id: string;
  version: number;
  company: string;
  role: string;
  seniority?: string;
  stage: Stage;
  priority?: Priority;
  tags?: string[];
  assessments?: Assessment[];
  jobUrl?: string;
  location?: string;
  workModel?: WorkModel | string;
  salaryRange?: string;
  description?: string;
  descriptionHtml?: string;
  source?: string;
  skills?: string[];
  responsibilities?: string[];
  deadline?: string;
  notes?: string;
  notesHtml?: string;
  appliedAt?: string;
  resumeVersion?: string;
  resumeText?: string;
  resumeTextHtml?: string;
  coverLetter?: string;
  coverLetterHtml?: string;
  followUp?: string;
  rejectionReason?: string;
  offer?: OfferData;
  referrals?: ReferralContact[];
  interviews?: InterviewRound[];
  updatedAt?: string;
  createdAt?: string;
  history: StageTransition<string>[];
};
