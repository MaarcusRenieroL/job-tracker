import type { z } from "zod";
import type { AgendaEventKind, Stage } from "./options.js";
import type {
  applicationSchema,
  assessmentSchema,
  interviewSchema,
  offerSchema,
  profileInputSchema,
  referralSchema,
  updateSchema,
} from "./schemas.js";

export type ApplicationInput = z.infer<typeof applicationSchema>;
export type ApplicationUpdateInput = z.infer<typeof updateSchema>;
export type Assessment = z.infer<typeof assessmentSchema>;
export type InterviewRound = z.infer<typeof interviewSchema>;
export type ReferralContact = z.infer<typeof referralSchema>;
export type OfferData = z.infer<typeof offerSchema>;
export type ProfileInput = z.infer<typeof profileInputSchema>;

export type ResumeVersion = {
  id: string;
  resumeText: string;
  resumeHtml?: string;
  createdAt: string;
};

export type Profile = ProfileInput & {
  resumeVersions?: ResumeVersion[];
};

export type StageTransition<TDate = string> = {
  from?: Stage;
  to: Stage;
  at: TDate;
};

export type SkillMatchLevel = "strong" | "partial" | "missing";

export type SkillMatch = {
  skill: string;
  level: SkillMatchLevel | string;
  evidence: string | null;
};

export type MatchSignal = {
  target: string;
  evidence: string | null;
};

export type Match = {
  score: number | null;
  keywords: string[];
  location: MatchSignal | null;
  seniority: MatchSignal | null;
  matches: SkillMatch[];
  preparation: string[];
};

export type FitEvidenceItem = {
  point: string;
  evidence: string;
};

export type FitExplanation = {
  summary: string;
  strengths: FitEvidenceItem[];
  gaps: FitEvidenceItem[];
  preparation: FitEvidenceItem[];
};

export type PostingSuggestions = {
  seniority: string;
  skills: string[];
  responsibilities: string[];
};

export type InterviewPrepTopic = {
  topic: string;
  focus: string;
  source: string;
};

export type InterviewPrepQuestion = {
  question: string;
  category: string;
  whyAsked: string;
};

export type InterviewPrep = {
  topics: InterviewPrepTopic[];
  questions: InterviewPrepQuestion[];
};

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
