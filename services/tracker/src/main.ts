import { serve } from "@hono/node-server";
import {
  registerGracefulShutdown,
  startTracing,
} from "@job-tracker/observability";
import { MongoClient } from "mongodb";
import { createTrackerApp } from "./app.js";
import type { Application } from "./applications/schema.js";
import { loadDefaultVerifier } from "./auth/require-auth.js";
import { loadTrackerConfig } from "./config.js";
import type { Profile } from "./profile/routes.js";

const config = loadTrackerConfig();
const tracing = startTracing("tracker");

const mongo = new MongoClient(config.MONGO_URI, {
  serverSelectionTimeoutMS: 2_000,
});

const trackerDb = mongo.db("job_tracker_tracker");
const applications = trackerDb.collection<Application>("applications");
const profiles = trackerDb.collection<Profile>("profiles");

await Promise.all([
  profiles.createIndex({ ownerId: 1 }, { unique: true }),
  applications.createIndex({ ownerId: 1, updatedAt: -1 }),
]);

const verifyToken = await loadDefaultVerifier(config.AUTH_PUBLIC_KEY_PATH);

const app = createTrackerApp({
  applications,
  profiles,
  verifyToken,
  authUrl: config.AUTH_URL,
  pingDb: async () => {
    await trackerDb.command({ ping: 1 });
  },
});

const server = serve({
  fetch: app.fetch,
  hostname: config.HOST,
  port: config.PORT,
});

registerGracefulShutdown({
  service: "tracker",
  server,
  tracing,
  onClose: () => mongo.close(),
});
