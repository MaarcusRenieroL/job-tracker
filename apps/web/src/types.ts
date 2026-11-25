export const stages = [
  "Discovered",
  "Saved",
  "Applied",
  "Recruiter Contacted",
  "Screening",
  "Technical Interview",
  "Final Interview",
  "Offer",
  "Rejected",
  "Withdrawn",
] as const;
export type Stage = (typeof stages)[number];
export type Entry = Record<string, string | undefined> & { id: string };
export type Application = {
  _id: string;
  version: number;
  company: string;
  role: string;
  stage: Stage;
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
  offer?: {
    base?: number;
    bonus?: number;
    equity?: number;
    currency: string;
    notes?: string;
  };
  referrals?: Entry[];
  interviews?: Entry[];
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
