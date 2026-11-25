import { resumeMatch } from "../src/applications/resume-match.js";
import assert from "node:assert/strict";
import { test } from "node:test";
import { exactTagFilter } from "../src/applications/procedures.js";
import { applicationSchema, updateSchema } from "../src/applications/schema.js";

test("saving an application requires valid posting fields and rejects client ownership", () => {
  const posting = { company: " Example ", role: "Engineer" };
  assert.equal(applicationSchema.parse(posting).company, "Example");
  assert.equal(
    applicationSchema.safeParse({ ...posting, ownerId: "other" }).success,
    false,
  );
  assert.equal(
    applicationSchema.safeParse({ ...posting, jobUrl: "javascript:alert(1)" })
      .success,
    false,
  );
  assert.equal(updateSchema.safeParse({ stage: "Applied" }).success, false);
  assert.equal(
    updateSchema.safeParse({ version: 1, clear: ["ownerId"] }).success,
    false,
  );
});

test("resume coverage weights strong, partial and missing matches and retains evidence", () => {
  const result = resumeMatch(
    ["TypeScript", "TypeScript", "Redis Streams", "Kubernetes"],
    "Senior Engineer in Bengaluru\nBuilt TypeScript APIs and Redis jobs",
    { role: "Senior Backend Engineer", location: "Bengaluru" },
  );
  assert.equal(result.score, 50);
  assert.deepEqual(
    result.matches.map(({ level }) => level),
    ["strong", "partial", "missing"],
  );
  assert.deepEqual(result.preparation, ["Redis Streams", "Kubernetes"]);
  assert.equal(result.location?.evidence, "Senior Engineer in Bengaluru");
  assert.equal(result.seniority?.evidence, "Senior Engineer in Bengaluru");
});

test("priority, tags, assessments and offer deadlines validate on create and patch", () => {
  const assessment = {
    id: "d30bd509-2305-4d0d-a738-c4928deb17b0",
    title: "API exercise",
    type: "Take-home",
    status: "In progress",
    deadline: "2026-12-04",
  };
  const input = {
    company: "Example",
    role: "Engineer",
    stage: "Ghosted",
    priority: "High",
    tags: [" Remote ", "remote", "backend"],
    assessments: [assessment],
    offer: { currency: "USD", deadline: "2026-12-12" },
  };
  assert.deepEqual(applicationSchema.parse(input).tags, ["remote", "backend"]);
  assert.equal(
    applicationSchema.safeParse({
      ...input,
      assessments: [assessment, assessment],
    }).success,
    false,
  );
  assert.equal(
    updateSchema.safeParse({ version: 1, clear: ["priority"], assessments: [] })
      .success,
    true,
  );
});

test("tag filters treat regular expression characters literally", () => {
  for (const tag of ["C++", "a.b", "[remote]", "R&D", "C#"]) {
    const filter = exactTagFilter(tag);
    assert.equal(filter.test(tag.toLowerCase()), true);
    assert.equal(filter.test(`prefix ${tag}`), false);
  }
  assert.equal(exactTagFilter("a.b").test("axb"), false);
});
