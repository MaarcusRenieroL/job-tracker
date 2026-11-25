import type { WithId } from "mongodb";
import type { Application } from "./schema.js";

type AgendaApplication = Pick<
  WithId<Application>,
  | "_id"
  | "company"
  | "role"
  | "stage"
  | "deadline"
  | "followUp"
  | "interviews"
  | "assessments"
  | "referrals"
  | "offer"
>;

type AgendaEvent = {
  id: string;
  kind:
    | "application-deadline"
    | "follow-up"
    | "interview"
    | "assessment"
    | "referral-follow-up"
    | "offer-deadline";
  title: string;
  date: string;
  dateTime?: string;
};

const closed = new Set(["Rejected", "Withdrawn"]);

export function applicationAgenda(
  application: AgendaApplication,
  from: string,
  to?: string,
) {
  const applicationId = application._id.toHexString();
  const events: AgendaEvent[] = [];
  const include = (
    id: string,
    kind: AgendaEvent["kind"],
    title: string,
    date?: string,
    dateTime?: string,
  ) => {
    if (date && date >= from && (!to || date <= to)) {
      events.push({
        id: `${applicationId}:${id}`,
        kind,
        title,
        date,
        ...(dateTime ? { dateTime } : {}),
      });
    }
  };

  if (!closed.has(application.stage)) {
    if (application.stage === "Discovered" || application.stage === "Saved") {
      include(
        "deadline",
        "application-deadline",
        "Application deadline",
        application.deadline,
      );
    }
    include(
      "follow-up",
      "follow-up",
      "Application follow-up",
      application.followUp,
    );
    for (const round of application.interviews ?? []) {
      if (round.result !== "Scheduled") continue;
      const dateTime = new Date(round.dateTime).toISOString();
      include(
        `interview:${round.id}`,
        "interview",
        round.type,
        dateTime.slice(0, 10),
        dateTime,
      );
    }
    for (const assessment of application.assessments ?? []) {
      if (
        assessment.status === "Not started" ||
        assessment.status === "In progress"
      ) {
        include(
          `assessment:${assessment.id}`,
          "assessment",
          assessment.title,
          assessment.deadline,
        );
      }
    }
    for (const referral of application.referrals ?? []) {
      if (referral.status !== "Referred" && referral.status !== "Declined") {
        include(
          `referral:${referral.id}`,
          "referral-follow-up",
          `Follow up with ${referral.employee}`,
          referral.followUp,
        );
      }
    }
    include(
      "offer",
      "offer-deadline",
      "Offer deadline",
      application.offer?.deadline,
    );
  }

  return events.map((event) => ({
    ...event,
    applicationId,
    company: application.company,
    role: application.role,
  }));
}
