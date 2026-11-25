import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { Collection } from "mongodb";
import { requireAuth, type TrackerEnv } from "../auth/require-auth.js";
import { handleCreate, handleUpdate } from "./handlers.js";
import { ownerFilter, resumeMatch } from "./procedures.js";
import { draftReferral } from "./referral-draft.js";
import type { Application } from "./schema.js";

export function createApplicationRoutes(applications: Collection<Application>) {
  const router = new Hono<TrackerEnv>();
  router.use("*", requireAuth, bodyLimit({ maxSize: 1024 * 1024 }));

  return router
    .get("/", async (c) => {
      const rows = await applications
        .find({ ownerId: c.get("ownerId") })
        .sort({ updatedAt: -1 })
        .toArray();
      return c.json({ applications: rows });
    })
    .post("/", (c) => handleCreate(c, applications))
    .get("/missing-skills", async (c) => {
      const rows = applications
        .find({ ownerId: c.get("ownerId"), resumeText: { $exists: true } })
        .project<Pick<Application, "skills" | "resumeText">>({
          skills: 1,
          resumeText: 1,
        });
      const counts = new Map<string, { skill: string; count: number }>();
      for await (const { skills, resumeText } of rows) {
        if (!skills?.length || !resumeText) continue;
        for (const match of resumeMatch(skills, resumeText).matches) {
          if (match.level !== "missing") continue;
          const key = match.skill.toLowerCase();
          const entry = counts.get(key) ?? { skill: match.skill, count: 0 };
          entry.count++;
          counts.set(key, entry);
        }
      }
      return c.json({
        skills: [...counts.values()]
          .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill))
          .slice(0, 10),
      });
    })
    .get("/:id", async (c) => {
      const id = c.req.param("id");
      if (!/^[a-f0-9]{24}$/i.test(id))
        return c.json({ error: "Application not found" }, 404);
      const application = await applications.findOne(
        ownerFilter(c.get("ownerId"), id),
      );
      if (!application) return c.json({ error: "Application not found" }, 404);
      return c.json(application);
    })
    .patch("/:id", async (c) => {
      const id = c.req.param("id");
      if (!/^[a-f0-9]{24}$/i.test(id))
        return c.json({ error: "Application not found" }, 404);
      return handleUpdate(c, applications, id);
    })
    .delete("/:id", async (c) => {
      const id = c.req.param("id");
      if (!/^[a-f0-9]{24}$/i.test(id))
        return c.json({ error: "Application not found" }, 404);
      const result = await applications.deleteOne(
        ownerFilter(c.get("ownerId"), id),
      );
      if (!result.deletedCount)
        return c.json({ error: "Application not found" }, 404);
      return c.body(null, 204);
    })
    .post("/:id/referrals/:referralId/draft", async (c) => {
      const id = c.req.param("id");
      if (!/^[a-f0-9]{24}$/i.test(id))
        return c.json({ error: "Application not found" }, 404);
      const application = await applications.findOne(
        ownerFilter(c.get("ownerId"), id),
      );
      const referral = application?.referrals?.find(
        (item) => item.id === c.req.param("referralId"),
      );
      if (!application || !referral)
        return c.json({ error: "Referral not found" }, 404);
      try {
        const draft = await draftReferral(application, referral);
        if (!draft)
          return c.json(
            {
              error:
                "Set OLLAMA_MODEL and start Ollama to draft referral messages",
            },
            503,
          );
        return c.json({ draft });
      } catch {
        return c.json(
          {
            error:
              "The local model could not draft a message. Check Ollama and try again.",
          },
          502,
        );
      }
    })
    .get("/:id/match", async (c) => {
      const id = c.req.param("id");
      if (!/^[a-f0-9]{24}$/i.test(id))
        return c.json({ error: "Application not found" }, 404);
      const application = await applications.findOne(
        ownerFilter(c.get("ownerId"), id),
      );
      if (!application) return c.json({ error: "Application not found" }, 404);
      if (!application.resumeText || !application.skills?.length) {
        return c.json(
          { error: "Add resume text and required skills first" },
          400,
        );
      }
      return c.json(
        resumeMatch(application.skills, application.resumeText, application),
      );
    });
}
