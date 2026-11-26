import { serve } from "@hono/node-server";
import {
  registerGracefulShutdown,
  startTracing,
} from "@job-tracker/observability";
import { MongoClient } from "mongodb";
import { createTrackerApp } from "./app.js";
import type { Application } from "./applications/schema.js";
import { loadDefaultVerifier } from "./auth/require-auth.js";
import type { Profile } from "./profile/routes.js";

const tracing = startTracing("tracker");

const mongo = new MongoClient(
  process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017",
  { serverSelectionTimeoutMS: 2_000 },
);

const trackerDb = mongo.db("job_tracker_tracker");
const applications = trackerDb.collection<Application>("applications");
const profiles = trackerDb.collection<Profile>("profiles");

await Promise.all([
  profiles.createIndex({ ownerId: 1 }, { unique: true }),
  applications.createIndex({ ownerId: 1, updatedAt: -1 }),
]);

const verifyToken = await loadDefaultVerifier();

const app = createTrackerApp({
  applications,
  profiles,
  verifyToken,
  authUrl: process.env.AUTH_URL,
  pingDb: async () => {
    await trackerDb.command({ ping: 1 });
  },
});

const server = serve({
  fetch: app.fetch,
  hostname: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 3002),
});

registerGracefulShutdown({
  service: "tracker",
  server,
  tracing,
  onClose: () => mongo.close(),
});
