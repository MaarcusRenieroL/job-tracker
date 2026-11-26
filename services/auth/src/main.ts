import { readFile } from "node:fs/promises";
import { serve } from "@hono/node-server";
import {
  registerGracefulShutdown,
  startTracing,
} from "@job-tracker/observability";
import { importPKCS8, SignJWT } from "jose";
import { MongoClient } from "mongodb";
import { createAuthApp } from "./app.js";
import type { User } from "./auth/procedures.js";
import { loadAuthConfig } from "./config.js";

const config = loadAuthConfig();
const tracing = startTracing("auth");

const mongo = new MongoClient(config.MONGO_URI, {
  serverSelectionTimeoutMS: 2_000,
});

const authDb = mongo.db("job_tracker_auth");
const users = authDb.collection<User>("users");
await users.createIndex({ email: 1 }, { unique: true });

const privateKeyPath =
  config.AUTH_PRIVATE_KEY_PATH ??
  new URL("../../../.local/auth-private.pem", import.meta.url);

const privateKey = await importPKCS8(
  await readFile(privateKeyPath, "utf8"),
  "EdDSA",
);

const issueToken = (userId: string) =>
  new SignJWT({})
    .setProtectedHeader({ alg: "EdDSA" })
    .setSubject(userId)
    .setIssuer("job-tracker-auth")
    .setAudience("job-tracker-api")
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(privateKey);

const app = createAuthApp({
  users,
  issueToken,
  rateLimit: {
    maxRequests: config.AUTH_RATE_LIMIT_MAX,
    windowMs: config.AUTH_RATE_LIMIT_WINDOW_MS,
  },
  pingDb: async () => {
    await authDb.command({ ping: 1 });
  },
});

const server = serve({
  fetch: app.fetch,
  hostname: config.HOST,
  port: config.PORT,
});

registerGracefulShutdown({
  service: "auth",
  server,
  tracing,
  onClose: () => mongo.close(),
});
