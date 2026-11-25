import { stages, type Application, type Stage } from "../../types/application";

const interviewStages = ["Screening", "Technical Interview", "Final Interview"];
const pct = (part: number, whole: number) =>
  whole ? `${Math.round((part / whole) * 100)}%` : "—";

export function calculateAnalytics(jobs: Application[]) {
  const applied = jobs.filter((job) => job.appliedAt);
  const reached = (job: Application, targetStages: string[]) =>
    (job.history ?? []).some((event) => targetStages.includes(event.to));
  const interviewed = applied.filter(
    (job) => reached(job, interviewStages) || job.interviews?.length,
  );
  const offered = applied.filter(
    (job) => reached(job, ["Offer"]) || job.stage === "Offer",
  );
  const rejected = applied.filter(
    (job) => reached(job, ["Rejected"]) || job.stage === "Rejected",
  );
  const responded = applied.filter(
    (job) =>
      reached(job, [
        "Recruiter Contacted",
        ...interviewStages,
        "Offer",
        "Rejected",
      ]) || job.interviews?.length,
  );
  const allReferrals = jobs.flatMap((job) => job.referrals ?? []);
  const contacted = allReferrals.filter(
    (referral) => referral.status !== "Identified",
  );
  const answered = contacted.filter(
    (referral) =>
      ["Responded", "Referred", "Declined"].includes(referral.status ?? "") ||
      referral.response,
  );

  const sources = new Map<string, { total: number; interviews: number }>();
  const days = new Map<string, number>();
  const weeks = new Map<string, number>();
  const timing = new Map<string, { sum: number; count: number }>();

  for (const job of applied) {
    const source = job.source || "Unspecified";
    const count = sources.get(source) ?? { total: 0, interviews: 0 };
    count.total += 1;
    count.interviews += Number(interviewed.includes(job));
    sources.set(source, count);
    const day = job.appliedAt!;
    days.set(day, (days.get(day) ?? 0) + 1);
    const monday = new Date(day + "T00:00:00Z");
    monday.setUTCDate(monday.getUTCDate() - ((monday.getUTCDay() + 6) % 7));
    const week = monday.toISOString().slice(0, 10);
    weeks.set(week, (weeks.get(week) ?? 0) + 1);
  }

  for (const job of jobs) {
    const history = job.history ?? [];
    history.slice(1).forEach((event, index) => {
      const key = `${event.from} → ${event.to}`;
      const duration =
        (Date.parse(event.at) - Date.parse(history[index].at)) / 86_400_000;
      const record = timing.get(key) ?? { sum: 0, count: 0 };
      timing.set(key, { sum: record.sum + duration, count: record.count + 1 });
    });
  }

  const stageCounts = stages
    .map(
      (stage) =>
        [stage, jobs.filter((job) => job.stage === stage).length] as [
          Stage,
          number,
        ],
    )
    .filter(([, count]) => count > 0);

  const kpis = [
    {
      label: "Submitted",
      value: String(applied.length),
      sub: `${jobs.length} total tracked`,
    },
    {
      label: "Response rate",
      value: pct(responded.length, applied.length),
      sub: `${responded.length} employer replies`,
    },
    {
      label: "Interview conversion",
      value: pct(interviewed.length, applied.length),
      sub: `${interviewed.length} reached rounds`,
    },
    {
      label: "Offer conversion",
      value: pct(offered.length, applied.length),
      sub: `${offered.length} offers landed`,
    },
    {
      label: "Rejection rate",
      value: pct(rejected.length, applied.length),
      sub: `${rejected.length} closed roles`,
    },
    {
      label: "Referral replies",
      value: pct(answered.length, contacted.length),
      sub: `${contacted.length} contacted of ${allReferrals.length}`,
    },
  ];

  const sourceRows = [...sources].sort(
    (a, b) => b[1].interviews / b[1].total - a[1].interviews / a[1].total,
  );

  return { applied, stageCounts, kpis, sourceRows, days, weeks, timing };
}
