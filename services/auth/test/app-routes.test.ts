import assert from "node:assert/strict";
import { test } from "node:test";
import { MongoServerError, ObjectId, type Collection } from "mongodb";
import { createAuthApp } from "../src/app.js";
import type { User } from "../src/auth/procedures.js";

function createInMemoryUsers() {
  const rows: (User & { _id: ObjectId })[] = [];
  return {
    insertOne: async (doc: User) => {
      if (rows.some((existing) => existing.email === doc.email)) {
        const duplicate = new MongoServerError({ message: "E11000 duplicate" });
        duplicate.code = 11000;
        throw duplicate;
      }
      const _id = new ObjectId();
      rows.push({ ...doc, _id });
      return { insertedId: _id };
    },
    findOne: async ({ email }: { email: string }) =>
      rows.find((existing) => existing.email === email) ?? null,
  } as unknown as Collection<User>;
}

test("createAuthApp handles registration, login, duplicate conflict, readiness, and metrics", async () => {
  let dbHealthy = true;
  const app = createAuthApp({
    users: createInMemoryUsers(),
    issueToken: async (userId) => `jwt-for-${userId}`,
    pingDb: async () => {
      if (!dbHealthy) throw new Error("db down");
    },
  });

  const health = await app.request("/health");
  assert.equal(health.status, 200);
  assert.ok(health.headers.get("x-request-id"));

  assert.equal((await app.request("/ready")).status, 200);
  dbHealthy = false;
  assert.equal((await app.request("/ready")).status, 503);
  dbHealthy = true;

  const reg = await app.request("/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: "  Priya Nair ",
      email: "  PRIYA@Example.com ",
      password: "correct-horse-battery-staple",
    }),
  });
  assert.equal(reg.status, 201);
  const created = (await reg.json()) as { id: string; email: string };
  assert.equal(created.email, "priya@example.com");

  const dup = await app.request("/auth/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "priya@example.com",
      password: "correct-horse-battery-staple",
    }),
  });
  assert.equal(dup.status, 409);

  // Strict login schema rejects unexpected fields
  const extraFieldLogin = await app.request("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "priya@example.com",
      password: "correct-horse-battery-staple",
      name: "ShouldNotBeAllowedOnLogin",
    }),
  });
  assert.equal(extraFieldLogin.status, 400);

  const badLogin = await app.request("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "priya@example.com",
      password: "wrong-password-12345",
    }),
  });
  assert.equal(badLogin.status, 401);

  const okLogin = await app.request("/auth/login", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      email: "PRIYA@example.com",
      password: "correct-horse-battery-staple",
    }),
  });
  assert.equal(okLogin.status, 200);
  const tokenPayload = (await okLogin.json()) as { accessToken: string };
  assert.equal(tokenPayload.accessToken, `jwt-for-${created.id}`);

  const metrics = await app.request("/metrics");
  assert.equal(metrics.status, 200);
  assert.match(await metrics.text(), /http_requests_total/);
});
