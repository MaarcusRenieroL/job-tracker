import type { Context } from "hono";
import type { Collection } from "mongodb";
import type { TrackerEnv } from "../../auth/require-auth.js";
import { explainFit } from "../ai-fit.js";
import { ownerFilter } from "../procedures.js";
import { resumeMatch } from "../resume-match.js";
import type { Application } from "../schema.js";

export async function handleExplain(
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

  if (!application.resumeText || !application.skills?.length) {
    return c.json(
      {
        error: "Add resume text and required skills first",
      },
      400,
    );
  }

  const match = resumeMatch(
    application.skills,
    application.resumeText,
    application,
  );

  try {
    const explanation = await explainFit(application, match);

    if (!explanation) {
      return c.json(
        {
          error: "Set OLLAMA_MODEL and start Ollama to explain job fit",
        },
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
