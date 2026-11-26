import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type SetStateAction } from "react";
import { useController, useForm } from "react-hook-form";
import { z } from "zod";
import type { Profile } from "@/features/profile/profile";
import type { Application } from "@/types/application";
import { initialFields, localDateTime, toEntryList } from "./editor-form";

const httpUrl = z.url({ protocol: /^https?$/ });
const optionalUrl = (message: string) =>
  z
    .string()
    .optional()
    .refine((value) => !value?.trim() || httpUrl.safeParse(value.trim()).success, message);

const assessmentEntrySchema = z
  .object({
    id: z.string(),
    title: z
      .string()
      .optional()
      .refine((value) => Boolean(value?.trim()), "Enter a title for every assessment.")
      .refine((value) => (value?.trim().length ?? 0) <= 120, "Assessment title must be 120 characters or fewer."),
    repoUrl: optionalUrl("Enter a valid HTTP or HTTPS repository URL for assessments."),
  })
  .catchall(z.string().optional());

const referralEntrySchema = z
  .object({
    id: z.string(),
    employee: z
      .string()
      .optional()
      .refine((value) => Boolean(value?.trim()), "Enter a contact name for every referral."),
    profileUrl: optionalUrl("Enter a valid HTTP or HTTPS profile URL for referrals."),
  })
  .catchall(z.string().optional());

const interviewEntrySchema = z
  .object({
    id: z.string(),
    dateTime: z
      .string()
      .optional()
      .refine(
        (value) => Boolean(value?.trim() && !Number.isNaN(new Date(value.trim()).getTime())),
        "Select a valid date and time for every interview round.",
      ),
    meetingLink: optionalUrl("Enter a valid HTTP or HTTPS meeting URL for interview rounds."),
  })
  .catchall(z.string().optional());

const compensationSchema = z
  .record(z.string(), z.string())
  .superRefine((offer, ctx) => {
    const hasAnyValue = Boolean(
      offer.base?.trim() ||
        offer.bonus?.trim() ||
        offer.equity?.trim() ||
        offer.deadline?.trim() ||
        offer.notes?.trim(),
    );
    if ((hasAnyValue || offer.currency?.trim()) && !/^[A-Z]{3}$/i.test(offer.currency?.trim() ?? "")) {
      ctx.addIssue({
        code: "custom",
        path: ["currency"],
        message: "Enter a 3-letter ISO currency code (e.g. USD, INR, EUR).",
      });
    }
    for (const key of ["base", "bonus", "equity"] as const) {
      const raw = offer[key]?.trim();
      if (!raw) continue;
      const parsed = Number(raw);
      if (!Number.isFinite(parsed) || parsed < 0) {
        ctx.addIssue({
          code: "custom",
          path: [key],
          message: "Must be a non-negative number.",
        });
      }
    }
  });

const editorSchema = z.object({
  values: z
    .record(z.string(), z.string())
    .superRefine((values, ctx) => {
      if (!values.company?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["company"],
          message: "Enter a company name.",
        });
      } else if (values.company.trim().length > 120) {
        ctx.addIssue({
          code: "custom",
          path: ["company"],
          message: "Company name must be 120 characters or fewer.",
        });
      }
      if (!values.role?.trim()) {
        ctx.addIssue({
          code: "custom",
          path: ["role"],
          message: "Enter a job title.",
        });
      } else if (values.role.trim().length > 120) {
        ctx.addIssue({
          code: "custom",
          path: ["role"],
          message: "Job title must be 120 characters or fewer.",
        });
      }
      if (values.jobUrl?.trim() && !httpUrl.safeParse(values.jobUrl.trim()).success) {
        ctx.addIssue({
          code: "custom",
          path: ["jobUrl"],
          message: "Enter a valid HTTP or HTTPS job posting URL.",
        });
      }
      if ((values.seniority?.trim().length ?? 0) > 120) {
        ctx.addIssue({
          code: "custom",
          path: ["seniority"],
          message: "Seniority level must be 120 characters or fewer.",
        });
      }
    }),
  assessments: z.array(assessmentEntrySchema).max(50),
  referrals: z.array(referralEntrySchema).max(50),
  interviews: z.array(interviewEntrySchema).max(50),
  compensation: compensationSchema,
});

function extractRecordErrors(node: unknown): Record<string, string> {
  if (!node || typeof node !== "object") return {};
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
    if (
      value &&
      typeof value === "object" &&
      "message" in value &&
      typeof (value as { message?: unknown }).message === "string"
    ) {
      result[key] = (value as { message: string }).message;
    }
  }
  return result;
}

function extractArrayErrors(node: unknown): Array<Record<string, string>> {
  if (!Array.isArray(node)) return [];
  return node.map((item) => extractRecordErrors(item));
}

export type EditorFormValues = z.infer<typeof editorSchema>;
type EditorField = EditorFormValues[keyof EditorFormValues];

function updateField<T extends EditorField>(
  getValue: () => T,
  onChange: (next: T) => void,
) {
  return (next: SetStateAction<T>) =>
    onChange(typeof next === "function" ? next(getValue()) : next);
}

export function useEditorForm(job: Application | undefined, profile: Profile) {
  const [defaultValues] = useState<EditorFormValues>(() => ({
    values: {
      ...initialFields(job),
      ...(!job && {
        resumeText: profile.resumeText,
        resumeTextHtml: profile.resumeHtml ?? "",
      }),
    },
    assessments: toEntryList(job?.assessments),
    referrals: toEntryList(job?.referrals),
    interviews: toEntryList(job?.interviews).map((entry) => ({
      ...entry,
      dateTime: entry.dateTime ? localDateTime(entry.dateTime) : "",
    })),
    compensation: Object.fromEntries(
      Object.entries(job?.offer ?? {}).map(([key, value]) => [
        key,
        String(value),
      ]),
    ),
  }));
  const form = useForm<EditorFormValues>({
    resolver: zodResolver(editorSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues,
  });
  const { control } = form;
  const { field: values } = useController({ control, name: "values" });
  const { field: assessments } = useController({ control, name: "assessments" });
  const { field: referrals } = useController({ control, name: "referrals" });
  const { field: interviews } = useController({ control, name: "interviews" });
  const { field: compensation } = useController({ control, name: "compensation" });

  const { errors } = form.formState;

  return {
    handleSubmit: form.handleSubmit,
    values: values.value,
    setValues: updateField(() => form.getValues("values"), values.onChange),
    onBlurValues: values.onBlur,
    valueErrors: extractRecordErrors(errors.values),
    assessments: assessments.value,
    setAssessments: updateField(
      () => form.getValues("assessments"),
      assessments.onChange,
    ),
    onBlurAssessments: assessments.onBlur,
    assessmentErrors: extractArrayErrors(errors.assessments),
    referrals: referrals.value,
    setReferrals: updateField(
      () => form.getValues("referrals"),
      referrals.onChange,
    ),
    onBlurReferrals: referrals.onBlur,
    referralErrors: extractArrayErrors(errors.referrals),
    interviews: interviews.value,
    setInterviews: updateField(
      () => form.getValues("interviews"),
      interviews.onChange,
    ),
    onBlurInterviews: interviews.onBlur,
    interviewErrors: extractArrayErrors(errors.interviews),
    compensation: compensation.value,
    setCompensation: updateField(
      () => form.getValues("compensation"),
      compensation.onChange,
    ),
    onBlurCompensation: compensation.onBlur,
    compensationErrors: extractRecordErrors(errors.compensation),
  };
}
