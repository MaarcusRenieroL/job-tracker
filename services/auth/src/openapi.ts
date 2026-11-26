export function buildAuthOpenApiSpec() {
  return {
    openapi: "3.1.0",
    info: {
      title: "Job Tracker Auth API",
      version: "1.0.0",
      description:
        "Local-first authentication service issuing 15-minute Ed25519 JWTs backed by Argon2id password hashing and MongoDB. See the full usage guide at http://localhost:3002/guide.",
    },
    servers: [
      { url: "http://localhost:3001", description: "Auth Service (Direct)" },
      { url: "http://localhost:5173", description: "Web Dev Proxy" },
    ],
    tags: [
      { name: "Authentication", description: "Account registration and JWT sign-in" },
      { name: "System", description: "Health, readiness, and Prometheus metrics" },
    ],
    paths: {
      "/auth/register": {
        post: {
          tags: ["Authentication"],
          summary: "Register a new user account",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  additionalProperties: false,
                  required: ["email", "password"],
                  properties: {
                    name: { type: "string", minLength: 1, maxLength: 120, example: "Aarav Mehta" },
                    email: { type: "string", format: "email", example: "aarav@example.com" },
                    password: { type: "string", minLength: 12, maxLength: 128, example: "correct-horse-battery-staple" },
                  },
                },
              },
            },
          },
          responses: {
            "201": {
              description: "User created",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      email: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": { description: "Invalid email or password" },
            "409": { description: "Email is already registered" },
            "429": { description: "Rate limit exceeded (Retry-After header set)" },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Authentication"],
          summary: "Sign in and obtain a 15-minute Ed25519 bearer JWT",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  additionalProperties: false,
                  required: ["email", "password"],
                  properties: {
                    email: { type: "string", format: "email", example: "aarav@example.com" },
                    password: { type: "string", minLength: 12, maxLength: 128, example: "correct-horse-battery-staple" },
                  },
                },
              },
            },
          },
          responses: {
            "200": {
              description: "Access token issued",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      accessToken: { type: "string" },
                    },
                  },
                },
              },
            },
            "400": { description: "Invalid payload" },
            "401": { description: "Invalid email or password" },
            "429": { description: "Rate limit exceeded" },
          },
        },
      },
      "/health": {
        get: {
          tags: ["System"],
          summary: "Liveness probe",
          responses: { "200": { description: "Service alive" } },
        },
      },
      "/ready": {
        get: {
          tags: ["System"],
          summary: "MongoDB readiness probe",
          responses: {
            "200": { description: "MongoDB reachable" },
            "503": { description: "MongoDB unavailable" },
          },
        },
      },
      "/metrics": {
        get: {
          tags: ["System"],
          summary: "Prometheus metrics scrape endpoint",
          responses: { "200": { description: "Prometheus text exposition format" } },
        },
      },
    },
  };
}
