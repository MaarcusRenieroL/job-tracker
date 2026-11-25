import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { Collection } from "mongodb";
import { z } from "zod";
import { requireAuth, type TrackerEnv } from "../auth/require-auth.js";

const profileSchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
  resumeText: z.string().trim().min(1).max(24000),
});

export type Profile = z.infer<typeof profileSchema> & { ownerId: string };

export function createProfileRoutes(profiles: Collection<Profile>) {
  const router = new Hono<TrackerEnv>();
  router.use("*", requireAuth, bodyLimit({ maxSize: 64 * 1024 }));
  return router
    .get("/", async (c) => {
      const profile = await profiles.findOne({ ownerId: c.get("ownerId") });
      return c.json({
        profile: profile
          ? { name: profile.name, resumeText: profile.resumeText }
          : null,
      });
    })
    .put("/", async (c) => {
      const input = profileSchema.safeParse(
        await c.req.json().catch(() => null),
      );
      if (!input.success)
        return c.json(
          {
            error: "Enter your name and resume details.",
            issues: input.error.issues,
          },
          400,
        );
      await profiles.updateOne(
        { ownerId: c.get("ownerId") },
        {
          $set: input.data,
          $setOnInsert: { ownerId: c.get("ownerId") },
        },
        { upsert: true },
      );
      return c.json({ profile: input.data });
    });
}
