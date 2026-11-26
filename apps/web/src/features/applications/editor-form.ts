import type { Application, Entry } from "../../types/application";
import { applicationFields, postingFields } from "./editor-fields";

const clearableKeys = [
  "jobUrl",
  "location",
  "workModel",
  "salaryRange",
  "description",
  "source",
  "deadline",
  "priority",
  "notes",
  "appliedAt",
  "resumeVersion",
  "resumeText",
  "coverLetter",
  "followUp",
  "rejectionReason",
] as const;

export function initialFields(job?: Application) {
  const values: Record<string, string> = { stage: job?.stage ?? "Saved" };
  for (const field of [...postingFields, ...applicationFields]) {
    if (
      field.name === "skills" ||
      field.name === "tags" ||
      field.name === "stage"
    )
      continue;
    const value = job?.[field.name as keyof Application];
    values[field.name] = typeof value === "string" ? value : "";
  }
  values.skills = job?.skills?.join(", ") ?? "";
  values.tags = job?.tags?.join(", ") ?? "";
  return values;
}

export function localDateTime(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}

function clean(values: Record<string, string | undefined>) {
  return Object.fromEntries(
    Object.entries(values).filter(([, value]) => value?.trim()),
  );
}


export function applicationPayload({ job, values, assessments, referrals, interviews, compensation }: { job?: Application; values: Record<string, string>; assessments: Entry[]; referrals: Entry[]; interviews: Entry[]; compensation: Record<string, string> }) {
      const { skills, tags, ...fields } = values;
      const parsedTags = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const parsedSkills = skills
        .split(",")
        .map((skill) => skill.trim())
        .filter(Boolean);

      const serializedInterviews = interviews.map((entry, idx) => {
        const rawDate = entry.dateTime?.trim();
        if (!rawDate) {
          throw new Error(
            `Please select a date and time for interview round ${idx + 1}.`,
          );
        }
        const parsedDate = new Date(rawDate);
        if (Number.isNaN(parsedDate.getTime())) {
          throw new Error(
            `Invalid date and time for interview round ${idx + 1}.`,
          );
        }
        return {
          ...clean(entry),
          dateTime: parsedDate.toISOString(),
        };
      });

      return {
        ...clean(fields),
        ...(job
          ? {
              version: job.version,
              clear: clearableKeys.filter((key) => !fields[key]?.trim()),
            }
          : {}),
        skills: parsedSkills,
        tags: parsedTags,
        assessments: assessments.map(clean),
        referrals: referrals.map(clean),
        interviews: serializedInterviews,
        ...(compensation.currency?.trim()
          ? {
              offer: {
                currency: compensation.currency.trim().toUpperCase(),
                ...Object.fromEntries(
                  ["base", "bonus", "equity"]
                    .filter((key) => compensation[key])
                    .map((key) => [key, Number(compensation[key])]),
                ),
                deadline: compensation.deadline?.trim() || undefined,
                notes: compensation.notes?.trim() || undefined,
              },
            }
          : job?.offer
            ? { clearOffer: true }
            : {}),
      };
}
