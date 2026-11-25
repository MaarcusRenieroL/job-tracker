import type { Context } from "hono";
import type { Collection } from "mongodb";
import type { TrackerEnv } from "../auth/require-auth.js";
import { applicationSchema, updateSchema, type Application } from "./schema.js";
import { createApplication, ownerFilter } from "./procedures.js";

type ApplicationContext = Context<TrackerEnv>;

export async function handleCreate(
  c: ApplicationContext,
  applications: Collection<Application>,
) {
  const input = applicationSchema.safeParse(
    await c.req.json().catch(() => null),
  );
  if (!input.success)
    return c.json(
      { error: "Invalid application", issues: input.error.issues },
      400,
    );
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
  const input = updateSchema.safeParse(await c.req.json().catch(() => null));
  if (!input.success)
    return c.json(
      { error: "Invalid application update", issues: input.error.issues },
      400,
    );

  const filter = ownerFilter(c.get("ownerId"), id);
  const current = await applications.findOne(filter);
  if (!current) return c.json({ error: "Application not found" }, 404);
  const { version, clear = [], clearOffer, ...fields } = input.data;
  if (current.version !== version)
    return c.json(
      { error: "Application changed. Refresh and try again." },
      409,
    );
  const now = new Date();
  const transition =
    fields.stage && fields.stage !== current.stage
      ? { from: current.stage, to: fields.stage, at: now }
      : undefined;

  if (fields.stage === "Applied" && !current.appliedAt)
    fields.appliedAt ??= now.toISOString().slice(0, 10);
  const unset: Record<string, ""> = Object.fromEntries(
    clear.filter((key) => !(key in fields)).map((key) => [key, "" as const]),
  );
  if (clearOffer && !fields.offer) unset.offer = "";
  const updated = await applications.findOneAndUpdate(
    { ...filter, version },
    {
      $set: { ...fields, updatedAt: now },
      $inc: { version: 1 },
      ...(Object.keys(unset).length ? { $unset: unset } : {}),
      ...(transition ? { $push: { history: transition } } : {}),
    },
    { returnDocument: "after" },
  );

  if (!updated)
    return c.json(
      { error: "Application changed. Refresh and try again." },
      409,
    );
  return c.json(updated);
}
