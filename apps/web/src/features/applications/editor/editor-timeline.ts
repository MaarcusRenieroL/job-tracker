import type { Application } from "../../../types/application";

export type TimelineEvent = {
  id: string;
  at: string;
  title: string;
  detail?: string;
  kind: string;
};

export function buildTimeline(job: Application): TimelineEvent[] {
  const events: TimelineEvent[] = [];

  if (job.createdAt) {
    events.push({
      id: "created",
      at: job.createdAt,
      title: "Application created",
      kind: "system",
    });
  }

  if (job.appliedAt) {
    events.push({
      id: "applied",
      at: job.appliedAt,
      title: "Marked as applied",
      kind: "stage",
    });
  }

  for (const [index, transition] of (job.history ?? []).entries()) {
    events.push({
      id: `stage-${index}-${transition.at}`,
      at: transition.at,
      title: transition.from
        ? `Stage: ${transition.from} → ${transition.to}`
        : `Stage: ${transition.to}`,
      kind: "stage",
    });
  }

  for (const interview of job.interviews ?? []) {
    events.push({
      id: `interview-${interview.id}`,
      at: interview.dateTime ?? job.updatedAt ?? job.createdAt ?? new Date().toISOString(),
      title: `${interview.type} interview`,
      detail: `${new Date(interview.dateTime).toLocaleString()} · ${interview.interviewer ?? "no interviewer"} · ${interview.result ?? "Scheduled"}`,
      kind: "interview",
    });
  }

  for (const assessment of job.assessments ?? []) {
    events.push({
      id: `assessment-${assessment.id}`,
      at: assessment.submittedAt ?? assessment.deadline ?? job.updatedAt ?? job.createdAt ?? new Date().toISOString(),
      title: `Assessment: ${assessment.title}`,
      detail: `${assessment.type} · ${assessment.status}${assessment.deadline ? ` · due ${assessment.deadline}` : ""}`,
      kind: "assessment",
    });
  }

  for (const referral of job.referrals ?? []) {
    events.push({
      id: `referral-${referral.id}`,
      at: referral.followUp ?? job.updatedAt ?? job.createdAt ?? new Date().toISOString(),
      title: `Referral: ${referral.employee}`,
      detail: `${referral.status}${referral.followUp ? ` · follow-up ${referral.followUp}` : ""}${referral.outcome ? ` · ${referral.outcome}` : ""}`,
      kind: "referral",
    });
  }

  if (job.offer) {
    events.push({
      id: "offer",
      at: job.updatedAt ?? job.createdAt ?? new Date().toISOString(),
      title: "Offer recorded",
      detail: `${job.offer.currency} ${job.offer.base ?? "—"}${job.offer.deadline ? ` · decision by ${job.offer.deadline}` : ""}`,
      kind: "offer",
    });
  }

  if (job.followUp) {
    events.push({
      id: "follow-up",
      at: job.followUp,
      title: "Follow-up scheduled",
      kind: "follow-up",
    });
  }

  if (job.updatedAt && job.updatedAt !== job.createdAt) {
    events.push({
      id: "updated",
      at: job.updatedAt,
      title: "Last updated",
      kind: "system",
    });
  }

  return events
    .filter((event) => !Number.isNaN(new Date(event.at).getTime()))
    .sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
}
