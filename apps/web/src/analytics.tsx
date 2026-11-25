import { useEffect, useState } from "react";
import { api } from "./api";
import type { Application } from "./types";

const interviewStages = ["Screening", "Technical Interview", "Final Interview"];
const pct = (part: number, whole: number) =>
  whole ? `${Math.round((part / whole) * 100)}%` : "—";

export function Analytics({
  jobs,
  token,
}: {
  jobs: Application[];
  token: string;
}) {
  const [missing, setMissing] = useState<{ skill: string; count: number }[]>();
  const [missingError, setMissingError] = useState(false);
  useEffect(() => {
    let active = true;
    api<{ skills: { skill: string; count: number }[] }>(
      "/applications/missing-skills",
      token,
    )
      .then(({ skills }) => {
        if (active) setMissing(skills);
      })
      .catch(() => {
        if (active) setMissingError(true);
      });
    return () => {
      active = false;
    };
  }, [token]);
  const applied = jobs.filter((job) => job.appliedAt);
  const reached = (job: Application, stages: string[]) =>
    (job.history ?? []).some((event) => stages.includes(event.to));
  const interviewed = applied.filter(
    (job) => reached(job, interviewStages) || job.interviews?.length,
  );
  const offered = applied.filter((job) => reached(job, ["Offer"]));
  const rejected = applied.filter((job) => reached(job, ["Rejected"]));
  const responded = applied.filter(
    (job) =>
      reached(job, [
        "Recruiter Contacted",
        ...interviewStages,
        "Offer",
        "Rejected",
      ]) || job.interviews?.length,
  );
  const contacted = jobs
    .flatMap((job) => job.referrals ?? [])
    .filter((referral) => referral.status !== "Identified");
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

  const metrics = [
    ["Applications", applied.length],
    ["Response rate", pct(responded.length, applied.length)],
    ["Interview conversion", pct(interviewed.length, applied.length)],
    ["Offer rate", pct(offered.length, applied.length)],
    ["Rejection rate", pct(rejected.length, applied.length)],
    ["Referral response", pct(answered.length, contacted.length)],
  ];

  return (
    <div className="analytics">
      <dl className="metrics">
        {metrics.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <div className="analytics-grid">
        <Report
          title="Applications by day"
          rows={[...days]
            .sort()
            .reverse()
            .map(([key, value]) => [key, String(value)])}
        />
        <Report
          title="Applications by week"
          rows={[...weeks]
            .sort()
            .reverse()
            .map(([key, value]) => [key, String(value)])}
        />
        <Report
          title="Sources by interview conversion"
          rows={[...sources]
            .sort(
              (a, b) =>
                b[1].interviews / b[1].total - a[1].interviews / a[1].total,
            )
            .map(([key, value]) => [
              key,
              `${pct(value.interviews, value.total)} · ${value.total} applied`,
            ])}
        />
        <Report
          title="Most common missing skills"
          empty={
            missingError
              ? "Could not load skill gaps."
              : missing
                ? "No skill gaps recorded."
                : "Checking saved resumes…"
          }
          rows={(missing ?? []).map(({ skill, count }) => [
            skill,
            String(count),
          ])}
        />
        <Report
          title="Average time between stages"
          rows={[...timing].map(([key, value]) => [
            key,
            `${(value.sum / value.count).toFixed(1)} days`,
          ])}
        />
      </div>
    </div>
  );
}

function Report({
  title,
  rows,
  empty = "No activity yet.",
}: {
  title: string;
  rows: [string, string][];
  empty?: string;
}) {
  return (
    <section className="report">
      <h2>{title}</h2>
      {rows.length ? (
        <dl>
          {rows.map(([key, value]) => (
            <div key={key}>
              <dt>{key}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      ) : (
        <p>{empty}</p>
      )}
    </section>
  );
}
