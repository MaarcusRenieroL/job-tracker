import type { Application } from "./schema.js";

export function resumeMatch(
  required: string[],
  resume: string,
  context: Pick<Application, "role" | "seniority" | "location" | "workModel"> = {
    role: "",
  },
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
  const seniority =
    context.seniority?.trim() ||
    context.role.match(
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
