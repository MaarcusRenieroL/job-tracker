import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { requireAuth } from "./auth/require-auth.js";
import { MongoClient } from "mongodb";

const app = new Hono();
const mongo = new MongoClient(
  process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017",
  { serverSelectionTimeoutMS: 2_000 },
);

const trackerDb = mongo.db("job_tracker_tracker");
const applications = trackerDb.collection("applications");

await applications.createIndex(
  {
    ownerId: 1,
    updatedAt: -1,
  },
  undefined,
  undefined,
);

app.get("/health", (c) => c.json({ service: "tracker", status: "ok" }));

app.get("/applications", requireAuth, async (c) => {
  const ownerId = c.get("ownerId");

  const rows = await applications
    .find({ ownerId })
    .sort({ updatedAt: -1 })
    .toArray();

  return c.json({ applications: rows });
});

serve({ fetch: app.fetch, hostname: "127.0.0.1", port: 3002 });
