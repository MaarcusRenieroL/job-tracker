import type { Context } from "hono";
import { z } from "zod";
import type { TrackerEnv } from "../../auth/require-auth.js";
import { extractPosting } from "../extract-posting.js";

const extractRequestSchema = z.strictObject({
  description: z.string().trim().min(20).max(24000),
  role: z.string().trim().max(120).optional(),
});

export async function handleExtractPosting(c: Context<TrackerEnv>) {
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
