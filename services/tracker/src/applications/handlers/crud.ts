import type { Context } from "hono";
import type { Collection } from "mongodb";
import type { TrackerEnv } from "../../auth/require-auth.js";
import {
  createApplication,
  findOwnedApplication,
  isValidObjectId,
  ownerFilter,
  updateOwnedApplication,
} from "../procedures.js";
import { applicationSchema, updateSchema, type Application } from "../schema.js";

type ApplicationContext = Context<TrackerEnv>;

export async function handleGet(
  c: ApplicationContext,
  applications: Collection<Application>,
  id: string,
) {
  const application = await findOwnedApplication(
    applications,
    c.get("ownerId"),
    id,
  );
  if (!application) return c.json({ error: "Application not found" }, 404);
  return c.json(application);
}

export async function handleCreate(
  c: ApplicationContext,
  applications: Collection<Application>,
) {
  const input = applicationSchema.safeParse(
    await c.req.json().catch(() => null),
  );
  if (!input.success) {
    return c.json(
      { error: "Invalid application", issues: input.error.issues },
      400,
    );
  }
  return c.json(
    await createApplication(applications, c.get("ownerId"), input.data),
    201,
  );
}

export async function handleUpdate(
  c: ApplicationContext,
  applications: Collection<Application>,
  id: string,
) {
  if (!isValidObjectId(id)) {
    return c.json({ error: "Application not found" }, 404);
  }

  const input = updateSchema.safeParse(await c.req.json().catch(() => null));
  if (!input.success) {
    return c.json(
      { error: "Invalid application update", issues: input.error.issues },
      400,
    );
  }

  const result = await updateOwnedApplication(
    applications,
    c.get("ownerId"),
    id,
    input.data,
  );

  if (result.status === "not_found") {
    return c.json({ error: "Application not found" }, 404);
  }
  if (result.status === "conflict") {
    return c.json(
      { error: "Application changed. Refresh and try again." },
      409,
    );
  }

  return c.json(result.application);
}

export async function handleDelete(
  c: ApplicationContext,
  applications: Collection<Application>,
  id: string,
) {
  if (!isValidObjectId(id)) {
    return c.json({ error: "Application not found" }, 404);
  }
  const result = await applications.deleteOne(
    ownerFilter(c.get("ownerId"), id),
  );
  if (!result.deletedCount) {
    return c.json({ error: "Application not found" }, 404);
  }
  return c.body(null, 204);
}
