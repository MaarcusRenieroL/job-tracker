import { ObjectId, type Collection } from "mongodb";
import type { Application, ApplicationInput } from "./schema.js";

export function exactTagFilter(tag: string) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}$`, "i");
}

export function ownerFilter(ownerId: string, id: string) {
  return { ownerId, _id: new ObjectId(id) };
}

export async function createApplication(
  applications: Collection<Application>,
  ownerId: string,
  input: ApplicationInput,
) {
  const now = new Date();
  const stage = input.stage ?? "Saved";
  const document: Application = {
    ...input,
    ownerId,
    stage,
    version: 1,
    createdAt: now,
    updatedAt: now,
    history: [{ to: stage, at: now }],
  };

  if (stage === "Applied")
    document.appliedAt ??= now.toISOString().slice(0, 10);
  const { insertedId } = await applications.insertOne(document);
  return { ...document, _id: insertedId };
}

export function resumeMatch(
  required: string[],
  resume: string,
  context: Pick<Application, "role" | "location" | "workModel"> = { role: "" },
) {
  const normalize = (value: string) =>
    value
      .toLowerCase()
      .replace(/[^\p{L}\p{N}+#.]+/gu, " ")
      .trim();
  const words = new Set(normalize(resume).split(/\s+/));
  const lines = resume
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const matches = [
    ...new Map(required.map((skill) => [normalize(skill), skill])).values(),
  ].map((skill) => {
    const term = normalize(skill);
    const evidence =
      term &&
      lines.find((line) => ` ${normalize(line)} `.includes(` ${term} `));
    const partial = term && term.split(" ").some((word) => words.has(word));
    return {
      skill,
      level: evidence ? "strong" : partial ? "partial" : "missing",
      evidence: evidence ? evidence.slice(0, 300) : null,
    };
  });
  const score = matches.length
    ? Math.round(
        (matches.reduce(
          (sum, match) =>
            sum +
            (match.level === "strong"
              ? 1
              : match.level === "partial"
                ? 0.5
                : 0),
          0,
        ) /
          matches.length) *
          100,
      )
    : null;
  const location = context.location?.trim();
  const locationEvidence =
    location &&
    lines.find((line) =>
      ` ${normalize(line)} `.includes(` ${normalize(location)} `),
    );
  const seniority = context.role.match(
    /\b(intern|junior|mid-level|senior|staff|principal|lead)\b/i,
  )?.[0];
  const seniorityEvidence =
    seniority &&
    lines.find((line) =>
      ` ${normalize(line)} `.includes(` ${normalize(seniority)} `),
    );
  return {
    score,
    keywords: matches.map((match) => match.skill),
    location: location
      ? { target: location, evidence: locationEvidence?.slice(0, 300) || null }
      : null,
    seniority: seniority
      ? {
          target: seniority,
          evidence: seniorityEvidence?.slice(0, 300) || null,
        }
      : null,
    matches,
    preparation: matches
      .filter((match) => match.level !== "strong")
      .map((match) => match.skill),
  };
}
