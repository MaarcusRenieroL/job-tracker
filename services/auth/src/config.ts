import { z } from "zod";

const authEnvSchema = z.object({
  HOST: z.string().trim().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3001),
  MONGO_URI: z.string().trim().min(1).default("mongodb://127.0.0.1:27017"),
  AUTH_PRIVATE_KEY_PATH: z.string().trim().min(1).optional(),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(10_000).default(30),
  AUTH_RATE_LIMIT_WINDOW_MS: z.coerce
    .number()
    .int()
    .min(1_000)
    .max(3_600_000)
    .default(60_000),
});

export type AuthConfig = z.infer<typeof authEnvSchema>;

export function loadAuthConfig(
  env: NodeJS.ProcessEnv = process.env,
): AuthConfig {
  return authEnvSchema.parse({
    HOST: env.HOST || undefined,
    PORT: env.PORT || undefined,
    MONGO_URI: env.MONGO_URI || undefined,
    AUTH_PRIVATE_KEY_PATH: env.AUTH_PRIVATE_KEY_PATH?.trim() || undefined,
    AUTH_RATE_LIMIT_MAX: env.AUTH_RATE_LIMIT_MAX || undefined,
    AUTH_RATE_LIMIT_WINDOW_MS: env.AUTH_RATE_LIMIT_WINDOW_MS || undefined,
  });
}
