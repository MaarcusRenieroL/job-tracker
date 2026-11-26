import { context, propagation, SpanKind, SpanStatusCode, trace } from "@opentelemetry/api";

export async function checkAuthReadiness(url: URL) {
  const tracer = trace.getTracer("job-tracker.http");
  return tracer.startActiveSpan("GET auth readiness", { kind: SpanKind.CLIENT }, async (span) => {
    try {
      const headers: Record<string, string> = {};
      propagation.inject(context.active(), headers);
      const response = await fetch(url, {
        headers,
        redirect: "error",
        signal: AbortSignal.timeout(2_000),
      });
      span.setAttribute("http.response.status_code", response.status);
      await response.body?.cancel();
      if (!response.ok) span.setStatus({ code: SpanStatusCode.ERROR });
      return response.ok;
    } catch {
      span.setStatus({ code: SpanStatusCode.ERROR });
      return false;
    } finally {
      span.end();
    }
  });
}
