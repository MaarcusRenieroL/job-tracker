import assert from "node:assert/strict";
import { test } from "node:test";
import { resumeMatch } from "../src/applications/procedures.js";
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
