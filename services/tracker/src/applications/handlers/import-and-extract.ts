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
    return c.json({ error: "Enter a valid HTTP or HTTPS job URL." }, 400);
  }
  try {
    return c.json(await importPosting(input.data.url));
  } catch (error) {
    if (error instanceof ImportError) {
      return c.json({ error: error.message }, 422);
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
    return c.json(
      {
        error:
          "Paste at least a short job description (20+ characters) to extract suggestions.",
        issues: input.error.issues,
      },
      400,
    );
  }

  try {
    const suggestions = await extractPosting(
      input.data.description,
      input.data.role,
      aiOptions,
    );
    if (!suggestions) {
      return c.json(
        {
          error:
            "Set OLLAMA_MODEL and start Ollama to extract job posting suggestions.",
        },
        503,
      );
    }
    return c.json({ suggestions });
  } catch {
    return c.json(
      {
        error:
          "The local model could not extract posting details. Check Ollama and try again.",
      },
      502,
    );
  }
}
