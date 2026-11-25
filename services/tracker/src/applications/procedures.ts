import { ObjectId, type Collection } from "mongodb";
import type { Application, ApplicationInput } from "./schema.js";

export function exactTagFilter(tag: string) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}$`, "i");
}

export function ownerFilter(ownerId: string, id: string) {
  return { ownerId, _id: new ObjectId(id) };
}

export async function createApplication(
  applications: Collection<Application>,
  ownerId: string,
  input: ApplicationInput,
) {
  const now = new Date();
  const stage = input.stage ?? "Saved";
  const document: Application = {
    ...input,
    ownerId,
    stage,
    version: 1,
    createdAt: now,
    updatedAt: now,
    history: [{ to: stage, at: now }],
  };

  if (stage === "Applied")
    document.appliedAt ??= now.toISOString().slice(0, 10);
  const { insertedId } = await applications.insertOne(document);
  return { ...document, _id: insertedId };
}
