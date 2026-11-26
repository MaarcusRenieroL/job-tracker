import { z } from "zod";
import {
  assessmentStatuses,
  assessmentTypes,
  clearableApplicationKeys,
  interviewResults,
  interviewTypes,
  priorities,
  referralStatuses,
  stages,
  workModels,
} from "./options.js";

const text = z.string().trim().max(3000);
const longText = z.string().trim().max(24000);
const formattedText = z.string().max(48000).optional();
const httpUrl = z.url({ protocol: /^https?$/ });
const isoDate = z.iso.date();

export const stageSchema = z.enum(stages);
export const prioritySchema = z.enum(priorities);
export const workModelSchema = z.enum(workModels);
export const tagSchema = z.string().trim().min(1).max(40);

export const tagsSchema = z
  .array(tagSchema)
  .max(25)
  .transform((tags) => [
    ...new Map(tags.map((tag) => [tag.toLowerCase(), tag])).values(),
  ]);

export const interviewSchema = z.strictObject({
  id: z.uuid(),
  type: z.enum(interviewTypes),
  dateTime: z.iso.datetime({ offset: true }),
  interviewer: text.optional(),
  meetingLink: httpUrl.optional(),
  topics: longText.optional(),
  topicsHtml: formattedText,
  preparation: longText.optional(),
  preparationHtml: formattedText,
  questions: longText.optional(),
  questionsHtml: formattedText,
  review: longText.optional(),
  reviewHtml: formattedText,
  result: z.enum(interviewResults),
});

export const referralSchema = z.strictObject({
  id: z.uuid(),
  employee: text.min(1),
  company: text.optional(),
  role: text.optional(),
  profileUrl: httpUrl.optional(),
  status: z.enum(referralStatuses),
  message: longText.optional(),
  messageHtml: formattedText,
  response: longText.optional(),
  responseHtml: formattedText,
  followUp: isoDate.optional(),
  outcome: text.optional(),
});

export const assessmentSchema = z.strictObject({
  id: z.uuid(),
  title: text.min(1).max(120),
  type: z.enum(assessmentTypes),
  status: z.enum(assessmentStatuses),
  deadline: isoDate.optional(),
  submittedAt: isoDate.optional(),
  repoUrl: httpUrl.optional(),
  outcome: text.optional(),
  notes: longText.optional(),
  notesHtml: formattedText,
});

export const offerSchema = z.strictObject({
  base: z.number().nonnegative().optional(),
  bonus: z.number().nonnegative().optional(),
  equity: z.number().nonnegative().optional(),
  currency: z.string().regex(/^[A-Z]{3}$/),
  deadline: isoDate.optional(),
  notes: longText.optional(),
  notesHtml: formattedText,
});

export const applicationListQuery = z.object({
  stage: stageSchema.optional(),
  priority: prioritySchema.optional(),
  tag: tagSchema.optional(),
});

export const agendaQuery = z
  .object({ from: isoDate.optional(), to: isoDate.optional() })
  .refine(({ from, to }) => !from || !to || from <= to, {
    message: "from must be on or before to",
  });

export const applicationSchema = z.strictObject({
  company: text.min(1).max(120),
  role: text.min(1).max(120),
  seniority: text.max(120).optional(),
  jobUrl: httpUrl.optional(),
  location: text.optional(),
  workModel: workModelSchema.optional(),
  salaryRange: text.optional(),
  description: longText.optional(),
  descriptionHtml: formattedText,
  source: text.optional(),
  skills: z.array(text.min(1).max(120)).max(50).optional(),
  responsibilities: z.array(text.min(1).max(300)).max(25).optional(),
  deadline: isoDate.optional(),
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
  appliedAt: isoDate.optional(),
  resumeVersion: text.optional(),
  resumeText: longText.optional(),
  resumeTextHtml: formattedText,
  coverLetter: longText.optional(),
  coverLetterHtml: formattedText,
  followUp: isoDate.optional(),
  rejectionReason: text.optional(),
  offer: offerSchema.optional(),
  referrals: z.array(referralSchema).max(50).optional(),
  interviews: z.array(interviewSchema).max(50).optional(),
  stage: stageSchema.optional(),
});

export const updateSchema = applicationSchema.partial().extend({
  version: z.number().int().positive(),
  clear: z.array(z.enum(clearableApplicationKeys)).optional(),
  clearOffer: z.boolean().optional(),
});

export const profileInputSchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
  resumeText: z.string().trim().min(1).max(24000),
  resumeHtml: z.string().max(100000).optional(),
});
