import type { Context } from "hono";
import type { Collection } from "mongodb";
import { z } from "zod";
import type { TrackerEnv } from "../../auth/require-auth.js";
import type { Profile } from "../../profile/routes.js";
import { draftCoverLetter, draftFollowUp } from "../outreach-drafts.js";
import { ownerFilter } from "../procedures.js";
import type { Application } from "../schema.js";

const followUpRequestSchema = z.strictObject({
  recipient: z.string().trim().max(160).optional(),
  note: z.string().trim().max(500).optional(),
});

export async function handleCoverLetterDraft(
  c: Context<TrackerEnv>,
  applications: Collection<Application>,
  profiles: Collection<Profile> | undefined,
  id: string,
) {
  if (!/^[a-f0-9]{24}$/i.test(id)) {
    return c.json({ error: "Application not found" }, 404);
  }

  const ownerId = c.get("ownerId");
  const [application, profile] = await Promise.all([
    applications.findOne(ownerFilter(ownerId, id)),
    profiles?.findOne({ ownerId }),
  ]);

  if (!application) {
    return c.json({ error: "Application not found" }, 404);
  }

  const resumeText = application.resumeText || profile?.resumeText;
  const hasPostingDetails = Boolean(
    application.description?.trim() ||
      application.skills?.length ||
      application.responsibilities?.length,
  );

  if (!resumeText?.trim() || !hasPostingDetails) {
    return c.json(
      {
        error:
          "Save resume text and job description or required skills first to draft a cover letter.",
      },
      400,
    );
  }

  try {
    const draft = await draftCoverLetter(application, {
      name: profile?.name,
      resumeText: profile?.resumeText,
    });
    if (!draft) {
      return c.json(
        {
          error: "Set OLLAMA_MODEL and start Ollama to draft cover letters.",
        },
        503,
      );
    }
    return c.json({ draft });
  } catch {
    return c.json(
      {
        error:
          "The local model could not draft a cover letter. Check Ollama and try again.",
      },
      502,
    );
  }
}

export async function handleFollowUpDraft(
  c: Context<TrackerEnv>,
  applications: Collection<Application>,
  profiles: Collection<Profile> | undefined,
  id: string,
) {
  if (!/^[a-f0-9]{24}$/i.test(id)) {
    return c.json({ error: "Application not found" }, 404);
  }

  const rawBody = await c.req.json().catch(() => ({}));
  const parsedBody = followUpRequestSchema.safeParse(rawBody ?? {});
  if (!parsedBody.success) {
    return c.json(
      { error: "Invalid follow-up options", issues: parsedBody.error.issues },
      400,
    );
  }

  const ownerId = c.get("ownerId");
  const [application, profile] = await Promise.all([
    applications.findOne(ownerFilter(ownerId, id)),
    profiles?.findOne({ ownerId }),
  ]);

  if (!application) {
    return c.json({ error: "Application not found" }, 404);
  }

  try {
    const draft = await draftFollowUp(
      application,
      {
        name: profile?.name,
        resumeText: profile?.resumeText,
      },
      parsedBody.data,
    );
    if (!draft) {
      return c.json(
        {
          error:
            "Set OLLAMA_MODEL and start Ollama to draft follow-up messages.",
        },
        503,
      );
    }
    return c.json({ draft });
  } catch {
    return c.json(
      {
        error:
          "The local model could not draft a follow-up message. Check Ollama and try again.",
      },
      502,
    );
  }
}
