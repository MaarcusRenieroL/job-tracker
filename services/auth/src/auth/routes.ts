import { Hono } from "hono";
import type { Collection } from "mongodb";
import { handleRegistration } from "./handlers.js";
import type { User } from "./procedures.js";

export function createAuthRoutes(users: Collection<User>) {
  return new Hono().post("/register", (c) => handleRegistration(c, users));
}
