import assert from "node:assert/strict";
import { generateKeyPairSync } from "node:crypto";
import { test } from "node:test";
import { Hono } from "hono";
import { importPKCS8, importSPKI, SignJWT } from "jose";
import type { Collection } from "mongodb";
import {
  createJwtVerifier,
  createRequireAuth,
} from "../src/auth/require-auth.js";
import { createProfileRoutes, type Profile } from "../src/profile/routes.js";

test("profiles require a token and keep each user's resume separate", async () => {
  const { privateKey: privatePem, publicKey: publicPem } = generateKeyPairSync(
    "ed25519",
    {
      privateKeyEncoding: { type: "pkcs8", format: "pem" },
      publicKeyEncoding: { type: "spki", format: "pem" },
    },
  );
  const [privateKey, publicKey] = await Promise.all([
    importPKCS8(privatePem, "EdDSA"),
    importSPKI(publicPem, "EdDSA"),
  ]);

  const records = new Map<string, Profile>();
  const collection = {
    findOne: async ({ ownerId }: { ownerId: string }) =>
      records.get(ownerId) ?? null,
    updateOne: async (
      { ownerId }: { ownerId: string },
      update: {
        $set: Omit<Profile, "ownerId">;
        $push?: {
          resumeVersions: {
            $each: NonNullable<Profile["resumeVersions"]>;
            $slice: number;
          };
        };
      },
    ) => {
      const versions = [
        ...(records.get(ownerId)?.resumeVersions ?? []),
        ...(update.$push?.resumeVersions.$each ?? []),
      ].slice(-20);
      records.set(ownerId, {
        ownerId,
        ...update.$set,
        resumeVersions: versions,
      });
    },
  } as unknown as Collection<Profile>;

  const authMiddleware = createRequireAuth(createJwtVerifier(publicKey));
  const app = new Hono().route(
    "/profile",
    createProfileRoutes(collection, authMiddleware),
  );

  const token = (id: string) =>
    new SignJWT({})
      .setProtectedHeader({ alg: "EdDSA" })
      .setSubject(id)
      .setIssuer("job-tracker-auth")
      .setAudience("job-tracker-api")
      .setExpirationTime("5m")
      .sign(privateKey);

  const a = await token("aaaaaaaaaaaaaaaaaaaaaaaa");
  const b = await token("bbbbbbbbbbbbbbbbbbbbbbbb");
  const headers = (value: string) => ({
    authorization: `Bearer ${value}`,
    "content-type": "application/json",
  });

  assert.equal((await app.request("/profile")).status, 401);
  assert.deepEqual(
    await (await app.request("/profile", { headers: headers(a) })).json(),
    { profile: null },
  );

  const save = await app.request("/profile", {
    method: "PUT",
    headers: headers(a),
    body: JSON.stringify({ name: "A", resumeText: "TypeScript" }),
  });
  assert.equal(save.status, 200);
  assert.deepEqual(
    await (await app.request("/profile", { headers: headers(b) })).json(),
    { profile: null },
  );

  await app.request("/profile", {
    method: "PUT",
    headers: headers(a),
    body: JSON.stringify({ name: "A", resumeText: "TypeScript and React" }),
  });
  const result = (await (
    await app.request("/profile", { headers: headers(a) })
  ).json()) as { profile: Profile };
  assert.equal(result.profile.resumeText, "TypeScript and React");
  assert.deepEqual(
    result.profile.resumeVersions?.map((version) => version.resumeText),
    ["TypeScript", "TypeScript and React"],
  );
});
