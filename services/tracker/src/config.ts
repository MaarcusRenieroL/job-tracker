import { z } from "zod";

const trackerEnvSchema = z.object({
  HOST: z.string().trim().min(1).default("127.0.0.1"),
  PORT: z.coerce.number().int().min(1).max(65535).default(3002),
  MONGO_URI: z.string().trim().min(1).default("mongodb://127.0.0.1:27017"),
  AUTH_URL: z.url({ protocol: /^https?$/ }).optional(),
  AUTH_PUBLIC_KEY_PATH: z.string().trim().min(1).optional(),
  OLLAMA_BASE_URL: z.url({ protocol: /^https?$/ }).optional(),
  OLLAMA_MODEL: z.string().trim().optional(),
});

export type TrackerConfig = z.infer<typeof trackerEnvSchema>;

export function loadTrackerConfig(
  env: NodeJS.ProcessEnv = process.env,
): TrackerConfig {
  return trackerEnvSchema.parse({
    HOST: env.HOST || undefined,
    PORT: env.PORT || undefined,
    MONGO_URI: env.MONGO_URI || undefined,
    AUTH_URL: env.AUTH_URL?.trim() || undefined,
    AUTH_PUBLIC_KEY_PATH: env.AUTH_PUBLIC_KEY_PATH?.trim() || undefined,
    OLLAMA_BASE_URL: env.OLLAMA_BASE_URL?.trim() || undefined,
    OLLAMA_MODEL: env.OLLAMA_MODEL?.trim() || undefined,
  });
}
