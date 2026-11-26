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

const tracing = startTracing("auth");

const mongo = new MongoClient(
  process.env.MONGO_URI ?? "mongodb://127.0.0.1:27017",
  { serverSelectionTimeoutMS: 2_000 },
);

const authDb = mongo.db("job_tracker_auth");
const users = authDb.collection<User>("users");
await users.createIndex({ email: 1 }, { unique: true });

const privateKeyPath =
  process.env.AUTH_PRIVATE_KEY_PATH ??
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
  pingDb: async () => {
    await authDb.command({ ping: 1 });
  },
});

const server = serve({
  fetch: app.fetch,
  hostname: process.env.HOST ?? "127.0.0.1",
  port: Number(process.env.PORT ?? 3001),
});

registerGracefulShutdown({
  service: "auth",
  server,
  tracing,
  onClose: () => mongo.close(),
});
