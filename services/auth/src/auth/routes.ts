import { Hono } from "hono";
import type { Collection } from "mongodb";
import { handleLogin, handleRegistration } from "./handlers.js";
import type { User } from "./procedures.js";

export function createAuthRoutes(
  users: Collection<User>,
  issueToken: (userId: string) => Promise<string>,
) {
  return new Hono()
    .post("/register", (c) => handleRegistration(c, users))
    .post("/login", (c) => handleLogin(c, users, issueToken));
}
