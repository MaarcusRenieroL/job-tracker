import { registerObservability } from "@job-tracker/observability";
import { Hono } from "hono";
import type { Collection } from "mongodb";
import type { User } from "./auth/procedures.js";
import { createAuthRoutes } from "./auth/routes.js";

export function createAuthApp({
  users,
  issueToken,
  pingDb,
}: {
  users: Collection<User>;
  issueToken: (userId: string) => Promise<string>;
  pingDb: () => Promise<void>;
}) {
  const app = new Hono();
  registerObservability(app, "auth");

  app.get("/health", (c) => c.json({ service: "auth", status: "ok" }));

  app.get("/ready", async (c) => {
    try {
      await pingDb();
      return c.json({ service: "auth", status: "ready" });
    } catch (error) {
      console.error("Auth MongoDB readiness check failed", error);
      return c.json({ service: "auth", status: "unavailable" }, 503);
    }
  });

  app.route("/auth", createAuthRoutes(users, issueToken));
  return app;
}
