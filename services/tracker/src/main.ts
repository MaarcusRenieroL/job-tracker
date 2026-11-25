import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { readFile } from "node:fs/promises";
import { importSPKI, jwtVerify } from "jose";

const app = new Hono();

app.get("/health", (c) => c.json({ service: "tracker", status: "ok" }));

const publicKey = await importSPKI(
  await readFile(
    new URL("../../../.local/auth-public.pem", import.meta.url),
    "utf8",
  ),
  "EdDSA",
);

app.get("/applications", async (c) => {
  const token = c.req.header("Authorization")?.match(/^Bearer (\S+)$/i)?.[1];

  if (!token) {
    return c.json({ error: "Bearer token required" }, 401);
  }

  try {
    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: ["EdDSA"],
      issuer: "job-tracker-auth",
      audience: "job-tracker-api",
      requiredClaims: ["sub", "exp"],
    });

    if (
      typeof payload.sub !== "string" ||
      !/^[a-f0-9]{24}$/.test(payload.sub)
    ) {
      return c.json({ error: "Invalid token" }, 401);
    }

    return c.json({ ownerId: payload.sub, applications: [] });
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }
});

serve({ fetch: app.fetch, hostname: "127.0.0.1", port: 3002 });
