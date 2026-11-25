import { z } from "zod";

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
export const stageSchema = z.enum(stages);
const text = z.string().trim().max(3000);
const longText = z.string().trim().max(24000);
const url = z.url({ protocol: /^https?$/ });
const date = z.iso.date();
export const interviewTypes = [
  "Recruiter screening",
  "Coding assessment",
  "Technical round",
  "System design",
  "Hiring manager",
  "HR discussion",
] as const;

export const interviewSchema = z.strictObject({
  id: z.uuid(),
  type: z.enum(interviewTypes),
  dateTime: z.iso.datetime({ offset: true }),
  interviewer: text.optional(),
  meetingLink: url.optional(),
  topics: longText.optional(),
  preparation: longText.optional(),
  questions: longText.optional(),
  review: longText.optional(),
  result: z.enum(["Scheduled", "Passed", "Rejected", "Pending", "Cancelled"]),
});

export const referralSchema = z.strictObject({
  id: z.uuid(),
  employee: text.min(1),
  company: text.optional(),
  role: text.optional(),
  profileUrl: url.optional(),
  status: z.enum([
    "Identified",
    "Contacted",
    "Responded",
    "Referred",
    "Declined",
  ]),
  message: longText.optional(),
  response: longText.optional(),
  followUp: date.optional(),
  outcome: text.optional(),
});

export const applicationSchema = z.strictObject({
  company: text.min(1).max(120),
  role: text.min(1).max(120),
  jobUrl: url.optional(),
  location: text.optional(),
  workModel: z.enum(["Remote", "Hybrid", "On-site"]).optional(),
  salaryRange: text.optional(),
  description: longText.optional(),
  source: text.optional(),
  skills: z.array(text.min(1).max(120)).max(50).optional(),
  deadline: date.optional(),
  notes: longText.optional(),
  appliedAt: date.optional(),
  resumeVersion: text.optional(),
  resumeText: longText.optional(),
  coverLetter: longText.optional(),
  followUp: date.optional(),
  rejectionReason: text.optional(),
  offer: z
    .strictObject({
      base: z.number().nonnegative().optional(),
      bonus: z.number().nonnegative().optional(),
      equity: z.number().nonnegative().optional(),
      currency: z.string().regex(/^[A-Z]{3}$/),
      notes: longText.optional(),
    })
    .optional(),
  referrals: z.array(referralSchema).max(50).optional(),
  interviews: z.array(interviewSchema).max(50).optional(),
  stage: stageSchema.optional(),
});

export const updateSchema = applicationSchema.partial().extend({
  version: z.number().int().positive(),
  clear: z
    .array(
      z.enum([
        "jobUrl",
        "location",
        "workModel",
        "salaryRange",
        "description",
        "source",
        "deadline",
        "notes",
        "appliedAt",
        "resumeVersion",
        "resumeText",
        "coverLetter",
        "followUp",
        "rejectionReason",
      ]),
    )
    .optional(),
  clearOffer: z.boolean().optional(),
});

export type Stage = z.infer<typeof stageSchema>;
export type ApplicationInput = z.infer<typeof applicationSchema>;
export type Application = Omit<ApplicationInput, "stage"> & {
  ownerId: string;
  stage: Stage;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  history: { from?: Stage; to: Stage; at: Date }[];
};
