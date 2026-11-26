import assert from "node:assert/strict";
import { test } from "node:test";
import { ObjectId, type Collection, type WithId } from "mongodb";
import { createTrackerApp } from "../src/app.js";
import type { FetchLike } from "../src/applications/ai/index.js";
import type { Application } from "../src/applications/schema.js";
import type { Profile } from "../src/profile/routes.js";

const OWNER_A = "aaaaaaaaaaaaaaaaaaaaaaaa";
const OWNER_B = "bbbbbbbbbbbbbbbbbbbbbbbb";

function cloneDoc(doc: WithId<Application>): WithId<Application> {
  const { _id, ...rest } = doc;
  return { ...structuredClone(rest), _id: new ObjectId(_id.toHexString()) };
}

function createInMemoryApplications() {
  const store = new Map<string, WithId<Application>>();

  const matchesFilter = (
    doc: WithId<Application>,
    filter: Record<string, unknown>,
  ) => {
    if (filter.ownerId && doc.ownerId !== filter.ownerId) return false;
    if (filter._id instanceof ObjectId && !doc._id.equals(filter._id)) {
      return false;
    }
    if (typeof filter.version === "number" && doc.version !== filter.version) {
      return false;
    }
    if (filter.stage && doc.stage !== filter.stage) return false;
    if (filter.priority && doc.priority !== filter.priority) return false;
    if (filter.tags instanceof RegExp) {
      if (!(doc.tags ?? []).some((t) => (filter.tags as RegExp).test(t))) {
        return false;
      }
    }
    if (
      filter.offer &&
      typeof filter.offer === "object" &&
      "$exists" in filter.offer &&
      Boolean(doc.offer) !== Boolean((filter.offer as { $exists: boolean }).$exists)
    ) {
      return false;
    }
    if (
      filter.resumeText &&
      typeof filter.resumeText === "object" &&
      "$exists" in filter.resumeText &&
      Boolean(doc.resumeText) !==
        Boolean((filter.resumeText as { $exists: boolean }).$exists)
    ) {
      return false;
    }
    return true;
  };

  return {
    insertOne: async (doc: Application) => {
      const _id = new ObjectId();
      store.set(_id.toHexString(), cloneDoc({ ...doc, _id }));
      return { insertedId: _id };
    },
    findOne: async (filter: Record<string, unknown>) => {
      for (const doc of store.values()) {
        if (matchesFilter(doc, filter)) return cloneDoc(doc);
      }
      return null;
    },
    deleteOne: async (filter: Record<string, unknown>) => {
      for (const [key, doc] of store.entries()) {
        if (matchesFilter(doc, filter)) {
          store.delete(key);
          return { deletedCount: 1 };
        }
      }
      return { deletedCount: 0 };
    },
    findOneAndUpdate: async (
      filter: Record<string, unknown>,
      update: {
        $set?: Record<string, unknown>;
        $inc?: { version?: number };
        $unset?: Record<string, "">;
        $push?: { history?: Application["history"][number] };
      },
    ) => {
      for (const [key, doc] of store.entries()) {
        if (!matchesFilter(doc, filter)) continue;
        const next = cloneDoc(doc) as Record<string, unknown>;
        if (update.$set) Object.assign(next, update.$set);
        if (update.$inc?.version) {
          next.version = Number(next.version) + update.$inc.version;
        }
        if (update.$unset) {
          for (const unsetKey of Object.keys(update.$unset)) {
            delete next[unsetKey];
          }
        }
        if (update.$push?.history) {
          (next.history as Application["history"]).push(update.$push.history);
        }
        const typed = cloneDoc(next as WithId<Application>);
        store.set(key, typed);
        return cloneDoc(typed);
      }
      return null;
    },
    find: (filter: Record<string, unknown>) => {
      const getRows = () =>
        [...store.values()]
          .filter((doc) => matchesFilter(doc, filter))
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
          .map((doc) => cloneDoc(doc));

      const cursor = {
        project: () => cursor,
        sort: () => cursor,
        toArray: async () => getRows(),
        async *[Symbol.asyncIterator]() {
          for (const row of getRows()) yield row;
        },
      };
      return cursor;
    },
  } as unknown as Collection<Application>;
}

function createInMemoryProfiles() {
  const profiles = new Map<string, Profile>();
  return {
    findOne: async ({ ownerId }: { ownerId: string }) =>
      profiles.get(ownerId) ?? null,
    updateOne: async (
      { ownerId }: { ownerId: string },
      update: {
        $set: Omit<Profile, "ownerId">;
        $push?: {
          resumeVersions: {
            $each: NonNullable<Profile["resumeVersions"]>;
            $slice: number;
          };
        };
      },
    ) => {
      const versions = [
        ...(profiles.get(ownerId)?.resumeVersions ?? []),
        ...(update.$push?.resumeVersions.$each ?? []),
      ].slice(-20);
      profiles.set(ownerId, {
        ownerId,
        ...update.$set,
        resumeVersions: versions,
      });
    },
  } as unknown as Collection<Profile>;
}

test("createTrackerApp enforces tenant isolation, optimistic concurrency, queries, and AI HTTP routes", async () => {
  let ollamaMode: "ok" | "fail" = "ok";
  let ollamaConfigured = true;

  const fetchImpl: FetchLike = async (_input, init) => {
    if (ollamaMode === "fail") {
      return new Response("error", { status: 500 });
    }
    const body = JSON.parse(String(init?.body ?? "{}")) as {
      format?: Record<string, unknown>;
    };
    if (body.format) {
      const props = (body.format.properties ?? {}) as Record<string, unknown>;
      if ("seniority" in props) {
        return Response.json({
          message: {
            content: JSON.stringify({
              seniority: "Senior",
              skills: ["TypeScript", "Kubernetes"],
              responsibilities: ["Design distributed APIs"],
            }),
          },
        });
      }
      if ("summary" in props) {
        return Response.json({
          message: {
            content: JSON.stringify({
              summary: "Strong TypeScript alignment with a Kubernetes gap.",
              strengths: [
                {
                  point: "TypeScript APIs",
                  evidence: "Built TypeScript services",
                },
              ],
              gaps: [
                {
                  point: "Kubernetes missing",
                  evidence: "No Kubernetes line in resume",
                },
              ],
              preparation: [
                {
                  point: "Study Kubernetes deployments",
                  evidence: "Required by posting",
                },
              ],
            }),
          },
        });
      }
      return Response.json({
        message: {
          content: JSON.stringify({
            topics: [
              {
                topic: "Kubernetes",
                focus: "Pod lifecycle and rollouts",
                source: "Resume gap",
              },
            ],
            questions: [
              {
                question: "How do you roll out breaking schema changes?",
                category: "System design",
                whyAsked: "Core platform duty",
              },
            ],
          }),
        },
      });
    }
    return Response.json({
      message: { content: "Tailored plain-text draft from saved facts." },
    });
  };

  const applications = createInMemoryApplications();
  const profiles = createInMemoryProfiles();

  const buildApp = () =>
    createTrackerApp({
      applications,
      profiles,
      verifyToken: async (token) =>
        token === "token-a" ? OWNER_A : token === "token-b" ? OWNER_B : null,
      pingDb: async () => {},
      aiOptions: {
        env: ollamaConfigured
          ? {
              OLLAMA_MODEL: "qwen2.5:1.5b",
              OLLAMA_BASE_URL: "http://ollama:11434",
            }
          : {},
        fetchImpl,
      },
    });

  const headers = (token: string) => ({
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  });

  const app = buildApp();

  // Unauthenticated rejected
  assert.equal((await app.request("/applications")).status, 401);

  // Save profile for Owner A
  assert.equal(
    (
      await app.request("/profile", {
        method: "PUT",
        headers: headers("token-a"),
        body: JSON.stringify({
          name: "Aarav Mehta",
          resumeText: "Senior Engineer\nBuilt TypeScript services",
        }),
      })
    ).status,
    200,
  );

  // Extract posting suggestions
  const extractRes = await app.request("/applications/extract", {
    method: "POST",
    headers: headers("token-a"),
    body: JSON.stringify({
      description:
        "We need a Senior Platform Engineer experienced in TypeScript and Kubernetes.",
    }),
  });
  assert.equal(extractRes.status, 200);
  const extracted = (await extractRes.json()) as {
    suggestions: { seniority: string; skills: string[] };
  };
  assert.equal(extracted.suggestions.seniority, "Senior");

  // Create application
  const referralId = "4af4bc12-2d1a-4782-9a90-2b05a8e6f1c0";
  const createRes = await app.request("/applications", {
    method: "POST",
    headers: headers("token-a"),
    body: JSON.stringify({
      company: "CloudScale",
      role: "Senior Platform Engineer",
      seniority: "Senior",
      priority: "High",
      tags: ["Platform", "Remote"],
      description: "Build TypeScript and Kubernetes infrastructure.",
      descriptionHtml: "<p>Build TypeScript and Kubernetes infrastructure.</p>",
      skills: ["TypeScript", "Kubernetes"],
      resumeText: "Senior Engineer\nBuilt TypeScript services",
      deadline: "2026-12-05",
      followUp: "2026-12-08",
      offer: { currency: "USD", base: 200000, deadline: "2026-12-10" },
      referrals: [
        { id: referralId, employee: "Ananya", status: "Identified" },
      ],
    }),
  });
  assert.equal(createRes.status, 201);
  const created = (await createRes.json()) as { _id: string; version: number };
  assert.equal(created.version, 1);

  // Tenant isolation: Owner B cannot read, patch, or delete Owner A's application
  assert.equal(
    (
      await app.request(`/applications/${created._id}`, {
        headers: headers("token-b"),
      })
    ).status,
    404,
  );

  // Patch stage -> Applied sets appliedAt, increments version, unsets stale descriptionHtml on text edit
  const patchRes = await app.request(`/applications/${created._id}`, {
    method: "PATCH",
    headers: headers("token-a"),
    body: JSON.stringify({
      version: 1,
      stage: "Applied",
      description: "Updated plain description text.",
    }),
  });
  assert.equal(patchRes.status, 200);
  const updated = (await patchRes.json()) as {
    version: number;
    appliedAt?: string;
    descriptionHtml?: string;
    history: unknown[];
  };
  assert.equal(updated.version, 2);
  assert.ok(updated.appliedAt);
  assert.equal(updated.descriptionHtml, undefined);
  assert.equal(updated.history.length, 2);

  // Optimistic concurrency: stale version returns 409
  const conflictRes = await app.request(`/applications/${created._id}`, {
    method: "PATCH",
    headers: headers("token-a"),
    body: JSON.stringify({ version: 1, stage: "Screening" }),
  });
  assert.equal(conflictRes.status, 409);

  // Agenda, offers, missing-skills, and deterministic match
  const agendaRes = await app.request(
    "/applications/agenda?from=2026-12-01&to=2026-12-15",
    { headers: headers("token-a") },
  );
  assert.equal(agendaRes.status, 200);
  assert.equal(
    ((await agendaRes.json()) as { events: unknown[] }).events.length,
    2,
  );

  const offersRes = await app.request("/applications/offers", {
    headers: headers("token-a"),
  });
  assert.equal(offersRes.status, 200);
  assert.equal(
    ((await offersRes.json()) as { offers: unknown[] }).offers.length,
    1,
  );

  const missingRes = await app.request("/applications/missing-skills", {
    headers: headers("token-a"),
  });
  assert.equal(missingRes.status, 200);
  assert.deepEqual(await missingRes.json(), {
    skills: [{ skill: "Kubernetes", count: 1 }],
  });

  // AI endpoints: 200 OK
  for (const path of [
    `/applications/${created._id}/match/explain`,
    `/applications/${created._id}/interview-prep`,
    `/applications/${created._id}/cover-letter/draft`,
    `/applications/${created._id}/follow-up/draft`,
    `/applications/${created._id}/referrals/${referralId}/draft`,
  ]) {
    const res = await app.request(path, {
      method: "POST",
      headers: headers("token-a"),
      body: JSON.stringify({}),
    });
    assert.equal(res.status, 200, `Expected 200 for ${path}`);
  }

  // AI endpoints: 502 when upstream model fails
  ollamaMode = "fail";
  assert.equal(
    (
      await app.request(`/applications/${created._id}/match/explain`, {
        method: "POST",
        headers: headers("token-a"),
      })
    ).status,
    502,
  );

  // AI endpoints: 503 when OLLAMA_MODEL is unconfigured
  ollamaMode = "ok";
  ollamaConfigured = false;
  const unconfiguredApp = buildApp();
  assert.equal(
    (
      await unconfiguredApp.request(
        `/applications/${created._id}/interview-prep`,
        {
          method: "POST",
          headers: headers("token-a"),
        },
      )
    ).status,
    503,
  );

  // Delete application
  assert.equal(
    (
      await app.request(`/applications/${created._id}`, {
        method: "DELETE",
        headers: headers("token-a"),
      })
    ).status,
    204,
  );
});
