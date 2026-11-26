import {
  applicationSchema,
  priorities,
  profileInputSchema,
  stages,
  updateSchema,
} from "@job-tracker/application-options";
import { z } from "zod";

function toSchema(schema: z.ZodType) {
  const { $schema: _ignored, ...rest } = z.toJSONSchema(schema, {
    io: "input",
    unrepresentable: "any",
  }) as Record<string, unknown>;
  return rest;
}

export function buildTrackerOpenApiSpec() {
  const errorResponse = {
    description: "Structured error response",
    content: {
      "application/json": {
        schema: { $ref: "#/components/schemas/ErrorResponse" },
      },
    },
  };

  return {
    openapi: "3.1.0",
    info: {
      title: "Job Tracker API",
      version: "1.0.0",
      description:
        "Local-first job search operating API: versioned application pipeline, deterministic resume skill coverage, chronological agenda, multi-currency offers, and optional local Ollama AI workflows.\n\n**Need a walkthrough?** Open the **[How-To-Use Guide](/guide)** for Docker Compose startup, authentication steps, curl examples, and observability links.",
    },
    servers: [
      { url: "http://localhost:5173", description: "Web Proxy (Recommended)" },
      { url: "http://localhost:3002", description: "Tracker Service (Direct)" },
    ],
    security: [{ BearerAuth: [] }],
    tags: [
      { name: "Applications", description: "Versioned application CRUD, posting import, and filtering" },
      { name: "Resume Match", description: "Deterministic skill coverage & cross-application gaps" },
      { name: "AI Workflows (Ollama)", description: "Optional local-LLM explanations, extraction, prep, and drafts" },
      { name: "Agenda & Offers", description: "Chronological deadlines and multi-currency offer comparison" },
      { name: "Profile", description: "User profile and versioned resume storage" },
      { name: "System", description: "Health, readiness, dependencies, and Prometheus metrics" },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description:
            "Obtain a 15-minute Ed25519 JWT from `POST /auth/login` and paste it here.",
        },
      },
      schemas: {
        ApplicationInput: toSchema(applicationSchema),
        ApplicationUpdate: toSchema(updateSchema),
        ProfileInput: toSchema(profileInputSchema),
        ErrorResponse: {
          type: "object",
          properties: {
            error: { type: "string" },
            code: { type: "string" },
            issues: { type: "array", items: { type: "object" } },
          },
        },
      },
    },
    paths: {
      "/applications": {
        get: {
          tags: ["Applications"],
          summary: "List applications for the authenticated user",
          parameters: [
            { name: "stage", in: "query", schema: { type: "string", enum: [...stages] } },
            { name: "priority", in: "query", schema: { type: "string", enum: [...priorities] } },
            { name: "tag", in: "query", schema: { type: "string", maxLength: 40 } },
          ],
          responses: {
            "200": { description: "Array of owned applications sorted by updatedAt descending" },
            "400": errorResponse,
            "401": errorResponse,
          },
        },
        post: {
          tags: ["Applications"],
          summary: "Create a new application",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApplicationInput" },
              },
            },
          },
          responses: {
            "201": { description: "Created application document with version = 1" },
            "400": errorResponse,
            "401": errorResponse,
          },
        },
      },
      "/applications/{id}": {
        get: {
          tags: ["Applications"],
          summary: "Fetch a single application by ID",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Application record" }, "404": errorResponse },
        },
        patch: {
          tags: ["Applications"],
          summary: "Update an application with optimistic concurrency (requires current version)",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ApplicationUpdate" },
              },
            },
          },
          responses: {
            "200": { description: "Updated application with incremented version" },
            "400": errorResponse,
            "404": errorResponse,
            "409": { description: "Version conflict — refresh and retry" },
          },
        },
        delete: {
          tags: ["Applications"],
          summary: "Delete an application",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "204": { description: "Deleted" }, "404": errorResponse },
        },
      },
      "/applications/import": {
        post: {
          tags: ["Applications"],
          summary: "Import structured posting fields from a public HTTP/HTTPS job URL",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["url"],
                  properties: { url: { type: "string", format: "uri" } },
                },
              },
            },
          },
          responses: {
            "200": { description: "Extracted posting fields" },
            "400": errorResponse,
            "422": errorResponse,
          },
        },
      },
      "/applications/extract": {
        post: {
          tags: ["AI Workflows (Ollama)"],
          summary: "Extract editable required skills, responsibilities, and seniority from pasted posting text",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["description"],
                  properties: {
                    description: { type: "string", minLength: 20, maxLength: 24000 },
                    role: { type: "string", maxLength: 120 },
                  },
                },
              },
            },
          },
          responses: {
            "200": { description: "Editable suggestions for seniority, skills, and responsibilities" },
            "400": errorResponse,
            "502": errorResponse,
            "503": errorResponse,
          },
        },
      },
      "/applications/{id}/match": {
        get: {
          tags: ["Resume Match"],
          summary: "Run deterministic resume skill-coverage scoring",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Reproducible weighted score, evidence quotes, and prep list" }, "400": errorResponse, "404": errorResponse },
        },
      },
      "/applications/{id}/match/explain": {
        post: {
          tags: ["AI Workflows (Ollama)"],
          summary: "Explain job fit (strengths, gaps, prep priorities) with resume/posting evidence while keeping deterministic score",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Deterministic match + AI fit explanation" }, "400": errorResponse, "404": errorResponse, "502": errorResponse, "503": errorResponse },
        },
      },
      "/applications/{id}/interview-prep": {
        post: {
          tags: ["AI Workflows (Ollama)"],
          summary: "Generate role-specific study topics and practice questions from saved posting and resume gaps",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Suggested study topics and practice questions" }, "400": errorResponse, "404": errorResponse, "502": errorResponse, "503": errorResponse },
        },
      },
      "/applications/{id}/referrals/{referralId}/draft": {
        post: {
          tags: ["AI Workflows (Ollama)"],
          summary: "Generate an editable referral request draft for a saved referral contact",
          parameters: [
            { name: "id", in: "path", required: true, schema: { type: "string" } },
            { name: "referralId", in: "path", required: true, schema: { type: "string", format: "uuid" } },
          ],
          responses: { "200": { description: "Plain-text editable referral draft" }, "404": errorResponse, "502": errorResponse, "503": errorResponse },
        },
      },
      "/applications/{id}/cover-letter/draft": {
        post: {
          tags: ["AI Workflows (Ollama)"],
          summary: "Generate an editable tailored cover letter from saved resume and posting facts",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          responses: { "200": { description: "Plain-text editable cover letter draft" }, "400": errorResponse, "404": errorResponse, "502": errorResponse, "503": errorResponse },
        },
      },
      "/applications/{id}/follow-up/draft": {
        post: {
          tags: ["AI Workflows (Ollama)"],
          summary: "Generate an editable stage-aware follow-up message from saved facts",
          parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
          requestBody: {
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  properties: {
                    recipient: { type: "string", maxLength: 160 },
                    note: { type: "string", maxLength: 500 },
                  },
                },
              },
            },
          },
          responses: { "200": { description: "Plain-text editable follow-up draft" }, "400": errorResponse, "404": errorResponse, "502": errorResponse, "503": errorResponse },
        },
      },
      "/applications/agenda": {
        get: {
          tags: ["Agenda & Offers"],
          summary: "Chronological deadlines, interviews, assessments, follow-ups, and offer windows",
          parameters: [
            { name: "from", in: "query", schema: { type: "string", format: "date" } },
            { name: "to", in: "query", schema: { type: "string", format: "date" } },
          ],
          responses: { "200": { description: "Chronological events list" }, "400": errorResponse },
        },
      },
      "/applications/offers": {
        get: {
          tags: ["Agenda & Offers"],
          summary: "List all recorded compensation offers in original currencies",
          responses: { "200": { description: "Offer rows" } },
        },
      },
      "/applications/missing-skills": {
        get: {
          tags: ["Resume Match"],
          summary: "Aggregate top recurring missing skills across saved applications",
          responses: { "200": { description: "Ranked missing skills" } },
        },
      },
      "/profile": {
        get: {
          tags: ["Profile"],
          summary: "Get the authenticated user's profile and resume versions",
          responses: { "200": { description: "Profile or null" } },
        },
        put: {
          tags: ["Profile"],
          summary: "Create or update profile and append a resume version when text changes",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ProfileInput" },
              },
            },
          },
          responses: { "200": { description: "Saved profile with resumeVersions" }, "400": errorResponse },
        },
      },
      "/health": {
        get: {
          tags: ["System"],
          security: [],
          summary: "Liveness probe",
          responses: { "200": { description: "Service alive" } },
        },
      },
      "/ready": {
        get: {
          tags: ["System"],
          security: [],
          summary: "MongoDB readiness probe",
          responses: { "200": { description: "Ready" }, "503": { description: "Unavailable" } },
        },
      },
      "/ready/dependencies": {
        get: {
          tags: ["System"],
          security: [],
          summary: "Cross-service Auth dependency readiness probe (generates distributed OTel trace)",
          responses: { "200": { description: "Auth dependency ready" }, "503": { description: "Auth dependency unavailable" } },
        },
      },
      "/metrics": {
        get: {
          tags: ["System"],
          security: [],
          summary: "Prometheus HTTP & AI metrics endpoint",
          responses: { "200": { description: "Prometheus exposition format" } },
        },
      },
    },
  };
}
