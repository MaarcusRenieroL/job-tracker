import { Algorithm, hash } from "@node-rs/argon2";
import { MongoServerError, type Collection } from "mongodb";

export type User = {
  email: string;
  passwordHash: string;
  createdAt: Date;
};

export async function registerUser(
  users: Collection<User>,
  { email, password }: { email: string; password: string },
) {
  const passwordHash = await hash(password, { algorithm: Algorithm.Argon2id });

  try {
    const { insertedId } = await users.insertOne({
      email,
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
