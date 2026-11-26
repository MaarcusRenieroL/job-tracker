# Job Tracker

A local-first React workspace for tracking applications, interview rounds, referrals, coding assessments, offers, and job-search performance. Deterministic resume matching explains which required skills appear in your resume, while an optional local Ollama model adds job-fit explanations, posting extraction, interview prep, and editable outreach drafts.

## Run locally

Install and open Docker Desktop, then run:

```sh
docker compose up --build
```

To enable local AI features (Ollama + `qwen2.5:1.5b`) and/or observability (Prometheus + Jaeger):

```sh
# Core app + local AI
docker compose --profile ai up --build -d
docker compose --profile ai logs -f ollama-init

# Core app + local AI + Prometheus & Jaeger
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://jaeger:4318/v1/traces \
  docker compose --profile ai --profile observability up --build -d
```

Open [Job Tracker](http://localhost:5173). Create an account, upload or edit your resume in **Profile & Resume**, then use **New application** to import a job URL or paste a description. The first build downloads dependencies and may take several minutes.

To stop the app, press Ctrl+C and run `docker compose down`. Your account, applications, and pulled Ollama models stay in Docker volumes.

### Interactive API Docs & Usage Guide

When the stack is running, open the built-in documentation directly from `http://localhost:5173`:

- **[How-To-Use & Operations Guide](http://localhost:5173/guide)** — quick-start commands, authentication curl walkthrough, AI endpoint reference, and observability guide.
- **[Tracker Swagger UI](http://localhost:5173/docs)** — interactive OpenAPI 3.1 explorer ([`/openapi.json`](http://localhost:5173/openapi.json)) with Bearer JWT authorization.
- **[Auth Swagger UI](http://localhost:5173/auth/docs)** — interactive OpenAPI 3.1 explorer ([`/auth/openapi.json`](http://localhost:5173/auth/openapi.json)) for registration and login.

### Local Node.js Development

For development with Node.js 26 and pnpm 12 installed, run `pnpm install --frozen-lockfile`, start MongoDB with `docker compose up -d mongo`, and generate a local Ed25519 key pair:

```sh
node --input-type=module <<'JS'
import { generateKeyPairSync } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
mkdirSync(".local", { recursive: true, mode: 0o700 });
const { privateKey, publicKey } = generateKeyPairSync("ed25519", {
  privateKeyEncoding: { type: "pkcs8", format: "pem" },
  publicKeyEncoding: { type: "spki", format: "pem" },
});
writeFileSync(".local/auth-private.pem", privateKey, { mode: 0o600, flag: "wx" });
writeFileSync(".local/auth-public.pem", publicKey, { flag: "wx" });
JS
```

Start `pnpm --filter @job-tracker/auth dev`, `pnpm --filter @job-tracker/tracker dev`, and `pnpm --dir apps/web dev` in separate terminals. Enable local Git hooks with `pnpm install-hooks`, and run `pnpm run ci` for lint, typecheck, tests, and production builds.

## Architecture and data

- **Auth (`services/auth`, port 3001):** Stores users and Argon2id password hashes in `job_tracker_auth.users` with normalized unique emails, sliding-window IP rate limiting (`429` + `Retry-After`), fail-fast Zod env config, and 15-minute Ed25519 JWT issuance.
- **Tracker (`services/tracker`, port 3002):** Verifies Ed25519 JWTs locally using the public key, isolates every query by `ownerId`, and owns `job_tracker_tracker.applications` and `job_tracker_tracker.profiles`. Stage updates, version checks, and history appends execute as a single atomic MongoDB `findOneAndUpdate`; stale versions return HTTP `409`.
- **Shared contracts (`packages/application-options`):** Single source of truth for stage/priority/work-model/assessment/interview/referral enums, `clearableApplicationKeys`, Zod validation schemas, and inferred TypeScript API contracts shared by Tracker and Web.
- **Observability (`packages/observability`):** Pino structured JSON logging (with automatic redaction of `Authorization`, passwords, and tokens), centralized `AppError` / HTTP error handling, security headers (`nosniff`, `DENY`, `no-referrer`), Prometheus HTTP & AI metrics, OpenTelemetry distributed tracing, and graceful `SIGINT`/`SIGTERM` shutdown.
- **React workspace (`apps/web`):** Connects to Auth and Tracker via Vite's HTTP proxy. Features code-split desks (Applications table & Kanban board with optimistic stage updates, Attention & follow-up alerts, Chronological Agenda, Recruiter/Referrer directory, Multi-currency Offers, Analytics, Activity timeline, CSV/JSON export & bulk import, rich-text slash-command editor) and a **Profile & Sectioned Resume Studio** with side-by-side PDF canvas preview and 7 independent shadcn + React Hook Form + Zod section forms.

## Local observability

[Prometheus targets](http://127.0.0.1:9090/targets) scrapes Auth and Tracker. Query `up{job=~"auth|tracker"}`, `sum by (job, status) (rate(http_requests_total[5m]))`, or `ai_requests_total` / `ai_request_duration_seconds` for local LLM metrics.

Generate a distributed trace across both services from inside the Compose network:

```sh
docker compose exec -T tracker node --input-type=module -e \
  'const r = await fetch("http://127.0.0.1:3002/ready/dependencies"); console.log(r.status, await r.text())'
docker compose logs --tail=20 tracker auth
```

In [Jaeger](http://127.0.0.1:16686), select `tracker` to inspect incoming HTTP spans, outbound Auth readiness spans, and `ollama.*` AI client spans correlated with the Pino JSON logs (`traceId` / `spanId`).

## Resume coverage and local AI features

Resume coverage awards one point for a strong match, half a point for a partial match, and zero for a missing skill. The score is the weighted share of required skills and stays deterministic and reproducible. Location and seniority signals look for explicit resume text and stay outside the score.

With the `ai` profile active, Tracker supports five editorial AI workflows over `OLLAMA_BASE_URL` (default `http://ollama:11434` in Compose, `http://127.0.0.1:11434` locally):

- **AI job-fit explanation** (`POST /applications/:id/match/explain`): summarizes strengths, resume gaps, and interview prep priorities with resume/posting evidence while keeping the deterministic percentage score unchanged.
- **Job description extraction** (`POST /applications/extract`): extracts editable suggestions for required skills, key responsibilities, and seniority from a pasted posting before applying them to the form.
- **Referral draft** (`POST /applications/:id/referrals/:referralId/draft`): drafts a concise outreach message for a saved referral contact.
- **Interview prep** (`POST /applications/:id/interview-prep`): generates role-specific study topics and practice questions from the saved posting and resume skill gaps.
- **Cover-letter & follow-up drafts** (`POST /applications/:id/cover-letter/draft`, `POST /applications/:id/follow-up/draft`): generates editable drafts from saved facts, leaving the user in full control of editing and sending.

Set `OLLAMA_MODEL` before starting Compose to change the model. The core app also runs without the `ai` profile.

## Tracker API reference

All `/applications` and `/profile` routes require a Bearer JWT from `POST /auth/login`. Full request/response schemas are available interactively at [`/docs`](http://localhost:5173/docs).

- **Pipeline:** `PATCH /applications/:id` requires `{ "version": 1, ... }`. A stale version returns HTTP `409`.
- **Priority, tags, seniority, and responsibilities:** Create or patch with `priority` (`High`, `Medium`, `Low`), `tags` (up to 25 deduplicated strings), `seniority`, and `responsibilities`. List accepts combinable `stage`, `priority`, and `tag` query parameters.
- **Assessments:** Create or patch with an `assessments` array (`id`, `title`, `type`, `status`, optional `deadline`, `submittedAt`, `repoUrl`, `outcome`, `notes`).
- **Agenda:** `GET /applications/agenda?from=2026-11-26&to=2026-12-10` returns chronological events across `application-deadline`, `follow-up`, `interview`, `assessment`, `referral-follow-up`, and `offer-deadline`.
- **Offers:** `GET /applications/offers` returns all recorded offers (`base`, `bonus`, `equity`, 3-letter `currency`, optional `deadline`, `notes`) in their original currencies.
- **Import a job posting:** `POST /applications/import` extracts available details from a `JobPosting` JSON-LD record or public LinkedIn job page into empty fields for review before saving.

## AI assistance

Codex assisted with planning, implementation, testing, and review. Antigravity built the five editorial AI features, Pino/Swagger/OpenAPI docs, sectioned PDF Profile Studio, and full-stack refactoring. OpenCode added the attention desk, recruiter directory, timeline, data transfer, resume-version linking, and rich-text slash commands. Impeccable supplied frontend design guidance. Runtime AI features use the local Ollama model (`docker compose --profile ai up --build -d`).
