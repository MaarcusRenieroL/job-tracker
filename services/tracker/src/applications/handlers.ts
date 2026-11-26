import type { Context } from "hono";
import type { Collection } from "mongodb";
import { z } from "zod";
import { importPosting, ImportError } from "./import-posting.js";
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
  if (!/^[a-f0-9]{24}$/i.test(id))
    return c.json({ error: "Application not found" }, 404);
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

export async function handleImport(c: ApplicationContext) {
  const input = z
    .strictObject({ url: z.url({ protocol: /^https?$/ }).max(2048) })
    .safeParse(await c.req.json().catch(() => null));
  if (!input.success)
    return c.json({ error: "Enter a valid HTTP or HTTPS job URL." }, 400);
  try {
    return c.json(await importPosting(input.data.url));
  } catch (error) {
    if (error instanceof ImportError)
      return c.json({ error: error.message }, 422);
    throw error;
  }
}
