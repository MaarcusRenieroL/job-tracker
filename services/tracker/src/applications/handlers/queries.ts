import type { Context } from "hono";
import type { Collection, Filter, WithId } from "mongodb";
import type { TrackerEnv } from "../../auth/require-auth.js";
import { applicationAgenda } from "../agenda.js";
import { exactTagFilter } from "../procedures.js";
import { resumeMatch } from "../resume-match.js";
import { agendaQuery, applicationListQuery, type Application } from "../schema.js";

export async function handleList(
  c: Context<TrackerEnv>,
  applications: Collection<Application>,
) {
  const parsed = applicationListQuery.safeParse(c.req.query());
  if (!parsed.success)
    return c.json(
      { error: "Invalid application filters", issues: parsed.error.issues },
      400,
    );
  const { stage, priority, tag } = parsed.data;
  const filter: Filter<Application> = { ownerId: c.get("ownerId") };
  if (stage) filter.stage = stage;
  if (priority) filter.priority = priority;
  if (tag) {
    filter.tags = exactTagFilter(tag);
  }
  const rows = await applications
    .find(filter)
    .sort({ updatedAt: -1 })
    .toArray();
  return c.json({ applications: rows });
}

export async function handleAgenda(
  c: Context<TrackerEnv>,
  applications: Collection<Application>,
) {
  const parsed = agendaQuery.safeParse(c.req.query());
  if (!parsed.success)
    return c.json(
      { error: "Invalid agenda date range", issues: parsed.error.issues },
      400,
    );

  const { from = new Date().toISOString().slice(0, 10), to } = parsed.data;
  if (to && from > to)
    return c.json({ error: "from must be on or before to" }, 400);
  const rows = await applications
    .find({ ownerId: c.get("ownerId") })
    .project<Parameters<typeof applicationAgenda>[0]>({
      company: 1,
      role: 1,
      stage: 1,
      deadline: 1,
      followUp: 1,
      interviews: 1,
      assessments: 1,
      referrals: 1,
      offer: 1,
    })
    .toArray();
  const events = rows
    .flatMap((row) => applicationAgenda(row, from, to))
    .sort(
      (a, b) =>
        (a.dateTime ?? a.date).localeCompare(b.dateTime ?? b.date) ||
        a.id.localeCompare(b.id),
    );
  return c.json({ events });
}

export async function handleOffers(
  c: Context<TrackerEnv>,
  applications: Collection<Application>,
) {
  const offers = await applications
    .find({ ownerId: c.get("ownerId"), offer: { $exists: true } })
    .project<
      Pick<
        WithId<Application>,
        "_id" | "company" | "role" | "stage" | "offer"
      >
    >({
      company: 1,
      role: 1,
      stage: 1,
      offer: 1,
    })
    .sort({ updatedAt: -1 })
    .toArray();
  return c.json({ offers });
}

export async function handleMissingSkills(
  c: Context<TrackerEnv>,
  applications: Collection<Application>,
) {
  const rows = applications
    .find({ ownerId: c.get("ownerId"), resumeText: { $exists: true } })
    .project<Pick<Application, "skills" | "resumeText">>({
      skills: 1,
      resumeText: 1,
    });
  const counts = new Map<string, { skill: string; count: number }>();
  for await (const { skills, resumeText } of rows) {
    if (!skills?.length || !resumeText) continue;
    for (const match of resumeMatch(skills, resumeText).matches) {
      if (match.level !== "missing") continue;
      const key = match.skill.toLowerCase();
      const entry = counts.get(key) ?? { skill: match.skill, count: 0 };
      entry.count++;
      counts.set(key, entry);
    }
  }
  return c.json({
    skills: [...counts.values()]
      .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill))
      .slice(0, 10),
  });
}
