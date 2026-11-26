import { AppError } from "@job-tracker/observability";
import type { Context } from "hono";
import { z } from "zod";
import type { TrackerEnv } from "../../auth/require-auth.js";
import { extractPosting, type AiRuntimeOptions } from "../ai/index.js";
import { ImportError, importPosting } from "../import-posting.js";

const importRequestSchema = z.strictObject({
  url: z.url({ protocol: /^https?$/ }).max(2048),
});

const extractRequestSchema = z.strictObject({
  description: z.string().trim().min(20).max(24000),
  role: z.string().trim().max(120).optional(),
});

export async function handleImport(c: Context<TrackerEnv>) {
  const input = importRequestSchema.safeParse(
    await c.req.json().catch(() => null),
  );
  if (!input.success) {
    throw new AppError({
      message: "Enter a valid HTTP or HTTPS job URL.",
      status: 400,
      code: "VALIDATION_ERROR",
      issues: input.error.issues,
    });
  }
  try {
    return c.json(await importPosting(input.data.url));
  } catch (error) {
    if (error instanceof ImportError) {
      throw new AppError({
        message: error.message,
        status: 422,
        code: "UNPROCESSABLE_ENTITY",
        cause: error,
      });
    }
    throw error;
  }
}

export async function handleExtractPosting(
  c: Context<TrackerEnv>,
  aiOptions?: AiRuntimeOptions,
) {
  const input = extractRequestSchema.safeParse(
    await c.req.json().catch(() => null),
  );
  if (!input.success) {
    throw new AppError({
      message:
        "Paste at least a short job description (20+ characters) to extract suggestions.",
      status: 400,
      code: "VALIDATION_ERROR",
      issues: input.error.issues,
    });
  }

  let suggestions;
  try {
    suggestions = await extractPosting(
      input.data.description,
      input.data.role,
      aiOptions,
    );
  } catch (cause) {
    throw new AppError({
      message:
        "The local model could not extract posting details. Check Ollama and try again.",
      status: 502,
      code: "AI_UPSTREAM_ERROR",
      cause,
    });
  }

  if (!suggestions) {
    throw new AppError({
      message:
        "Set OLLAMA_MODEL and start Ollama to extract job posting suggestions.",
      status: 503,
      code: "AI_UNAVAILABLE",
    });
  }

  return c.json({ suggestions });
}
