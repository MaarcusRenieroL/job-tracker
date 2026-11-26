import type { ApplicationUpdateInput } from "@job-tracker/application-options";
import { ObjectId, type Collection } from "mongodb";
import {
  formattedApplicationFields,
  type Application,
  type ApplicationInput,
} from "./schema.js";

const OBJECT_ID_PATTERN = /^[a-f0-9]{24}$/i;

export function isValidObjectId(id: string) {
  return OBJECT_ID_PATTERN.test(id);
}

export function exactTagFilter(tag: string) {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^${escaped}$`, "i");
}

export function ownerFilter(ownerId: string, id: string) {
  return { ownerId, _id: new ObjectId(id) };
}

export async function findOwnedApplication(
  applications: Collection<Application>,
  ownerId: string,
  id: string,
) {
  if (!isValidObjectId(id)) return null;
  return applications.findOne(ownerFilter(ownerId, id));
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

  if (stage === "Applied") {
    document.appliedAt ??= now.toISOString().slice(0, 10);
  }
  const { insertedId } = await applications.insertOne(document);
  return { ...document, _id: insertedId };
}

export type UpdateApplicationResult =
  | { status: "not_found" }
  | { status: "conflict" }
  | { status: "updated"; application: Application };

export async function updateOwnedApplication(
  applications: Collection<Application>,
  ownerId: string,
  id: string,
  data: ApplicationUpdateInput,
): Promise<UpdateApplicationResult> {
  if (!isValidObjectId(id)) return { status: "not_found" };

  const filter = ownerFilter(ownerId, id);
  const current = await applications.findOne(filter);
  if (!current) return { status: "not_found" };

  const { version, clear = [], clearOffer, ...fields } = data;
  if (current.version !== version) return { status: "conflict" };

  const now = new Date();
  const transition =
    fields.stage && fields.stage !== current.stage
      ? { from: current.stage, to: fields.stage, at: now }
      : undefined;

  if (fields.stage === "Applied" && !current.appliedAt) {
    fields.appliedAt ??= now.toISOString().slice(0, 10);
  }

  const unset: Record<string, ""> = Object.fromEntries(
    clear.filter((key) => !(key in fields)).map((key) => [key, "" as const]),
  );

  for (const key of formattedApplicationFields) {
    const htmlKey = `${key}Html` as const;
    const textChanged = key in fields && fields[key] !== current[key];
    if ((textChanged || key in unset) && !(htmlKey in fields)) {
      unset[htmlKey] = "";
    }
  }

  if (clearOffer && !fields.offer) {
    unset.offer = "";
  }

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

  if (!updated) return { status: "conflict" };
  return { status: "updated", application: updated };
}
