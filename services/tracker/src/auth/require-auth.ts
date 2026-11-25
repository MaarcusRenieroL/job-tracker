import { createMiddleware } from "hono/factory";
import { readFile } from "node:fs/promises";
import { importSPKI, jwtVerify } from "jose";

export type TrackerEnv = {
  Variables: { ownerId: string };
};

const publicKey = await importSPKI(
  await readFile(
    new URL("../../../../.local/auth-public.pem", import.meta.url),
    "utf8",
  ),
  "EdDSA",
);

export const requireAuth = createMiddleware<TrackerEnv>(async (c, next) => {
  const token = c.req.header("Authorization")?.match(/^Bearer (\S+)$/i)?.[1];

  if (!token) {
    return c.json({ error: "Bearer token required" }, 401);
  }

  let ownerId: string | undefined;

  try {
    const { payload } = await jwtVerify(token, publicKey, {
      algorithms: ["EdDSA"],
      issuer: "job-tracker-auth",
      audience: "job-tracker-api",
      requiredClaims: ["sub", "exp"],
    });
    ownerId = payload.sub;
  } catch {
    return c.json({ error: "Invalid or expired token" }, 401);
  }

  if (!ownerId || !/^[a-f0-9]{24}$/.test(ownerId)) {
    return c.json({ error: "Invalid token" }, 401);
  }

  c.set("ownerId", ownerId);
  await next();
});
