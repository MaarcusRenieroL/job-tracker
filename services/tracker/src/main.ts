import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { requireAuth } from "./auth/require-auth.js";

const app = new Hono();

app.get("/health", (c) => c.json({ service: "tracker", status: "ok" }));

app.get("/applications", requireAuth, (c) => {
  return c.json({ ownerId: c.get("ownerId"), applications: [] });
});

serve({ fetch: app.fetch, hostname: "127.0.0.1", port: 3002 });
