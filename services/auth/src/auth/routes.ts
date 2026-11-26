import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { Collection } from "mongodb";
import { handleLogin, handleRegistration } from "./handlers.js";
import type { User } from "./procedures.js";
import { createRateLimiter, type RateLimitOptions } from "./rate-limit.js";

export function createAuthRoutes(
  users: Collection<User>,
  issueToken: (userId: string) => Promise<string>,
  rateLimit?: RateLimitOptions,
) {
  const router = new Hono();
  router.use("*", bodyLimit({ maxSize: 16 * 1024 }));
  if (rateLimit) {
    router.use("*", createRateLimiter(rateLimit));
  }
  return router
    .post("/register", (c) => handleRegistration(c, users))
    .post("/login", (c) => handleLogin(c, users, issueToken));
}
