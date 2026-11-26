import { Hono, type MiddlewareHandler } from "hono";
import { bodyLimit } from "hono/body-limit";
import type { Collection } from "mongodb";
import { requireAuth, type TrackerEnv } from "../auth/require-auth.js";
import type { Profile } from "../profile/routes.js";
import type { AiRuntimeOptions } from "./ai/index.js";
import {
  handleCoverLetterDraft,
  handleExplain,
  handleFollowUpDraft,
  handleInterviewPrep,
  handleReferralDraft,
} from "./handlers/ai.js";
import {
  handleCreate,
  handleDelete,
  handleGet,
  handleUpdate,
} from "./handlers/crud.js";
import {
  handleExtractPosting,
  handleImport,
} from "./handlers/import-and-extract.js";
import {
  handleAgenda,
  handleList,
  handleMatch,
  handleMissingSkills,
  handleOffers,
} from "./handlers/queries.js";
import type { Application } from "./schema.js";

export type ApplicationRoutesOptions = {
  profiles?: Collection<Profile>;
  authMiddleware?: MiddlewareHandler<TrackerEnv>;
  aiOptions?: AiRuntimeOptions;
};

export function createApplicationRoutes(
  applications: Collection<Application>,
  options: ApplicationRoutesOptions = {},
) {
  const { profiles, authMiddleware = requireAuth, aiOptions } = options;
  const router = new Hono<TrackerEnv>();
  router.use("*", authMiddleware, bodyLimit({ maxSize: 1024 * 1024 }));

  return router
    .get("/", (c) => handleList(c, applications))
    .post("/", (c) => handleCreate(c, applications))
    .post("/import", handleImport)
    .post("/extract", (c) => handleExtractPosting(c, aiOptions))
    .get("/agenda", (c) => handleAgenda(c, applications))
    .get("/offers", (c) => handleOffers(c, applications))
    .get("/missing-skills", (c) => handleMissingSkills(c, applications))
    .get("/:id", (c) => handleGet(c, applications, c.req.param("id")))
    .patch("/:id", (c) => handleUpdate(c, applications, c.req.param("id")))
    .delete("/:id", (c) => handleDelete(c, applications, c.req.param("id")))
    .get("/:id/match", (c) => handleMatch(c, applications, c.req.param("id")))
    .post("/:id/match/explain", (c) =>
      handleExplain(c, applications, c.req.param("id"), aiOptions),
    )
    .post("/:id/interview-prep", (c) =>
      handleInterviewPrep(c, applications, c.req.param("id"), aiOptions),
    )
    .post("/:id/cover-letter/draft", (c) =>
      handleCoverLetterDraft(
        c,
        applications,
        profiles,
        c.req.param("id"),
        aiOptions,
      ),
    )
    .post("/:id/follow-up/draft", (c) =>
      handleFollowUpDraft(
        c,
        applications,
        profiles,
        c.req.param("id"),
        aiOptions,
      ),
    )
    .post("/:id/referrals/:referralId/draft", (c) =>
      handleReferralDraft(
        c,
        applications,
        profiles,
        c.req.param("id"),
        c.req.param("referralId"),
        aiOptions,
      ),
    );
}
