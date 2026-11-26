import { randomUUID } from "node:crypto";
import {
  propagation,
  ROOT_CONTEXT,
  SpanKind,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";
import type { Hono } from "hono";
import { routePath } from "hono/route";
import { Counter, Histogram, Registry } from "@prometheus-io/client";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { NodeSDK } from "@opentelemetry/sdk-node";

export function registerObservability(app: Hono, service: string) {
  const { metricsRegistry, recordRequest } = createRequestMetrics();
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
          const route = matchedPath && !matchedPath.endsWith("*")
            ? matchedPath
            : "unmatched";
          const durationMs = performance.now() - startedAt;
          const spanContext = span.spanContext();

          span.updateName(route === "unmatched" ? method : `${method} ${route}`);
          span.setAttributes({
            "http.request.method": method,
            "http.response.status_code": status,
            ...(route === "unmatched" ? {} : { "http.route": route }),
          });
          if (status >= 500) span.setStatus({ code: SpanStatusCode.ERROR });
          span.end();

          recordRequest(method, route, status, durationMs);
          console.info(JSON.stringify({
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
          }));
        }
      },
    );
  });

  app.get("/metrics", async (c) => {
    c.header("Content-Type", metricsRegistry.contentType);
    return c.body(await metricsRegistry.metrics());
  });
}

function createRequestMetrics() {
  const metricsRegistry = new Registry();

  const labelNames = ["method", "route", "status"] as const;

  const requests = new Counter({
    name: "http_requests_total",
    help: "Number of completed HTTP requests",
    labelNames,
    registers: [metricsRegistry],
  });

  const duration = new Histogram({
    name: "http_request_duration_seconds",
    help: "Duration of completed HTTP requests in seconds",
    labelNames,
    registers: [metricsRegistry],
    buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
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

  return { metricsRegistry, recordRequest };
}

export function startTracing(serviceName: string) {
  const endpoint = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
  if (!endpoint) return;

  const sdk = new NodeSDK({
    serviceName,
    traceExporter: new OTLPTraceExporter({ url: endpoint }),
  });
  sdk.start();
  return sdk;
}
