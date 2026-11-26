import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { Collection } from "mongodb";
import { z } from "zod";
import { requireAuth, type TrackerEnv } from "../auth/require-auth.js";

const profileSchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
  resumeText: z.string().trim().min(1).max(24000),
  resumeHtml: z.string().max(100000).optional(),
});
type ResumeVersion = { id: string; resumeText: string; resumeHtml?: string; createdAt: string };
export type Profile = z.infer<typeof profileSchema> & { ownerId: string; resumeVersions?: ResumeVersion[] };

export function createProfileRoutes(profiles: Collection<Profile>) {
  const router = new Hono<TrackerEnv>();
  router.use("*", requireAuth, bodyLimit({ maxSize: 256 * 1024 }));
  return router
    .get("/", async (c) => {
      const profile = await profiles.findOne({ ownerId: c.get("ownerId") });
      return c.json({ profile: profile ? {
        name: profile.name, resumeText: profile.resumeText,
        ...(profile.resumeHtml ? { resumeHtml: profile.resumeHtml } : {}),
        resumeVersions: profile.resumeVersions ?? [],
      } : null });
    })
    .put("/", async (c) => {
      const input = profileSchema.safeParse(await c.req.json().catch(() => null));
      if (!input.success) return c.json({ error: "Enter your name and resume details.", issues: input.error.issues }, 400);
      const ownerId = c.get("ownerId");
      const existing = await profiles.findOne({ ownerId });
      const changed = !existing || existing.resumeText !== input.data.resumeText || (existing.resumeHtml ?? "") !== (input.data.resumeHtml ?? "");
      const version = { id: randomUUID(), resumeText: input.data.resumeText, ...(input.data.resumeHtml ? { resumeHtml: input.data.resumeHtml } : {}), createdAt: new Date().toISOString() };
      // Preserve pre-versioning profiles the first time their resume changes.
      const legacy = existing && !existing.resumeVersions?.length && changed
        ? [{ id: randomUUID(), resumeText: existing.resumeText, ...(existing.resumeHtml ? { resumeHtml: existing.resumeHtml } : {}), createdAt: new Date().toISOString() }]
        : [];
      await profiles.updateOne({ ownerId }, {
        $set: input.data,
        $setOnInsert: { ownerId },
        ...(changed ? { $push: { resumeVersions: { $each: [...legacy, version], $slice: -20 } } } : {}),
      }, { upsert: true });
      const profile = await profiles.findOne({ ownerId });
      return c.json({ profile: { ...input.data, resumeVersions: profile?.resumeVersions ?? [] } });
    });
}
