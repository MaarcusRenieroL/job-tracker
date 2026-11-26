import type { Context } from "hono";
import type { Collection } from "mongodb";
import type { TrackerEnv } from "../../auth/require-auth.js";
import type { Profile } from "../../profile/routes.js";
import { ownerFilter } from "../procedures.js";
import { draftReferral } from "../referral-draft.js";
import { resumeMatch } from "../resume-match.js";
import type { Application } from "../schema.js";

export async function handleGet(
  c: Context<TrackerEnv>,
  applications: Collection<Application>,
  id: string,
) {
  if (!/^[a-f0-9]{24}$/i.test(id))
    return c.json({ error: "Application not found" }, 404);
  const application = await applications.findOne(
    ownerFilter(c.get("ownerId"), id),
  );
  if (!application) return c.json({ error: "Application not found" }, 404);
  return c.json(application);
}

export async function handleDelete(
  c: Context<TrackerEnv>,
  applications: Collection<Application>,
  id: string,
) {
  if (!/^[a-f0-9]{24}$/i.test(id))
    return c.json({ error: "Application not found" }, 404);
  const result = await applications.deleteOne(
    ownerFilter(c.get("ownerId"), id),
  );
  if (!result.deletedCount)
    return c.json({ error: "Application not found" }, 404);
  return c.body(null, 204);
}

export async function handleReferralDraft(
  c: Context<TrackerEnv>,
  applications: Collection<Application>,
  profiles: Collection<Profile> | undefined,
  id: string,
  referralId: string,
) {
  if (!/^[a-f0-9]{24}$/i.test(id))
    return c.json({ error: "Application not found" }, 404);
  const ownerId = c.get("ownerId");
  const [application, profile] = await Promise.all([
    applications.findOne(ownerFilter(ownerId, id)),
    profiles?.findOne({ ownerId }),
  ]);
  const referral = application?.referrals?.find((item) => item.id === referralId);
  if (!application || !referral)
    return c.json({ error: "Referral not found" }, 404);
  try {
    const draft = await draftReferral(application, referral, {
      candidateName: profile?.name,
    });
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
}

export async function handleMatch(
  c: Context<TrackerEnv>,
  applications: Collection<Application>,
  id: string,
) {
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
}
