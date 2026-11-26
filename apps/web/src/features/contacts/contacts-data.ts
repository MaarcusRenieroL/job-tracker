import type { Application } from "../../types/application";

export type ContactEntry = {
  key: string;
  name: string;
  company: string;
  role: string;
  profileUrl?: string;
  status: string;
  applications: { id: string; company: string; role: string; stage: string }[];
  lastFollowUp?: string;
  outcomes: string[];
  messageCount: number;
};

export function buildContacts(jobs: Application[]): ContactEntry[] {
  const map = new Map<string, ContactEntry>();
  for (const job of jobs) {
    for (const referral of job.referrals ?? []) {
      const name = referral.employee?.trim() || "Unknown contact";
      const company = referral.company?.trim() || job.company;
      const role = referral.role?.trim() || job.role;
      const key = `${name.toLowerCase()}::${company.toLowerCase()}::${referral.profileUrl ?? ""}`;
      const existing = map.get(key);
      const application = {
        id: job._id,
        company: job.company,
        role: job.role,
        stage: job.stage,
      };
      if (existing) {
        existing.applications.push(application);
        if (!existing.outcomes.includes(referral.outcome ?? "") && referral.outcome) {
          existing.outcomes.push(referral.outcome);
        }
        existing.messageCount += referral.message ? 1 : 0;
        if (referral.followUp && (!existing.lastFollowUp || referral.followUp > existing.lastFollowUp)) {
          existing.lastFollowUp = referral.followUp;
        }
        // Keep the most "advanced" status.
        const rank: Record<string, number> = {
          Identified: 0,
          Contacted: 1,
          Responded: 2,
          Referred: 3,
          Declined: 4,
        };
        if ((rank[referral.status] ?? 0) > (rank[existing.status] ?? 0)) {
          existing.status = referral.status;
        }
        if (referral.profileUrl && !existing.profileUrl) {
          existing.profileUrl = referral.profileUrl;
        }
      } else {
        map.set(key, {
          key,
          name,
          company,
          role,
          profileUrl: referral.profileUrl,
          status: referral.status,
          applications: [application],
          lastFollowUp: referral.followUp,
          outcomes: referral.outcome ? [referral.outcome] : [],
          messageCount: referral.message ? 1 : 0,
        });
      }
    }
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}
