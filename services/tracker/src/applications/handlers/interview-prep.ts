import type { Context } from "hono";
import type { Collection } from "mongodb";
import type { TrackerEnv } from "../../auth/require-auth.js";
import { generateInterviewPrep } from "../interview-prep.js";
import { ownerFilter } from "../procedures.js";
import type { Application } from "../schema.js";

export async function handleInterviewPrep(
  c: Context<TrackerEnv>,
  applications: Collection<Application>,
  id: string,
) {
  if (!/^[a-f0-9]{24}$/i.test(id)) {
    return c.json({ error: "Application not found" }, 404);
  }

  const application = await applications.findOne(
    ownerFilter(c.get("ownerId"), id),
  );
  if (!application) {
    return c.json({ error: "Application not found" }, 404);
  }

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
    const prep = await generateInterviewPrep(application);
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
