import assert from "node:assert/strict";
import { test } from "node:test";
import { explainFit } from "../src/applications/ai-fit.js";
import { extractPosting } from "../src/applications/extract-posting.js";
import { generateInterviewPrep } from "../src/applications/interview-prep.js";
import type { FetchLike } from "../src/applications/ollama.js";
import {
  draftCoverLetter,
  draftFollowUp,
} from "../src/applications/outreach-drafts.js";
import { draftReferral } from "../src/applications/referral-draft.js";
import { resumeMatch } from "../src/applications/resume-match.js";
import type { Application } from "../src/applications/schema.js";

function mockOllamaFetch(
  responder: (url: URL, body: Record<string, unknown>) => unknown,
): { fetchImpl: FetchLike; calls: { url: string; body: Record<string, unknown> }[] } {
  const calls: { url: string; body: Record<string, unknown> }[] = [];
  const fetchImpl: FetchLike = async (input, init) => {
    const url = input instanceof URL ? input : new URL(String(input));
    const body = JSON.parse(String(init?.body ?? "{}")) as Record<
      string,
      unknown
    >;
    calls.push({ url: url.href, body });
    const content = responder(url, body);
    return new Response(
      JSON.stringify({
        message: {
          content:
            typeof content === "string" ? content : JSON.stringify(content),
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  };
  return { fetchImpl, calls };
}

const sampleApplication: Application = {
  ownerId: "507f1f77bcf86cd799439011",
  company: "Acme Cloud",
  role: "Senior Backend Engineer",
  seniority: "Senior",
  location: "Bengaluru",
  workModel: "Hybrid",
  description:
    "Design distributed TypeScript and Go microservices, operate Kubernetes clusters, and own API reliability.",
  skills: ["TypeScript", "Go", "Kubernetes"],
  responsibilities: [
    "Design distributed TypeScript and Go microservices",
    "Operate production Kubernetes clusters",
  ],
  resumeText:
    "Senior Software Engineer in Bengaluru\nBuilt high-throughput TypeScript services and Go workers",
  notes: "Spoke with platform engineering lead at meetup.",
  appliedAt: "2026-11-20",
  followUp: "2026-11-28",
  stage: "Technical Interview",
  version: 2,
  createdAt: new Date("2026-11-20T00:00:00Z"),
  updatedAt: new Date("2026-11-21T00:00:00Z"),
  history: [{ to: "Technical Interview", at: new Date("2026-11-21T00:00:00Z") }],
  referrals: [
    {
      id: "4af4bc12-2d1a-4782-9a90-2b05a8e6f1c0",
      employee: "Priya Nair",
      role: "Staff Platform Engineer",
      status: "Identified",
    },
  ],
  interviews: [
    {
      id: "6ef93d20-50fd-42f0-a2aa-06ee23dc10bd",
      type: "Technical round",
      dateTime: "2026-11-25T10:00:00Z",
      interviewer: "Arjun Rao",
      topics: "Distributed queues and backpressure",
      result: "Scheduled",
    },
  ],
};

test("AI helpers return null when OLLAMA_MODEL is unset", async () => {
  const env = { OLLAMA_MODEL: "   " };
  const match = resumeMatch(
    sampleApplication.skills ?? [],
    sampleApplication.resumeText ?? "",
    sampleApplication,
  );
  assert.equal(
    await draftReferral(sampleApplication, sampleApplication.referrals![0], {
      env,
    }),
    null,
  );
  assert.equal(await explainFit(sampleApplication, match, { env }), null);
  assert.equal(
    await extractPosting(sampleApplication.description!, sampleApplication.role, {
      env,
    }),
    null,
  );
  assert.equal(await generateInterviewPrep(sampleApplication, { env }), null);
  assert.equal(await draftCoverLetter(sampleApplication, {}, { env }), null);
  assert.equal(await draftFollowUp(sampleApplication, {}, {}, { env }), null);
});

test("draftReferral honors OLLAMA_BASE_URL for Compose networking", async () => {
  const { fetchImpl, calls } = mockOllamaFetch(
    () => "Hi Priya, I am applying for Senior Backend Engineer at Acme Cloud.",
  );
  const draft = await draftReferral(
    sampleApplication,
    sampleApplication.referrals![0],
    {
      env: {
        OLLAMA_BASE_URL: "http://ollama:11434",
        OLLAMA_MODEL: "qwen2.5:1.5b",
      },
      fetchImpl,
    },
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "http://ollama:11434/api/chat");
  assert.equal(calls[0].body.model, "qwen2.5:1.5b");
  assert.match(draft ?? "", /Priya/);
});

test("explainFit returns evidence-backed summary while preserving deterministic score", async () => {
  const match = resumeMatch(
    sampleApplication.skills ?? [],
    sampleApplication.resumeText ?? "",
    sampleApplication,
  );
  assert.equal(match.score, 67);

  const { fetchImpl, calls } = mockOllamaFetch(() => ({
    summary: "Strong TypeScript and Go alignment with a Kubernetes gap.",
    strengths: [
      {
        point: "Production TypeScript and Go backend services",
        evidence: "Built high-throughput TypeScript services and Go workers",
      },
    ],
    gaps: [
      {
        point: "Kubernetes operations missing from resume",
        evidence: "Posting requires Kubernetes; no explicit resume line found.",
      },
    ],
    preparation: [
      {
        point: "Review Kubernetes pod scheduling and rollouts",
        evidence: "Kubernetes is listed as a missing required skill.",
      },
    ],
  }));

  const explanation = await explainFit(sampleApplication, match, {
    env: {
      OLLAMA_BASE_URL: "http://ollama:11434",
      OLLAMA_MODEL: "qwen2.5:1.5b",
    },
    fetchImpl,
  });

  assert.equal(calls[0].url, "http://ollama:11434/api/chat");
  assert.equal(match.score, 67);
  assert.equal(explanation?.strengths.length, 1);
  assert.equal(explanation?.gaps[0]?.point, "Kubernetes operations missing from resume");
  assert.equal(
    explanation?.preparation[0]?.evidence,
    "Kubernetes is listed as a missing required skill.",
  );
});

test("extractPosting normalizes and deduplicates suggested skills, responsibilities, and seniority", async () => {
  const { fetchImpl } = mockOllamaFetch(() => ({
    seniority: " Senior ",
    skills: ["TypeScript", "• typescript ", "- Kubernetes", "Go"],
    responsibilities: [
      "1. Build resilient APIs",
      "• Build resilient APIs",
      "2) Operate Kubernetes clusters",
    ],
  }));

  const suggestions = await extractPosting(
    sampleApplication.description!,
    sampleApplication.role,
    {
      env: { OLLAMA_MODEL: "qwen2.5:1.5b" },
      fetchImpl,
    },
  );

  assert.deepEqual(suggestions, {
    seniority: "Senior",
    skills: ["TypeScript", "Kubernetes", "Go"],
    responsibilities: ["Build resilient APIs", "Operate Kubernetes clusters"],
  });
});

test("generateInterviewPrep supplies resume gaps and returns role-specific topics and questions", async () => {
  const { fetchImpl, calls } = mockOllamaFetch(() => ({
    topics: [
      {
        topic: "Kubernetes cluster operations",
        focus: "Practice deployment strategies, probes, and resource quotas.",
        source: "Resume gap",
      },
    ],
    questions: [
      {
        question: "How do you handle backpressure in Go worker pipelines?",
        category: "Technical",
        whyAsked: "Matches scheduled round topic on distributed queues.",
      },
    ],
  }));

  const prep = await generateInterviewPrep(sampleApplication, {
    env: { OLLAMA_MODEL: "qwen2.5:1.5b" },
    fetchImpl,
  });

  const messages = calls[0].body.messages as { role: string; content: string }[];
  const userPayload = JSON.parse(messages[1].content) as {
    resumeGaps: { skill: string; level: string }[];
  };
  assert.deepEqual(userPayload.resumeGaps, [
    { skill: "Kubernetes", level: "missing" },
  ]);
  assert.equal(prep?.topics[0]?.source, "Resume gap");
  assert.equal(prep?.questions[0]?.category, "Technical");
});

test("draftCoverLetter and draftFollowUp pass saved candidate facts and return editable text", async () => {
  const { fetchImpl, calls } = mockOllamaFetch((_url, body) => {
    const messages = body.messages as { role: string; content: string }[];
    const payload = JSON.parse(messages[1].content) as Record<string, unknown>;
    return `Draft for ${String(payload.candidateName)} at ${String(payload.targetCompany)}`;
  });

  const env = {
    OLLAMA_BASE_URL: "http://ollama:11434",
    OLLAMA_MODEL: "qwen2.5:1.5b",
  };
  const coverLetter = await draftCoverLetter(
    sampleApplication,
    { name: "Aarav Mehta" },
    { env, fetchImpl },
  );
  const followUp = await draftFollowUp(
    sampleApplication,
    { name: "Aarav Mehta" },
    { recipient: "Arjun Rao", note: "Thanking after technical round" },
    { env, fetchImpl },
  );

  assert.equal(coverLetter, "Draft for Aarav Mehta at Acme Cloud");
  assert.equal(followUp, "Draft for Aarav Mehta at Acme Cloud");
  assert.equal(calls.length, 2);
});
