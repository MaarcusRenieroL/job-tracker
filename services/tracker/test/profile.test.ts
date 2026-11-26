import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { Hono } from "hono";
import { importPKCS8, SignJWT } from "jose";
import type { Collection } from "mongodb";
import type { Profile } from "../src/profile/routes.js";

test(
  "profiles require a token and keep each user's resume separate",
  {
    skip:
      !existsSync(
        new URL("../../../.local/auth-private.pem", import.meta.url),
      ) ||
      !existsSync(new URL("../../../.local/auth-public.pem", import.meta.url)),
  },
  async () => {
    const { createProfileRoutes } = await import("../src/profile/routes.js");
    const records = new Map<string, Profile>();
    const collection = {
      findOne: async ({ ownerId }: { ownerId: string }) =>
        records.get(ownerId) ?? null,
      updateOne: async (
        { ownerId }: { ownerId: string },
        update: { $set: Omit<Profile, "ownerId">; $push?: { resumeVersions: { $each: NonNullable<Profile["resumeVersions"]>; $slice: number } } },
      ) => {
        const versions = [...(records.get(ownerId)?.resumeVersions ?? []), ...(update.$push?.resumeVersions.$each ?? [])].slice(-20);
        records.set(ownerId, { ownerId, ...update.$set, resumeVersions: versions });
      },
    } as unknown as Collection<Profile>;
    const app = new Hono().route("/profile", createProfileRoutes(collection));
    const key = await importPKCS8(
      await readFile(
        new URL("../../../.local/auth-private.pem", import.meta.url),
        "utf8",
      ),
      "EdDSA",
    );
    const token = (id: string) =>
      new SignJWT({})
        .setProtectedHeader({ alg: "EdDSA" })
        .setSubject(id)
        .setIssuer("job-tracker-auth")
        .setAudience("job-tracker-api")
        .setExpirationTime("5m")
        .sign(key);
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
    await app.request("/profile", { method: "PUT", headers: headers(a), body: JSON.stringify({ name: "A", resumeText: "TypeScript and React" }) });
    const result = await (await app.request("/profile", { headers: headers(a) })).json() as { profile: Profile };
    assert.equal(result.profile.resumeText, "TypeScript and React");
    assert.deepEqual(result.profile.resumeVersions?.map((version) => version.resumeText), ["TypeScript", "TypeScript and React"]);
  },
);
