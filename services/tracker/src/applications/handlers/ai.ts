import type { Context } from "hono";
import type { Collection } from "mongodb";
import { z } from "zod";
import type { TrackerEnv } from "../../auth/require-auth.js";
import type { Profile } from "../../profile/routes.js";
import {
  draftCoverLetter,
  draftFollowUp,
  draftReferral,
  explainFit,
  generateInterviewPrep,
  type AiRuntimeOptions,
} from "../ai/index.js";
import { findOwnedApplication } from "../procedures.js";
import { resumeMatch } from "../resume-match.js";
import type { Application } from "../schema.js";

const followUpRequestSchema = z.strictObject({
  recipient: z.string().trim().max(160).optional(),
  note: z.string().trim().max(500).optional(),
});

async function findApplicationWithProfile(
  applications: Collection<Application>,
  profiles: Collection<Profile> | undefined,
  ownerId: string,
  id: string,
) {
  const [application, profile] = await Promise.all([
    findOwnedApplication(applications, ownerId, id),
    profiles?.findOne({ ownerId }),
  ]);
  return { application, profile };
}

export async function handleExplain(
  c: Context<TrackerEnv>,
  applications: Collection<Application>,
  id: string,
  aiOptions?: AiRuntimeOptions,
) {
  const application = await findOwnedApplication(
    applications,
    c.get("ownerId"),
    id,
  );
  if (!application) return c.json({ error: "Application not found" }, 404);

  if (!application.resumeText || !application.skills?.length) {
    return c.json({ error: "Add resume text and required skills first" }, 400);
  }

  const match = resumeMatch(
    application.skills,
    application.resumeText,
    application,
  );

  try {
    const explanation = await explainFit(application, match, aiOptions);
    if (!explanation) {
      return c.json(
        { error: "Set OLLAMA_MODEL and start Ollama to explain job fit" },
        503,
      );
    }
    return c.json({ match, explanation });
  } catch {
    return c.json(
      {
        error:
          "The local model could not explain job fit. Check Ollama and try again.",
      },
      502,
    );
  }
}

export async function handleInterviewPrep(
  c: Context<TrackerEnv>,
  applications: Collection<Application>,
  id: string,
  aiOptions?: AiRuntimeOptions,
) {
  const application = await findOwnedApplication(
    applications,
    c.get("ownerId"),
    id,
  );
  if (!application) return c.json({ error: "Application not found" }, 404);

  const hasPostingFacts = Boolean(
    application.description?.trim() ||
      application.skills?.length ||
      application.responsibilities?.length,
  );
  if (!hasPostingFacts) {
    return c.json(
      {
        error:
          "Save a job description, required skills, or responsibilities first to generate interview prep.",
      },
      400,
    );
  }

  try {
    const prep = await generateInterviewPrep(application, aiOptions);
    if (!prep) {
      return c.json(
        {
          error:
            "Set OLLAMA_MODEL and start Ollama to generate interview prep.",
        },
        503,
      );
    }
    return c.json({ prep });
  } catch {
    return c.json(
      {
        error:
          "The local model could not generate interview prep. Check Ollama and try again.",
      },
      502,
    );
  }
}

export async function handleReferralDraft(
  c: Context<TrackerEnv>,
  applications: Collection<Application>,
  profiles: Collection<Profile> | undefined,
  id: string,
  referralId: string,
  aiOptions?: AiRuntimeOptions,
) {
  const { application, profile } = await findApplicationWithProfile(
    applications,
    profiles,
    c.get("ownerId"),
    id,
  );
  const referral = application?.referrals?.find(
    (item) => item.id === referralId,
  );
  if (!application || !referral) {
    return c.json({ error: "Referral not found" }, 404);
  }

  try {
    const draft = await draftReferral(application, referral, {
      ...aiOptions,
      candidateName: profile?.name,
    });
    if (!draft) {
      return c.json(
        {
          error:
            "Set OLLAMA_MODEL and start Ollama to draft referral messages",
        },
        503,
      );
    }
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

export async function handleCoverLetterDraft(
  c: Context<TrackerEnv>,
  applications: Collection<Application>,
  profiles: Collection<Profile> | undefined,
  id: string,
  aiOptions?: AiRuntimeOptions,
) {
  const { application, profile } = await findApplicationWithProfile(
    applications,
    profiles,
    c.get("ownerId"),
    id,
  );
  if (!application) return c.json({ error: "Application not found" }, 404);

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
    const draft = await draftCoverLetter(
      application,
      {
        name: profile?.name,
        resumeText: profile?.resumeText,
      },
      aiOptions,
    );
    if (!draft) {
      return c.json(
        { error: "Set OLLAMA_MODEL and start Ollama to draft cover letters." },
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
  aiOptions?: AiRuntimeOptions,
) {
  const rawBody = await c.req.json().catch(() => ({}));
  const parsedBody = followUpRequestSchema.safeParse(rawBody ?? {});
  if (!parsedBody.success) {
    return c.json(
      { error: "Invalid follow-up options", issues: parsedBody.error.issues },
      400,
    );
  }

  const { application, profile } = await findApplicationWithProfile(
    applications,
    profiles,
    c.get("ownerId"),
    id,
  );
  if (!application) return c.json({ error: "Application not found" }, 404);

  try {
    const draft = await draftFollowUp(
      application,
      {
        name: profile?.name,
        resumeText: profile?.resumeText,
      },
      parsedBody.data,
      aiOptions,
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
