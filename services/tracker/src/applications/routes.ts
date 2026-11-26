import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { Collection } from "mongodb";
import { requireAuth, type TrackerEnv } from "../auth/require-auth.js";
import {
  handleDelete,
  handleGet,
  handleMatch,
  handleReferralDraft,
} from "./detail-handlers.js";
import { handleCreate, handleImport, handleUpdate } from "./handlers.js";
import {
  handleAgenda,
  handleList,
  handleMissingSkills,
  handleOffers,
} from "./query-handlers.js";
import type { Application } from "./schema.js";

export function createApplicationRoutes(applications: Collection<Application>) {
  const router = new Hono<TrackerEnv>();
  router.use("*", requireAuth, bodyLimit({ maxSize: 1024 * 1024 }));

  return router
    .get("/", (c) => handleList(c, applications))
    .post("/", (c) => handleCreate(c, applications))
    .post("/import", handleImport)
    .get("/agenda", (c) => handleAgenda(c, applications))
    .get("/offers", (c) => handleOffers(c, applications))
    .get("/missing-skills", (c) => handleMissingSkills(c, applications))
    .get("/:id", (c) => handleGet(c, applications, c.req.param("id")))
    .patch("/:id", (c) => handleUpdate(c, applications, c.req.param("id")))
    .delete("/:id", (c) => handleDelete(c, applications, c.req.param("id")))
    .post("/:id/referrals/:referralId/draft", (c) =>
      handleReferralDraft(
        c,
        applications,
        c.req.param("id"),
        c.req.param("referralId"),
      ),
    )
    .get("/:id/match", (c) => handleMatch(c, applications, c.req.param("id")));
}
