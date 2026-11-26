import type { Application, Priority } from "@/types/application";

export function filterApplications(
  jobs: Application[],
  { query, stage, priorityFilter, tagFilter }: {
    query: string;
    stage: string;
    priorityFilter: Priority | "";
    tagFilter: string[];
  },
) {
  const allTags = Array.from(
    new Map(
      jobs
        .flatMap((job) => job.tags ?? [])
        .map((t) => [t.toLowerCase(), t] as const),
    ).values(),
  ).sort((a, b) => a.localeCompare(b));

  const search = query.trim().toLowerCase();
  const selectedTags = new Set(tagFilter.map((tag) => tag.toLowerCase()));
  const visible = jobs.filter(
    (job) =>
      (!stage || stage === job.stage) &&
      (!priorityFilter || job.priority === priorityFilter) &&
      (!selectedTags.size ||
        job.tags?.some((tag) => selectedTags.has(tag.toLowerCase()))) &&
      [
        job.company,
        job.role,
        job.location,
        job.source,
        job.priority,
        ...(job.skills ?? []),
        ...(job.tags ?? []),
      ]
        .join(" ")
        .toLowerCase()
        .includes(search),
  );

  return { allTags, visible };
}

export function summarizeApplications(
  jobs: Application[],
  offerCount: number,
  now: number,
) {
  const activeCount = jobs.filter(
    (job) =>
      ![
        "Discovered",
        "Saved",
        "Rejected",
        "Withdrawn",
        "Ghosted",
        "Offer",
      ].includes(job.stage),
  ).length;
  const upcomingInterviews = jobs
    .flatMap((job) => job.interviews ?? [])
    .filter(
      (round) =>
        round.result === "Scheduled" && Date.parse(round.dateTime ?? "") >= now,
    ).length;
  const activeAssessments = jobs
    .flatMap((job) => job.assessments ?? [])
    .filter(
      (item) => item.status === "Not started" || item.status === "In progress",
    ).length;
  const offersCount = Math.max(
    jobs.filter((job) => job.stage === "Offer" || Boolean(job.offer)).length,
    offerCount,
  );
  const highPriorityCount = jobs.filter(
    (job) => job.priority === "High",
  ).length;

  return {
    activeCount,
    upcomingInterviews,
    activeAssessments,
    offersCount,
    highPriorityCount,
  };
}
