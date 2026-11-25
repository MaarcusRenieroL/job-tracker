import type { Context } from "hono";
import type { Collection } from "mongodb";
import { z } from "zod";
import { registerUser, type User } from "./procedures.js";

const registrationSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  password: z.string().min(12).max(128),
});

export async function handleRegistration(c: Context, users: Collection<User>) {
  const body: unknown = await c.req.json().catch(() => undefined);
  const result = registrationSchema.safeParse(body);

  if (!result.success) {
    return c.json({
      error: "Provide a valid email and a 12 - 128 character password.",
    }, 400);
  }

  const user = await registerUser(users, result.data);
  if (!user) {
    return c.json({ error: "Email is already registered" }, 409);
  }

  return c.json(user, 201);
}
