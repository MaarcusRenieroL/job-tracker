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
  "Ghosted",
] as const;

export const closedStages = ["Rejected", "Withdrawn", "Ghosted"] as const;

export const priorities = ["High", "Medium", "Low"] as const;

export const workModels = ["Remote", "Hybrid", "On-site"] as const;

export const assessmentTypes = ["Online assessment", "Take-home"] as const;

export const assessmentStatuses = [
  "Not started",
  "In progress",
  "Submitted",
  "Completed",
  "Cancelled",
] as const;

export const interviewTypes = [
  "Recruiter screening",
  "Coding assessment",
  "Technical round",
  "System design",
  "Hiring manager",
  "HR discussion",
] as const;

export const interviewResults = [
  "Scheduled",
  "Passed",
  "Rejected",
  "Pending",
  "Cancelled",
] as const;

export const referralStatuses = [
  "Identified",
  "Contacted",
  "Responded",
  "Referred",
  "Declined",
] as const;

export const agendaEventKinds = [
  "application-deadline",
  "follow-up",
  "interview",
  "assessment",
  "referral-follow-up",
  "offer-deadline",
] as const;

export const clearableApplicationKeys = [
  "seniority",
  "jobUrl",
  "location",
  "workModel",
  "salaryRange",
  "description",
  "descriptionHtml",
  "source",
  "deadline",
  "priority",
  "notes",
  "notesHtml",
  "appliedAt",
  "resumeVersion",
  "resumeText",
  "resumeTextHtml",
  "coverLetter",
  "coverLetterHtml",
  "followUp",
  "rejectionReason",
] as const;

export const formattedApplicationFields = [
  "description",
  "notes",
  "resumeText",
  "coverLetter",
] as const;

export type Stage = (typeof stages)[number];
export type ClosedStage = (typeof closedStages)[number];
export type Priority = (typeof priorities)[number];
export type WorkModel = (typeof workModels)[number];
export type AssessmentType = (typeof assessmentTypes)[number];
export type AssessmentStatus = (typeof assessmentStatuses)[number];
export type InterviewType = (typeof interviewTypes)[number];
export type InterviewResult = (typeof interviewResults)[number];
export type ReferralStatus = (typeof referralStatuses)[number];
export type AgendaEventKind = (typeof agendaEventKinds)[number];
export type ClearableApplicationKey = (typeof clearableApplicationKeys)[number];
export type FormattedApplicationField =
  (typeof formattedApplicationFields)[number];
