import {
  assessmentStatuses,
  assessmentTypes,
  priorities,
  stages,
} from "@job-tracker/application-options";
import { z } from "zod";

export { stages };

export const stageSchema = z.enum(stages);
const text = z.string().trim().max(3000);
const longText = z.string().trim().max(24000);
const formattedText = z.string().max(48000).optional();
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
  topicsHtml: formattedText,
  preparation: longText.optional(),
  preparationHtml: formattedText,
  questions: longText.optional(),
  questionsHtml: formattedText,
  review: longText.optional(),
  reviewHtml: formattedText,
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
  messageHtml: formattedText,
  response: longText.optional(),
  responseHtml: formattedText,
  followUp: date.optional(),
  outcome: text.optional(),
});

export const prioritySchema = z.enum(priorities);
export const tagSchema = z.string().trim().min(1).max(40);
const tagsSchema = z
  .array(tagSchema)
  .max(25)
  .transform((tags) => [
    ...new Map(tags.map((tag) => [tag.toLowerCase(), tag])).values(),
  ]);

export const assessmentSchema = z.strictObject({
  id: z.uuid(),
  title: text.min(1).max(120),
  type: z.enum(assessmentTypes),
  status: z.enum(assessmentStatuses),
  deadline: date.optional(),
  submittedAt: date.optional(),
  repoUrl: url.optional(),
  outcome: text.optional(),
  notes: longText.optional(),
  notesHtml: formattedText,
});

export const applicationListQuery = z.object({
  stage: stageSchema.optional(),
  priority: prioritySchema.optional(),
  tag: tagSchema.optional(),
});

export const agendaQuery = z
  .object({ from: date.optional(), to: date.optional() })
  .refine(({ from, to }) => !from || !to || from <= to, {
    message: "from must be on or before to",
  });

export const applicationSchema = z.strictObject({
  company: text.min(1).max(120),
  role: text.min(1).max(120),
  jobUrl: url.optional(),
  location: text.optional(),
  workModel: z.enum(["Remote", "Hybrid", "On-site"]).optional(),
  salaryRange: text.optional(),
  description: longText.optional(),
  descriptionHtml: formattedText,
  source: text.optional(),
  skills: z.array(text.min(1).max(120)).max(50).optional(),
  deadline: date.optional(),
  priority: prioritySchema.optional(),
  tags: tagsSchema.optional(),
  assessments: z
    .array(assessmentSchema)
    .max(50)
    .refine(
      (entries) => new Set(entries.map(({ id }) => id)).size === entries.length,
      { message: "Assessment IDs must be unique" },
    )
    .optional(),
  notes: longText.optional(),
  notesHtml: formattedText,
  appliedAt: date.optional(),
  resumeVersion: text.optional(),
  resumeText: longText.optional(),
  resumeTextHtml: formattedText,
  coverLetter: longText.optional(),
  coverLetterHtml: formattedText,
  followUp: date.optional(),
  rejectionReason: text.optional(),
  offer: z
    .strictObject({
      base: z.number().nonnegative().optional(),
      bonus: z.number().nonnegative().optional(),
      equity: z.number().nonnegative().optional(),
      currency: z.string().regex(/^[A-Z]{3}$/),
      deadline: date.optional(),
      notes: longText.optional(),
      notesHtml: formattedText,
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
