import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { MongoClient } from "mongodb";
import { createAuthRoutes } from "./auth/routes.js";
import type { User } from "./auth/procedures.js";

const app = new Hono();
const mongo = new MongoClient(
  process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017",
  {
    serverSelectionTimeoutMS: 2_000,
  },
);

const authDb = mongo.db("job_tracker_auth");

const users = authDb.collection<User>("users");
await users.createIndex({ email: 1 }, { unique: true });

app.get("/ready", async (c) => {
  try {
    await authDb.command({ ping: 1 });
    return c.json({ service: "auth", status: "ready" });
  } catch (error) {
    console.error("Auth MongoDB readiness check failed", error);
    return c.json({ service: "auth", status: "unavailable" }, 503);
  }
});

app.get("/health", (c) => c.json({ service: "auth", status: "ok" }));

app.route("/auth", createAuthRoutes(users));

serve({ fetch: app.fetch, hostname: "127.0.0.1", port: 3001 });
