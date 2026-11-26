import { readFile } from "node:fs/promises";
import type { MiddlewareHandler } from "hono";
import { createMiddleware } from "hono/factory";
import { importSPKI, jwtVerify, type CryptoKey } from "jose";

export type TrackerEnv = {
  Variables: { ownerId: string };
};

export type VerifyTokenFn = (token: string) => Promise<string | null>;

export function createJwtVerifier(publicKey: CryptoKey): VerifyTokenFn {
  return async (token: string) => {
    try {
      const { payload } = await jwtVerify(token, publicKey, {
        algorithms: ["EdDSA"],
        issuer: "job-tracker-auth",
        audience: "job-tracker-api",
        requiredClaims: ["sub", "exp"],
      });
      if (!payload.sub || !/^[a-f0-9]{24}$/i.test(payload.sub)) {
        return null;
      }
      return payload.sub;
    } catch {
      return null;
    }
  };
}

let cachedDefaultVerifierPromise: Promise<VerifyTokenFn> | undefined;

export function loadDefaultVerifier(
  keyPath: string | URL = process.env.AUTH_PUBLIC_KEY_PATH ??
    new URL("../../../../.local/auth-public.pem", import.meta.url),
): Promise<VerifyTokenFn> {
  if (!cachedDefaultVerifierPromise) {
    cachedDefaultVerifierPromise = readFile(keyPath, "utf8")
      .then((pem) => importSPKI(pem, "EdDSA"))
      .then((key) => createJwtVerifier(key));
  }
  return cachedDefaultVerifierPromise;
}

export function createRequireAuth(
  verifyToken?: VerifyTokenFn,
): MiddlewareHandler<TrackerEnv> {
  return createMiddleware<TrackerEnv>(async (c, next) => {
    const token = c.req
      .header("Authorization")
      ?.match(/^Bearer (\S+)$/i)?.[1];

    if (!token) {
      return c.json({ error: "Bearer token required" }, 401);
    }

    const verifier = verifyToken ?? (await loadDefaultVerifier());
    const ownerId = await verifier(token);
    if (!ownerId) {
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    c.set("ownerId", ownerId);
    await next();
  });
}

export const requireAuth = createRequireAuth();
