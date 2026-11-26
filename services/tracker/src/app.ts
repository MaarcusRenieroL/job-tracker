import {
  createLogger,
  registerApiDocs,
  registerErrorHandlers,
  registerObservability,
  registerSecurityHeaders,
} from "@job-tracker/observability";
import { Hono } from "hono";
import type { Collection } from "mongodb";
import type { AiRuntimeOptions } from "./applications/ai/index.js";
import { createApplicationRoutes } from "./applications/routes.js";
import type { Application } from "./applications/schema.js";
import { createRequireAuth, type VerifyTokenFn } from "./auth/require-auth.js";
import { trackerGuideHtml } from "./guide.js";
import { buildTrackerOpenApiSpec } from "./openapi.js";
import { createProfileRoutes, type Profile } from "./profile/routes.js";
import { checkAuthReadiness } from "./system/auth-readiness.js";

export function createTrackerApp({
  applications,
  profiles,
  verifyToken,
  pingDb,
  authUrl,
  aiOptions,
}: {
  applications: Collection<Application>;
  profiles: Collection<Profile>;
  verifyToken?: VerifyTokenFn;
  pingDb: () => Promise<void>;
  authUrl?: string;
  aiOptions?: AiRuntimeOptions;
}) {
  const app = new Hono();
  const logger = createLogger("tracker");
  const { recordAiCall } = registerObservability(app, "tracker", logger);
  registerSecurityHeaders(app);
  registerErrorHandlers(app, "tracker", logger);
  registerApiDocs(app, {
    spec: buildTrackerOpenApiSpec(),
    guideHtml: trackerGuideHtml,
  });

  const authMiddleware = createRequireAuth(verifyToken);

  app.get("/health", (c) => c.json({ service: "tracker", status: "ok" }));

  app.get("/ready", async (c) => {
    try {
      await pingDb();
      return c.json({ service: "tracker", status: "ready" });
    } catch (error) {
      logger.error({ err: error }, "Tracker MongoDB readiness check failed");
      return c.json({ service: "tracker", status: "unavailable" }, 503);
    }
  });

  if (authUrl) {
    const authReadyUrl = new URL("/ready", authUrl);
    app.get("/ready/dependencies", async (c) => {
      const ready = await checkAuthReadiness(authReadyUrl);
      return c.json(
        { auth: ready ? "ready" : "unavailable" },
        ready ? 200 : 503,
      );
    });
  }

  app.route("/profile", createProfileRoutes(profiles, authMiddleware));
  app.route(
    "/applications",
    createApplicationRoutes(applications, {
      profiles,
      authMiddleware,
      aiOptions: {
        ...aiOptions,
        recordMetric: aiOptions?.recordMetric ?? recordAiCall,
      },
    }),
  );

  return app;
}
