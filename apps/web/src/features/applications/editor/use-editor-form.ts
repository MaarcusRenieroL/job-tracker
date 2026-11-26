import { zodResolver } from "@hookform/resolvers/zod";
import { useState, type SetStateAction } from "react";
import { useController, useForm } from "react-hook-form";
import { z } from "zod";
import type { Application } from "@/types/application";
import type { Profile } from "@/features/profile/profile";
import { initialFields, localDateTime } from "./editor-form";

const jobUrl = z.url({ protocol: /^https?$/ });
const entries = z.array(
  z.object({ id: z.string() }).catchall(z.string().optional()),
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
        !value?.trim() || jobUrl.safeParse(value.trim()).success,
      "Enter a valid HTTP or HTTPS job posting URL.",
    ),
  assessments: entries,
  referrals: entries,
  interviews: entries,
  compensation: z.record(z.string(), z.string()),
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
    assessments: job?.assessments ?? [],
    referrals: job?.referrals ?? [],
    interviews: (job?.interviews ?? []).map((entry) => ({
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
