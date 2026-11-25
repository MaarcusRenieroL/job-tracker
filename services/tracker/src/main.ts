import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { createApplicationRoutes } from "./applications/routes.js";
import type { Application } from "./applications/schema.js";
import { MongoClient } from "mongodb";
import { createProfileRoutes, type Profile } from "./profile/routes.js";

const app = new Hono();
const mongo = new MongoClient(
  process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017",
  { serverSelectionTimeoutMS: 2_000 },
);

const trackerDb = mongo.db("job_tracker_tracker");
const applications = trackerDb.collection<Application>("applications");
const profiles = trackerDb.collection<Profile>("profiles");
await profiles.createIndex({ ownerId: 1 }, { unique: true }, undefined);

await applications.createIndex(
  {
    ownerId: 1,
    updatedAt: -1,
  },
  undefined,
  undefined,
);

app.get("/health", (c) => c.json({ service: "tracker", status: "ok" }));

app.get("/ready", async (c) => {
  try {
    await trackerDb.command({ ping: 1 });
    return c.json({ service: "tracker", status: "ready" });
  } catch (error) {
    console.error("Tracker MongoDB readiness check failed", error);
    return c.json({ service: "tracker", status: "unavailable" }, 503);
  }
});

app.route("/profile", createProfileRoutes(profiles));

app.route("/applications", createApplicationRoutes(applications));

serve({
  fetch: app.fetch,
  hostname: process.env.HOST ?? "127.0.0.1",
  port: 3002,
});
