export const trackerGuideHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Job Tracker — Developer &amp; API Usage Guide</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #fafafa;
      --surface: #ffffff;
      --muted: #f4f4f6;
      --border: #e4e4e7;
      --text: #18181b;
      --subtle: #52525b;
      --accent: #2563eb;
      --code-bg: #f1f5f9;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #111114;
        --surface: #18181c;
        --muted: #222228;
        --border: rgba(255,255,255,0.1);
        --text: #f4f4f6;
        --subtle: #a1a1aa;
        --accent: #60a5fa;
        --code-bg: #0c0c0f;
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height: 1.6;
    }
    .wrap { max-width: 920px; margin: 0 auto; padding: 36px 20px 72px; }
    header { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid var(--border); padding-bottom: 20px; margin-bottom: 28px; }
    h1 { margin: 0; font-size: 1.75rem; letter-spacing: -0.025em; }
    .subtitle { margin: 4px 0 0; color: var(--subtle); font-size: 0.95rem; }
    .nav { display: flex; flex-wrap: wrap; gap: 10px; }
    .btn {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 8px 14px; border-radius: 8px; font-size: 0.85rem; font-weight: 500;
      text-decoration: none; border: 1px solid var(--border); background: var(--surface); color: var(--text);
    }
    .btn.primary { background: var(--text); color: var(--bg); border-color: transparent; }
    .frame { background: var(--muted); border: 1px solid var(--border); border-radius: 16px; padding: 5px; margin-bottom: 20px; }
    .panel { background: var(--surface); border: 1px solid var(--border); border-radius: 12px; padding: 20px 22px; }
    h2 { margin: 0 0 10px; font-size: 1.15rem; letter-spacing: -0.02em; }
    h3 { margin: 16px 0 6px; font-size: 0.95rem; }
    p, li { color: var(--subtle); font-size: 0.92rem; }
    strong, code { color: var(--text); }
    pre {
      margin: 10px 0 0; padding: 14px 16px; border-radius: 10px;
      background: var(--code-bg); border: 1px solid var(--border);
      overflow-x: auto; font-size: 0.82rem; line-height: 1.5;
    }
    code { font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 0.84em; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 0.86rem; }
    th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid var(--border); }
    th { color: var(--text); font-weight: 600; }
    td { color: var(--subtle); }
    .pill { display: inline-block; padding: 2px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600; background: var(--muted); border: 1px solid var(--border); color: var(--text); }
    a { color: var(--accent); }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <div>
        <h1>Job Tracker — API &amp; Operations Guide</h1>
        <p class="subtitle">Local-first workspace with Ed25519 JWT auth, deterministic resume matching, Ollama AI, Pino logs, Prometheus, and Jaeger.</p>
      </div>
      <div class="nav">
        <a class="btn primary" href="/docs">Open Swagger UI</a>
        <a class="btn" href="/openapi.json">OpenAPI 3.1 JSON</a>
        <a class="btn" href="/auth/docs">Auth Swagger UI</a>
        <a class="btn" href="/">Open Web App</a>
      </div>
    </header>

    <div class="frame"><div class="panel">
      <h2>1. Quick Start (Docker Compose)</h2>
      <p>Start the full local stack including MongoDB, Auth, Tracker, React Web UI, and local Ollama (<code>qwen2.5:1.5b</code>):</p>
      <pre><code># Core app + local AI (Ollama)
docker compose --profile ai up --build -d

# Wait for the local model pull to finish on first run
docker compose --profile ai logs -f ollama-init

# Optional: also enable Prometheus (9090) and Jaeger (16686)
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://jaeger:4318/v1/traces \\
  docker compose --profile ai --profile observability up --build -d</code></pre>
      <table>
        <thead><tr><th>Service</th><th>URL</th><th>Purpose</th></tr></thead>
        <tbody>
          <tr><td><strong>Web Workspace</strong></td><td><a href="http://localhost:5173">http://localhost:5173</a></td><td>React + Vite UI (also proxies <code>/auth</code>, <code>/applications</code>, <code>/profile</code>, <code>/docs</code>, <code>/guide</code>)</td></tr>
          <tr><td><strong>Tracker Swagger UI</strong></td><td><a href="/docs">http://localhost:5173/docs</a></td><td>Interactive API explorer for Applications, Match, Agenda, Offers, Profile &amp; AI</td></tr>
          <tr><td><strong>Auth Swagger UI</strong></td><td><a href="/auth/docs">http://localhost:5173/auth/docs</a></td><td>Interactive API explorer for Registration &amp; Ed25519 Login</td></tr>
          <tr><td><strong>Prometheus</strong></td><td><a href="http://127.0.0.1:9090">http://127.0.0.1:9090</a></td><td>Scrapes <code>http_requests_total</code>, latency histograms, and <code>ai_requests_total</code></td></tr>
          <tr><td><strong>Jaeger</strong></td><td><a href="http://127.0.0.1:16686">http://127.0.0.1:16686</a></td><td>Distributed traces across Tracker, Auth, and outbound <code>ollama.*</code> spans</td></tr>
        </tbody>
      </table>
    </div></div>

    <div class="frame"><div class="panel">
      <h2>2. Authenticate &amp; Use Swagger UI</h2>
      <ol>
        <li>Register an account (12–128 char password) and sign in to get a 15-minute Ed25519 JWT.</li>
        <li>Open <a href="/docs"><strong>Swagger UI</strong></a>, click <strong>Authorize</strong>, and paste the raw <code>accessToken</code>.</li>
        <li>Expand any endpoint and click <strong>Try it out</strong>.</li>
      </ol>
      <pre><code># 1. Register
curl -s http://localhost:3001/auth/register \\
  -H 'Content-Type: application/json' \\
  -d '{"name":"Aarav Mehta","email":"aarav@example.com","password":"correct-horse-battery-staple"}'

# 2. Login and capture Bearer token
TOKEN=$(curl -s http://localhost:3001/auth/login \\
  -H 'Content-Type: application/json' \\
  -d '{"email":"aarav@example.com","password":"correct-horse-battery-staple"}' | node -e 'console.log(JSON.parse(require("fs").readFileSync(0,"utf8")).accessToken)')

# 3. List your applications
curl -s http://localhost:3002/applications -H "Authorization: Bearer $TOKEN"</code></pre>
    </div></div>

    <div class="frame"><div class="panel">
      <h2>3. Local AI Endpoints (Ollama)</h2>
      <p>All AI routes read <code>OLLAMA_BASE_URL</code> (Compose default: <code>http://ollama:11434</code>) and <code>OLLAMA_MODEL</code> (default: <code>qwen2.5:1.5b</code>). Every output is editable and never sent automatically.</p>
      <table>
        <thead><tr><th>Endpoint</th><th>Feature</th><th>Notes</th></tr></thead>
        <tbody>
          <tr><td><span class="pill">POST</span> <code>/applications/:id/match/explain</code></td><td>AI job-fit explanation</td><td>Returns strengths, resume gaps &amp; prep priorities with evidence; deterministic score stays reproducible.</td></tr>
          <tr><td><span class="pill">POST</span> <code>/applications/extract</code></td><td>Job description extraction</td><td>Extracts editable required skills, responsibilities &amp; seniority from pasted posting text.</td></tr>
          <tr><td><span class="pill">POST</span> <code>/applications/:id/referrals/:referralId/draft</code></td><td>Referral draft</td><td>Drafts a concise referral message for a saved contact.</td></tr>
          <tr><td><span class="pill">POST</span> <code>/applications/:id/interview-prep</code></td><td>Interview prep</td><td>Generates role-specific practice questions and study topics from saved posting &amp; resume gaps.</td></tr>
          <tr><td><span class="pill">POST</span> <code>/applications/:id/cover-letter/draft</code></td><td>Tailored cover letter</td><td>Uses only saved profile, resume, and posting facts.</td></tr>
          <tr><td><span class="pill">POST</span> <code>/applications/:id/follow-up/draft</code></td><td>Stage-aware follow-up</td><td>Optional <code>recipient</code> &amp; <code>note</code> body fields; tailored to pipeline stage &amp; rounds.</td></tr>
        </tbody>
      </table>
    </div></div>

    <div class="frame"><div class="panel">
      <h2>4. Logging (Pino), Tracing &amp; Concurrency</h2>
      <ul>
        <li><strong>Pino structured JSON logs:</strong> Both <code>auth</code> and <code>tracker</code> emit ISO-timestamped JSON logs with <code>service</code>, <code>requestId</code>, <code>traceId</code>, <code>spanId</code>, and automatic redaction of <code>Authorization</code> headers, passwords, and tokens. Control verbosity with <code>LOG_LEVEL=debug|info|warn|error</code>.</li>
        <li><strong>Optimistic concurrency:</strong> Every <code>PATCH /applications/:id</code> requires the current integer <code>version</code>. Concurrent or stale updates return HTTP <code>409</code> with <code>code: "CONFLICT"</code>.</li>
        <li><strong>Error contract:</strong> All API errors return <code>{ "error": "...", "code": "..." }</code> alongside security headers (<code>nosniff</code>, <code>DENY</code>, <code>no-referrer</code>).</li>
      </ul>
    </div></div>
  </div>
</body>
</html>`;
