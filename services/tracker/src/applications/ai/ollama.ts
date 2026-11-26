import { SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";
import { z } from "zod";

export type FetchLike = typeof fetch;

export type AiRuntimeOptions = {
  env?: NodeJS.ProcessEnv;
  fetchImpl?: FetchLike;
  recordMetric?: (
    operation: string,
    status: "ok" | "error" | "unconfigured",
    durationMs: number,
  ) => void;
};

const chatResponseSchema = z.object({
  message: z.object({
    content: z.string(),
  }),
});

const tracer = trace.getTracer("job-tracker.ai");

export function getOllamaConfig(env: NodeJS.ProcessEnv = process.env) {
  const model = env.OLLAMA_MODEL?.trim();
  if (!model) return null;
  const baseURL = env.OLLAMA_BASE_URL?.trim() || "http://127.0.0.1:11434";
  return { model, baseURL };
}

async function fetchWithRetry(
  url: URL,
  init: RequestInit,
  fetchImpl: FetchLike,
  maxRetries = 1,
): Promise<Response> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetchImpl(url, init);
      if (response.ok || response.status < 500 || attempt === maxRetries) {
        return response;
      }
      lastError = new Error(`Ollama returned HTTP ${response.status}`);
    } catch (error) {
      if (
        attempt === maxRetries ||
        (error instanceof DOMException && error.name === "TimeoutError")
      ) {
        throw error;
      }
      lastError = error;
    }
    const backoffMs = 200 * 2 ** attempt + Math.floor(Math.random() * 100);
    await new Promise((resolve) => setTimeout(resolve, backoffMs));
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Ollama request failed");
}

async function invokeOllamaChat({
  operation,
  system,
  user,
  format,
  numPredict,
  temperature,
  timeoutMs,
  env = process.env,
  fetchImpl = fetch,
  recordMetric,
}: AiRuntimeOptions & {
  operation: string;
  system: string;
  user: unknown;
  format?: Record<string, unknown>;
  numPredict: number;
  temperature: number;
  timeoutMs: number;
}): Promise<string | null> {
  const config = getOllamaConfig(env);
  if (!config) {
    recordMetric?.(operation, "unconfigured", 0);
    return null;
  }

  const endpoint = new URL("/api/chat", config.baseURL);
  const startedAt = performance.now();

  return tracer.startActiveSpan(
    `ollama.${operation}`,
    {
      kind: SpanKind.CLIENT,
      attributes: {
        "ai.system": "ollama",
        "ai.operation": operation,
        "ai.model": config.model,
        "server.address": endpoint.hostname,
      },
    },
    async (span) => {
      try {
        const response = await fetchWithRetry(
          endpoint,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(timeoutMs),
            body: JSON.stringify({
              model: config.model,
              stream: false,
              ...(format ? { format } : {}),
              options: { temperature, num_predict: numPredict },
              messages: [
                { role: "system", content: system },
                {
                  role: "user",
                  content:
                    typeof user === "string" ? user : JSON.stringify(user),
                },
              ],
            }),
          },
          fetchImpl,
        );

        span.setAttribute("http.response.status_code", response.status);
        if (!response.ok) {
          throw new Error(`Ollama request failed with status ${response.status}`);
        }

        const parsed = chatResponseSchema.safeParse(await response.json());
        const content = parsed.success ? parsed.data.message.content.trim() : "";
        if (!content) {
          throw new Error("Invalid model response");
        }

        recordMetric?.(operation, "ok", performance.now() - startedAt);
        return content;
      } catch (error) {
        recordMetric?.(operation, "error", performance.now() - startedAt);
        span.recordException(error as Error);
        span.setStatus({
          code: SpanStatusCode.ERROR,
          message: error instanceof Error ? error.message : "Ollama failed",
        });
        throw error;
      } finally {
        span.end();
      }
    },
  );
}

export async function generatePlainText({
  operation = "plain_text",
  system,
  user,
  numPredict = 500,
  temperature = 0.2,
  timeoutMs = 45_000,
  maxChars = 4_000,
  env,
  fetchImpl,
  recordMetric,
}: AiRuntimeOptions & {
  operation?: string;
  system: string;
  user: unknown;
  numPredict?: number;
  temperature?: number;
  timeoutMs?: number;
  maxChars?: number;
}): Promise<string | null> {
  const content = await invokeOllamaChat({
    operation,
    system,
    user,
    numPredict,
    temperature,
    timeoutMs,
    env,
    fetchImpl,
    recordMetric,
  });
  return content === null ? null : content.slice(0, maxChars);
}

export async function generateStructured<TSchema extends z.ZodType>({
  operation = "structured",
  system,
  user,
  schema,
  formatSchema,
  numPredict = 700,
  temperature = 0,
  timeoutMs = 60_000,
  env,
  fetchImpl,
  recordMetric,
}: AiRuntimeOptions & {
  operation?: string;
  system: string;
  user: unknown;
  schema: TSchema;
  formatSchema?: z.ZodType;
  numPredict?: number;
  temperature?: number;
  timeoutMs?: number;
}): Promise<z.infer<TSchema> | null> {
  const content = await invokeOllamaChat({
    operation,
    system,
    user,
    format: z.toJSONSchema(formatSchema ?? schema) as Record<string, unknown>,
    numPredict,
    temperature,
    timeoutMs,
    env,
    fetchImpl,
    recordMetric,
  });
  if (content === null) return null;
  const rawJson: unknown = JSON.parse(content);
  return schema.parse(rawJson);
}
