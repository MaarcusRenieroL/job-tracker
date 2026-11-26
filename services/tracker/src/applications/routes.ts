import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { Collection } from "mongodb";
import { requireAuth, type TrackerEnv } from "../auth/require-auth.js";
import type { Profile } from "../profile/routes.js";
import {
  handleDelete,
  handleGet,
  handleMatch,
  handleReferralDraft,
} from "./handlers/details.js";
import {
  handleCoverLetterDraft,
  handleFollowUpDraft,
} from "./handlers/drafts.js";
import { handleExplain } from "./handlers/explain.js";
import { handleExtractPosting } from "./handlers/extract.js";
import { handleInterviewPrep } from "./handlers/interview-prep.js";
import {
  handleAgenda,
  handleList,
  handleMissingSkills,
  handleOffers,
} from "./handlers/queries.js";
import {
  handleCreate,
  handleImport,
  handleUpdate,
} from "./handlers/write-and-import.js";
import type { Application } from "./schema.js";

export function createApplicationRoutes(
  applications: Collection<Application>,
  profiles?: Collection<Profile>,
) {
  const router = new Hono<TrackerEnv>();
  router.use("*", requireAuth, bodyLimit({ maxSize: 1024 * 1024 }));

  return router
    .get("/", (c) => handleList(c, applications))
    .post("/", (c) => handleCreate(c, applications))
    .post("/import", handleImport)
    .post("/extract", handleExtractPosting)
    .get("/agenda", (c) => handleAgenda(c, applications))
    .get("/offers", (c) => handleOffers(c, applications))
    .get("/missing-skills", (c) => handleMissingSkills(c, applications))
    .get("/:id", (c) => handleGet(c, applications, c.req.param("id")))
    .patch("/:id", (c) => handleUpdate(c, applications, c.req.param("id")))
    .delete("/:id", (c) => handleDelete(c, applications, c.req.param("id")))
    .get("/:id/match", (c) => handleMatch(c, applications, c.req.param("id")))
    .post("/:id/match/explain", (c) =>
      handleExplain(c, applications, c.req.param("id")),
    )
    .post("/:id/interview-prep", (c) =>
      handleInterviewPrep(c, applications, c.req.param("id")),
    )
    .post("/:id/cover-letter/draft", (c) =>
      handleCoverLetterDraft(c, applications, profiles, c.req.param("id")),
    )
    .post("/:id/follow-up/draft", (c) =>
      handleFollowUpDraft(c, applications, profiles, c.req.param("id")),
    )
    .post("/:id/referrals/:referralId/draft", (c) =>
      handleReferralDraft(
        c,
        applications,
        profiles,
        c.req.param("id"),
        c.req.param("referralId"),
      ),
    );
}
