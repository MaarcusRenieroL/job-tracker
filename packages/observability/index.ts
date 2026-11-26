import { randomUUID } from "node:crypto";
import {
  propagation,
  ROOT_CONTEXT,
  SpanKind,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";
import { Counter, Histogram, Registry } from "@prometheus-io/client";
import type { Context, Hono } from "hono";
import { routePath } from "hono/route";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "UNPROCESSABLE_ENTITY"
  | "AI_UNAVAILABLE"
  | "AI_UPSTREAM_ERROR"
  | "INTERNAL_ERROR";

export class AppError extends Error {
  readonly status: ContentfulStatusCode;
  readonly code: ErrorCode;
  readonly issues?: unknown[];

  constructor({
    message,
    status,
    code,
    issues,
    cause,
  }: {
    message: string;
    status: ContentfulStatusCode;
    code: ErrorCode;
    issues?: unknown[];
    cause?: unknown;
  }) {
    super(message, { cause });
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.issues = issues;
  }
}

export function registerErrorHandlers<TEnv extends object>(
  app: Hono<TEnv>,
  service: string,
) {
  app.notFound((c) =>
    c.json({ error: "Not found", code: "NOT_FOUND" satisfies ErrorCode }, 404),
  );

  app.onError((error: Error, c: Context<TEnv>) => {
    const activeSpan = trace.getActiveSpan();
    const spanContext = activeSpan?.spanContext();
    const traceFields =
      spanContext && trace.isSpanContextValid(spanContext)
        ? { traceId: spanContext.traceId, spanId: spanContext.spanId }
        : {};

    if (error instanceof AppError) {
      if (error.status >= 500) {
        activeSpan?.recordException(error);
        activeSpan?.setStatus({
          code: SpanStatusCode.ERROR,
          message: error.message,
        });
      }
      console.warn(
        JSON.stringify({
          event: "http.error",
          service,
          code: error.code,
          status: error.status,
          message: error.message,
          ...(error.cause instanceof Error
            ? { cause: error.cause.message }
            : {}),
          ...traceFields,
        }),
      );
      return c.json(
        {
          error: error.message,
          code: error.code,
          ...(error.issues ? { issues: error.issues } : {}),
        },
        error.status,
      );
    }

    activeSpan?.recordException(error);
    activeSpan?.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message,
    });
    console.error(
      JSON.stringify({
        event: "http.unhandled_error",
        service,
        code: "INTERNAL_ERROR",
        status: 500,
        message: error.message,
        ...traceFields,
      }),
    );
    return c.json(
      {
        error: "Internal server error",
        code: "INTERNAL_ERROR" satisfies ErrorCode,
      },
      500,
    );
  });
}

export function registerSecurityHeaders<TEnv extends object>(app: Hono<TEnv>) {
  app.use("*", async (c, next) => {
    await next();
    c.header("X-Content-Type-Options", "nosniff");
    c.header("X-Frame-Options", "DENY");
    c.header("Referrer-Policy", "no-referrer");
    if (c.req.path !== "/metrics") {
      c.header("Cache-Control", "no-store");
    }
  });
}

export function registerObservability<TEnv extends object>(
  app: Hono<TEnv>,
  service: string,
) {
  const { metricsRegistry, recordRequest, recordAiCall } =
    createMetricsRegistry();
  const tracer = trace.getTracer("job-tracker.http");

  app.use("*", async (c, next) => {
    if (c.req.path === "/metrics") return next();

    const requestId = randomUUID();
    const startedAt = performance.now();
    const method = c.req.method;
    const parentContext = propagation.extract(ROOT_CONTEXT, c.req.header());
    c.header("X-Request-Id", requestId);

    await tracer.startActiveSpan(
      method,
      { kind: SpanKind.SERVER },
      parentContext,
      async (span) => {
        let status = 500;
        try {
          await next();
          status = c.res.status;
        } finally {
          const matchedPath = routePath(c, -1);
          const route =
            matchedPath && !matchedPath.endsWith("*")
              ? matchedPath
              : "unmatched";
          const durationMs = performance.now() - startedAt;
          const spanContext = span.spanContext();

          span.updateName(
            route === "unmatched" ? method : `${method} ${route}`,
          );
          span.setAttributes({
            "http.request.method": method,
            "http.response.status_code": status,
            ...(route === "unmatched" ? {} : { "http.route": route }),
          });
          if (status >= 500) span.setStatus({ code: SpanStatusCode.ERROR });
          span.end();

          recordRequest(method, route, status, durationMs);
          console.info(
            JSON.stringify({
              event: "http.request",
              service,
              requestId,
              method,
              route,
              status,
              durationMs: Math.round(durationMs * 100) / 100,
              ...(trace.isSpanContextValid(spanContext) && {
                traceId: spanContext.traceId,
                spanId: spanContext.spanId,
              }),
            }),
          );
        }
      },
    );
  });

  app.get("/metrics", async (c) => {
    c.header("Content-Type", metricsRegistry.contentType);
    return c.body(await metricsRegistry.metrics());
  });

  return { recordAiCall };
}

function createMetricsRegistry() {
  const metricsRegistry = new Registry();
  const httpLabels = ["method", "route", "status"] as const;

  const requests = new Counter({
    name: "http_requests_total",
    help: "Number of completed HTTP requests",
    labelNames: httpLabels,
    registers: [metricsRegistry],
  });

  const duration = new Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of completed HTTP requests in seconds",
    labelNames: httpLabels,
    registers: [metricsRegistry],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  });

  const aiCalls = new Counter({
    name: "ai_requests_total",
    help: "Number of local Ollama model invocations",
    labelNames: ["operation", "status"] as const,
    registers: [metricsRegistry],
  });

  const aiDuration = new Histogram({
    name: "ai_request_duration_seconds",
    help: "Duration of local Ollama model invocations in seconds",
    labelNames: ["operation"] as const,
    registers: [metricsRegistry],
    buckets: [0.25, 0.5, 1, 2.5, 5, 10, 20, 45, 60],
  });

  function recordRequest(
    method: string,
    route: string,
    status: number,
    durationMs: number,
  ) {
    const labels = { method, route, status: String(status) };
    requests.inc(labels);
    duration.observe(labels, durationMs / 1_000);
  }

  function recordAiCall(
    operation: string,
    status: "ok" | "error" | "unconfigured",
    durationMs: number,
  ) {
    aiCalls.inc({ operation, status });
    if (status !== "unconfigured") {
      aiDuration.observe({ operation }, durationMs / 1_000);
    }
  }

  return { metricsRegistry, recordRequest, recordAiCall };
}

export function startTracing(serviceName: string) {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT?.trim();
  if (!endpoint) return undefined;

  const sdk = new NodeSDK({
    serviceName,
    traceExporter: new OTLPTraceExporter({ url: endpoint }),
  });
  sdk.start();
  return sdk;
}

export function registerGracefulShutdown({
  service,
  server,
  tracing,
  onClose,
}: {
  service: string;
  server: { close: (cb?: (err?: Error) => void) => void };
  tracing?: { shutdown: () => Promise<void> };
  onClose?: () => Promise<void>;
}) {
  let shuttingDown = false;

  const shutdown = async (signal: string) => {
    if (shuttingDown) return;
    shuttingDown = true;
    console.info(
      JSON.stringify({ event: "service.shutdown", service, signal }),
    );
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await Promise.allSettled([tracing?.shutdown(), onClose?.()]);
    process.exit(0);
  };

  process.once("SIGINT", () => void shutdown("SIGINT"));
  process.once("SIGTERM", () => void shutdown("SIGTERM"));
}
