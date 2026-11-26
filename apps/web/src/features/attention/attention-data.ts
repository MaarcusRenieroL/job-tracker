import type { Application } from "../../types/application";

export type AttentionSeverity = "high" | "medium" | "low";

export type AttentionItem = {
  id: string;
  applicationId: string;
  company: string;
  role: string;
  category: string;
  label: string;
  detail: string;
  severity: AttentionSeverity;
  due?: string;
};

const CLOSED = new Set(["Rejected", "Withdrawn", "Ghosted", "Offer"]);

function daysBetween(a: string, b: Date) {
  const parts = a.slice(0, 10).split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return 0;
  const target = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  const now = Date.UTC(b.getFullYear(), b.getMonth(), b.getDate());
  return Math.round((target - now) / 86_400_000);
}

export function buildAttentionItems(
  jobs: Application[],
  now: Date = new Date(),
): AttentionItem[] {
  const items: AttentionItem[] = [];
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  for (const job of jobs) {
    const closed = CLOSED.has(job.stage);
    const updated = job.updatedAt ? new Date(job.updatedAt) : null;
    const applied = job.appliedAt ? new Date(job.appliedAt) : null;

    if (!closed && job.followUp) {
      const diff = daysBetween(job.followUp, today);
      if (diff < 0) {
        items.push({
          id: `${job._id}-followup`,
          applicationId: job._id,
          company: job.company,
          role: job.role,
          category: "Follow-up",
          label: "Follow-up overdue",
          detail: `Follow-up was due ${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"} ago.`,
          severity: "high",
          due: job.followUp,
        });
      } else if (diff <= 2 && diff >= 0) {
        items.push({
          id: `${job._id}-followup-soon`,
          applicationId: job._id,
          company: job.company,
          role: job.role,
          category: "Follow-up",
          label: "Follow-up due soon",
          detail: diff === 0 ? "Follow-up is due today." : `Follow-up in ${diff} day${diff === 1 ? "" : "s"}.`,
          severity: "medium",
          due: job.followUp,
        });
      }
    }

    if (!closed && job.deadline) {
      const diff = daysBetween(job.deadline, today);
      if (diff >= 0 && diff <= 7) {
        items.push({
          id: `${job._id}-deadline`,
          applicationId: job._id,
          company: job.company,
          role: job.role,
          category: "Deadline",
          label: diff === 0 ? "Application deadline today" : "Application deadline soon",
          detail: diff === 0 ? "Deadline is today." : `Deadline in ${diff} day${diff === 1 ? "" : "s"}.`,
          severity: diff <= 2 ? "high" : "medium",
          due: job.deadline,
        });
      }
    }

    if (!closed && job.offer?.deadline) {
      const diff = daysBetween(job.offer.deadline, today);
      if (diff >= 0 && diff <= 7) {
        items.push({
          id: `${job._id}-offer-deadline`,
          applicationId: job._id,
          company: job.company,
          role: job.role,
          category: "Offer",
          label: "Offer decision window closing",
          detail: `Decision by ${job.offer.deadline} (${diff === 0 ? "today" : `${diff} day${diff === 1 ? "" : "s"}`}).`,
          severity: diff <= 2 ? "high" : "medium",
          due: job.offer.deadline,
        });
      }
    }

    for (const assessment of job.assessments ?? []) {
      if (!assessment.deadline) continue;
      if (assessment.status === "Completed" || assessment.status === "Cancelled") continue;
      const diff = daysBetween(assessment.deadline, today);
      if (diff >= 0 && diff <= 7) {
        items.push({
          id: `${job._id}-assessment-${assessment.id}`,
          applicationId: job._id,
          company: job.company,
          role: job.role,
          category: "Assessment",
          label: `${assessment.title} due`,
          detail: `${assessment.type} · ${assessment.status} · due ${assessment.deadline}.`,
          severity: diff <= 2 ? "high" : "medium",
          due: assessment.deadline,
        });
      }
    }

    for (const interview of job.interviews ?? []) {
      if (!interview.dateTime) continue;
      if (!["Scheduled", "Pending"].includes(interview.result)) continue;
      const interviewDate = new Date(interview.dateTime);
      const diff = Math.round((interviewDate.getTime() - now.getTime()) / 86_400_000);
      if (diff >= 0 && diff <= 3) {
        items.push({
          id: `${job._id}-interview-${interview.id}`,
          applicationId: job._id,
          company: job.company,
          role: job.role,
          category: "Interview",
          label: diff === 0 ? "Interview today" : "Interview upcoming",
          detail: `${interview.type} · ${interviewDate.toLocaleString()}${interview.interviewer ? ` · ${interview.interviewer}` : ""}`,
          severity: diff === 0 ? "high" : "medium",
          due: interview.dateTime.slice(0, 10),
        });
      }
    }

    for (const referral of job.referrals ?? []) {
      if (!referral.followUp) continue;
      if (!["Identified", "Contacted", "Responded", "Referred"].includes(referral.status)) continue;
      const diff = daysBetween(referral.followUp, today);
      if (diff < 0) {
        items.push({
          id: `${job._id}-referral-${referral.id}`,
          applicationId: job._id,
          company: job.company,
          role: job.role,
          category: "Referral",
          label: "Referral follow-up overdue",
          detail: `${referral.employee} · ${referral.status} · follow-up ${Math.abs(diff)} day${Math.abs(diff) === 1 ? "" : "s"} overdue.`,
          severity: "medium",
          due: referral.followUp,
        });
      }
    }

    if (!closed && updated) {
      const staleDays = Math.floor((today.getTime() - updated.getTime()) / 86_400_000);
      if (staleDays >= 14) {
        items.push({
          id: `${job._id}-stale`,
          applicationId: job._id,
          company: job.company,
          role: job.role,
          category: "Stale",
          label: "No recent activity",
          detail: `Last updated ${staleDays} days ago while still in ${job.stage}.`,
          severity: staleDays >= 30 ? "high" : "low",
        });
      }
    }

    if (
      !closed &&
      applied &&
      ["Applied", "Recruiter Contacted", "Screening"].includes(job.stage)
    ) {
      const age = Math.floor((today.getTime() - applied.getTime()) / 86_400_000);
      if (age >= 21 && !(job.interviews?.length)) {
        items.push({
          id: `${job._id}-ghosted`,
          applicationId: job._id,
          company: job.company,
          role: job.role,
          category: "Ghosted",
          label: "Possible ghosting",
          detail: `Applied ${age} days ago with no interview rounds recorded.`,
          severity: "low",
        });
      }
    }
  }

  const order = { high: 0, medium: 1, low: 2 };
  return items.sort(
    (a, b) =>
      order[a.severity] - order[b.severity] ||
      (a.due ?? "9999").localeCompare(b.due ?? "9999"),
  );
}
