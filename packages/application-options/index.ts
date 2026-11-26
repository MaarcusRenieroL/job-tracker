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

export const priorities = ["High", "Medium", "Low"] as const;

export const assessmentTypes = ["Online assessment", "Take-home"] as const;

export const assessmentStatuses = [
  "Not started",
  "In progress",
  "Submitted",
  "Completed",
  "Cancelled",
] as const;
