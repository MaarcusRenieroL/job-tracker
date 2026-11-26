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
  .refine(
    (offer) => {
      const hasAnyValue = Boolean(
        offer.base?.trim() ||
          offer.bonus?.trim() ||
          offer.equity?.trim() ||
          offer.deadline?.trim() ||
          offer.notes?.trim(),
      );
      if (!hasAnyValue && !offer.currency?.trim()) return true;
      return /^[A-Z]{3}$/i.test(offer.currency?.trim() ?? "");
    },
    "Enter a 3-letter ISO currency code (e.g. USD, INR, EUR) when recording an offer.",
  )
  .refine(
    (offer) =>
      ["base", "bonus", "equity"].every((key) => {
        const raw = offer[key]?.trim();
        if (!raw) return true;
        const parsed = Number(raw);
        return Number.isFinite(parsed) && parsed >= 0;
      }),
    "Offer base, bonus, and equity must be non-negative numbers.",
  );

const editorSchema = z.object({
  values: z
    .record(z.string(), z.string())
    .refine(
      ({ company, role }) => Boolean(company?.trim() && role?.trim()),
      "Enter a company and job title.",
    )
    .refine(
      ({ company, role }) =>
        [company, role].every((value) => (value?.trim().length ?? 0) <= 120),
      "Company and job title must be 120 characters or fewer.",
    )
    .refine(
      ({ jobUrl: value }) =>
        !value?.trim() || httpUrl.safeParse(value.trim()).success,
      "Enter a valid HTTP or HTTPS job posting URL.",
    )
    .refine(
      ({ seniority }) => (seniority?.trim().length ?? 0) <= 120,
      "Seniority level must be 120 characters or fewer.",
    ),
  assessments: z.array(assessmentEntrySchema).max(50),
  referrals: z.array(referralEntrySchema).max(50),
  interviews: z.array(interviewEntrySchema).max(50),
  compensation: compensationSchema,
});

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
    defaultValues,
  });
  const { control } = form;
  const { field: values } = useController({ control, name: "values" });
  const { field: assessments } = useController({ control, name: "assessments" });
  const { field: referrals } = useController({ control, name: "referrals" });
  const { field: interviews } = useController({ control, name: "interviews" });
  const { field: compensation } = useController({ control, name: "compensation" });

  return {
    handleSubmit: form.handleSubmit,
    values: values.value,
    setValues: updateField(() => form.getValues("values"), values.onChange),
    assessments: assessments.value,
    setAssessments: updateField(
      () => form.getValues("assessments"),
      assessments.onChange,
    ),
    referrals: referrals.value,
    setReferrals: updateField(
      () => form.getValues("referrals"),
      referrals.onChange,
    ),
    interviews: interviews.value,
    setInterviews: updateField(
      () => form.getValues("interviews"),
      interviews.onChange,
    ),
    compensation: compensation.value,
    setCompensation: updateField(
      () => form.getValues("compensation"),
      compensation.onChange,
    ),
  };
}
