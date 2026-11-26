import { AppError } from "@job-tracker/observability";
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

async function runAiAction<T>(
  action: () => Promise<T | null>,
  unavailableMessage: string,
  upstreamErrorMessage: string,
): Promise<T> {
  let result: T | null;
  try {
    result = await action();
  } catch (cause) {
    throw new AppError({
      message: upstreamErrorMessage,
      status: 502,
      code: "AI_UPSTREAM_ERROR",
      cause,
    });
  }
  if (result === null) {
    throw new AppError({
      message: unavailableMessage,
      status: 503,
      code: "AI_UNAVAILABLE",
    });
  }
  return result;
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
  if (!application) {
    throw new AppError({
      message: "Application not found",
      status: 404,
      code: "NOT_FOUND",
    });
  }

  if (!application.resumeText || !application.skills?.length) {
    throw new AppError({
      message: "Add resume text and required skills first",
      status: 400,
      code: "VALIDATION_ERROR",
    });
  }

  const match = resumeMatch(
    application.skills,
    application.resumeText,
    application,
  );

  const explanation = await runAiAction(
    () => explainFit(application, match, aiOptions),
    "Set OLLAMA_MODEL and start Ollama to explain job fit",
    "The local model could not explain job fit. Check Ollama and try again.",
  );

  return c.json({ match, explanation });
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
  if (!application) {
    throw new AppError({
      message: "Application not found",
      status: 404,
      code: "NOT_FOUND",
    });
  }

  const hasPostingFacts = Boolean(
    application.description?.trim() ||
      application.skills?.length ||
      application.responsibilities?.length,
  );
  if (!hasPostingFacts) {
    throw new AppError({
      message:
        "Save a job description, required skills, or responsibilities first to generate interview prep.",
      status: 400,
      code: "VALIDATION_ERROR",
    });
  }

  const prep = await runAiAction(
    () => generateInterviewPrep(application, aiOptions),
    "Set OLLAMA_MODEL and start Ollama to generate interview prep.",
    "The local model could not generate interview prep. Check Ollama and try again.",
  );

  return c.json({ prep });
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
    throw new AppError({
      message: "Referral not found",
      status: 404,
      code: "NOT_FOUND",
    });
  }

  const draft = await runAiAction(
    () =>
      draftReferral(application, referral, {
        ...aiOptions,
        candidateName: profile?.name,
      }),
    "Set OLLAMA_MODEL and start Ollama to draft referral messages",
    "The local model could not draft a message. Check Ollama and try again.",
  );

  return c.json({ draft });
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
  if (!application) {
    throw new AppError({
      message: "Application not found",
      status: 404,
      code: "NOT_FOUND",
    });
  }

  const resumeText = application.resumeText || profile?.resumeText;
  const hasPostingDetails = Boolean(
    application.description?.trim() ||
      application.skills?.length ||
      application.responsibilities?.length,
  );

  if (!resumeText?.trim() || !hasPostingDetails) {
    throw new AppError({
      message:
        "Save resume text and job description or required skills first to draft a cover letter.",
      status: 400,
      code: "VALIDATION_ERROR",
    });
  }

  const draft = await runAiAction(
    () =>
      draftCoverLetter(
        application,
        {
          name: profile?.name,
          resumeText: profile?.resumeText,
        },
        aiOptions,
      ),
    "Set OLLAMA_MODEL and start Ollama to draft cover letters.",
    "The local model could not draft a cover letter. Check Ollama and try again.",
  );

  return c.json({ draft });
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
    throw new AppError({
      message: "Invalid follow-up options",
      status: 400,
      code: "VALIDATION_ERROR",
      issues: parsedBody.error.issues,
    });
  }

  const { application, profile } = await findApplicationWithProfile(
    applications,
    profiles,
    c.get("ownerId"),
    id,
  );
  if (!application) {
    throw new AppError({
      message: "Application not found",
      status: 404,
      code: "NOT_FOUND",
    });
  }

  const draft = await runAiAction(
    () =>
      draftFollowUp(
        application,
        {
          name: profile?.name,
          resumeText: profile?.resumeText,
        },
        parsedBody.data,
        aiOptions,
      ),
    "Set OLLAMA_MODEL and start Ollama to draft follow-up messages.",
    "The local model could not draft a follow-up message. Check Ollama and try again.",
  );

  return c.json({ draft });
}
