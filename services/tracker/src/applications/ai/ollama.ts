import { z } from "zod";

export type FetchLike = typeof fetch;

export type AiRuntimeOptions = {
  env?: NodeJS.ProcessEnv;
  fetchImpl?: FetchLike;
};

const chatResponseSchema = z.object({
  message: z.object({
    content: z.string(),
  }),
});

export function getOllamaConfig(env: NodeJS.ProcessEnv = process.env) {
  const model = env.OLLAMA_MODEL?.trim();
  if (!model) return null;
  const baseURL = env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434";
  return { model, baseURL };
}

export async function generatePlainText({
  system,
  user,
  numPredict = 500,
  temperature = 0.2,
  timeoutMs = 45_000,
  maxChars = 4_000,
  env = process.env,
  fetchImpl = fetch,
}: AiRuntimeOptions & {
  system: string;
  user: unknown;
  numPredict?: number;
  temperature?: number;
  timeoutMs?: number;
  maxChars?: number;
}): Promise<string | null> {
  const config = getOllamaConfig(env);
  if (!config) return null;

  const response = await fetchImpl(new URL("/api/chat", config.baseURL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      model: config.model,
      stream: false,
      options: { temperature, num_predict: numPredict },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: typeof user === "string" ? user : JSON.stringify(user),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed with status ${response.status}`);
  }

  const parsed = chatResponseSchema.safeParse(await response.json());
  const text = parsed.success ? parsed.data.message.content.trim() : "";
  if (!text) {
    throw new Error("Invalid model response");
  }

  return text.slice(0, maxChars);
}

export async function generateStructured<TSchema extends z.ZodType>({
  system,
  user,
  schema,
  formatSchema,
  numPredict = 700,
  temperature = 0,
  timeoutMs = 60_000,
  env = process.env,
  fetchImpl = fetch,
}: AiRuntimeOptions & {
  system: string;
  user: unknown;
  schema: TSchema;
  formatSchema?: z.ZodType;
  numPredict?: number;
  temperature?: number;
  timeoutMs?: number;
}): Promise<z.infer<TSchema> | null> {
  const config = getOllamaConfig(env);
  if (!config) return null;

  const response = await fetchImpl(new URL("/api/chat", config.baseURL), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal: AbortSignal.timeout(timeoutMs),
    body: JSON.stringify({
      model: config.model,
      stream: false,
      format: z.toJSONSchema(formatSchema ?? schema),
      options: { temperature, num_predict: numPredict },
      messages: [
        { role: "system", content: system },
        {
          role: "user",
          content: typeof user === "string" ? user : JSON.stringify(user),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Ollama request failed with status ${response.status}`);
  }

  const { message } = chatResponseSchema.parse(await response.json());
  const rawJson: unknown = JSON.parse(message.content);
  return schema.parse(rawJson);
}
