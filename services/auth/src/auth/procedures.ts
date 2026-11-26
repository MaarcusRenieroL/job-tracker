import { Algorithm, hash, verify } from "@node-rs/argon2";
import { MongoServerError, type Collection } from "mongodb";

export type User = {
  email: string;
  name?: string;
  passwordHash: string;
  createdAt: Date;
};

export async function registerUser(
  users: Collection<User>,
  { email, password, name }: { email: string; password: string; name?: string },
) {
  const passwordHash = await hash(password, { algorithm: Algorithm.Argon2id });

  try {
    const { insertedId } = await users.insertOne({
      email,
      ...(name ? { name } : {}),
      passwordHash,
      createdAt: new Date(),
    });

    return { id: insertedId.toHexString(), email };
  } catch (error) {
    if (error instanceof MongoServerError && error.code === 11000) {
      return null;
    }

    throw error;
  }
}

export async function verifyCredentials(
  users: Collection<User>,
  { email, password }: { email: string; password: string },
) {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await users.findOne({ email: normalizedEmail });

  if (!user || !(await verify(user.passwordHash, password))) {
    return null;
  }

  return { id: user._id.toHexString(), email: user.email };
}
