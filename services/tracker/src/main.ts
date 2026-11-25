import { serve } from "@hono/node-server";
import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => c.json({ service: "tracker", status: "ok" }));

serve({ fetch: app.fetch, hostname: "127.0.0.1", port: 3002 });
