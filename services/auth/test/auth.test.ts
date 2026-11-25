import assert from "node:assert/strict";
import { test } from "node:test";
import { Hono } from "hono";
import { MongoClient } from "mongodb";
import type { User } from "../src/auth/procedures.js";
import { createAuthRoutes } from "../src/auth/routes.js";

test("registration and login reject invalid input before accessing MongoDB", async () => {
  const mongo = new MongoClient("mongodb://127.0.0.1:27017");
  const users = mongo.db("job_tracker_auth").collection<User>("users");
  const app = new Hono().route("/auth", createAuthRoutes(users, async () => {
    throw new Error("Invalid input must never reach token signing");
  }));

  try {
    for (const path of ["/auth/register", "/auth/login"]) {
      for (const body of ["{", JSON.stringify({ email: "invalid", password: "short" })]) {
        const response = await app.request(path, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body,
        });
        assert.equal(response.status, 400);
      }
    }
  } finally {
    await mongo.close();
  }
});
