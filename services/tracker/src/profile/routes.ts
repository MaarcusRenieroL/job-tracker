import {
  profileInputSchema,
  type Profile as SharedProfile,
  type ResumeVersion,
} from "@job-tracker/application-options";
import { randomUUID } from "node:crypto";
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { Collection } from "mongodb";
import { requireAuth, type TrackerEnv } from "../auth/require-auth.js";

export type Profile = SharedProfile & { ownerId: string; resumeVersions?: ResumeVersion[] };

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
      const input = profileInputSchema.safeParse(await c.req.json().catch(() => null));
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
