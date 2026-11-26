# Job Tracker

A local React workspace for tracking applications, interview rounds, referrals, and job-search performance. Resume matching explains which required skills appear in a pasted resume. An optional local model drafts referral messages for review.

## Run locally

Install and open Docker Desktop, then run this command in the project directory:

```sh
docker compose up --build
```

Open [Job Tracker](http://localhost:5173). Create an account, add your resume or enter your skills and experience, then use **New application** to import a job URL or paste a description. Review the detected keywords and score before saving. The first build downloads dependencies and may take several minutes.

To stop the app, press Ctrl+C and run `docker compose down`. Your account and applications stay in the Docker volumes. To start it again, run `docker compose up`.

For development with Node.js 26 and pnpm 12 installed, run `pnpm install --frozen-lockfile`, start MongoDB with `docker compose up -d mongo`, and generate a local key pair:

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

Start `pnpm --filter @job-tracker/auth dev`, `pnpm --filter @job-tracker/tracker dev`, and `pnpm --dir apps/web dev` in separate terminals. Enable the local Git hooks with `pnpm install-hooks`, and run `pnpm run ci` for checks.

## Architecture and data

- **Auth** listens on port 3001. It stores users and Argon2id password hashes in `job_tracker_auth.users`, normalizes email addresses, and enforces uniqueness with an index. It issues 15-minute Ed25519 JWTs.
- **Tracker** listens on port 3002. It verifies Auth tokens locally using the public key and filters every application operation by the verified JWT subject. It owns `job_tracker_tracker.applications`, indexed by owner and update time.
- **React** connects to both services through Vite's HTTP proxy. The apps exchange identity through the signed token. Tracker can verify tokens independently once it has the public key.
- **Application options** in `packages/application-options` define the stage, priority, and assessment values used by the React controls and Tracker validation. Tracker owns the application schemas and MongoDB access.
- Each user profile stores their name and resume text in `job_tracker_tracker.profiles`. The unique owner index isolates profiles. Each application document stores posting fields, interview rounds, referrals, and stage history. The version filter, stage update, and history append form a single atomic MongoDB write. A competing update returns HTTP 409.

The Compose deployment binds MongoDB to loopback for local development. Both services can override the connection URI through `MONGO_URI`.

## Resume coverage and referral drafts

Resume coverage awards one point for a strong match, half a point for a partial match, and zero for a missing skill. The score is the weighted share of required skills. Location and seniority signals look for explicit resume text and stay outside the score.

To enable AI drafts, run Ollama locally, pull an instruction model, and start Tracker with the model name:

```sh
ollama pull qwen2.5:0.5b
OLLAMA_MODEL=qwen2.5:0.5b pnpm --filter @job-tracker/tracker dev
```

Save the application and a referral contact before selecting **Draft message with AI**. Tracker sends the draft request to loopback on port 11434. The result is editable and must be reviewed before sending. The rest of the app works without Ollama.

## AI assistance

Codex assisted with planning, implementation, testing, and review. Impeccable supplied frontend design guidance. The optional runtime AI feature uses the configured Ollama model.

## Tracker API for priorities, assessments, agenda, and offers

All routes require the same bearer token as the existing application API.

- **Pipeline:** `PATCH /applications/:id` accepts `{ "version": 1, "stage": "Ghosted" }`. Use the current record version for any quick-move control. A stale version returns HTTP 409.
- **Priority and tags:** create or patch with `priority` (`High`, `Medium`, or `Low`) and `tags` (up to 25 strings, 40 characters each). Tags are trimmed and deduplicated case-insensitively. Patch with `clear: ["priority"]` to clear priority or `tags: []` to clear tags. The list endpoint accepts combinable `stage`, `priority`, and `tag` query parameters. Tag filters match the full tag case-insensitively.
- **Assessments:** create or patch with an `assessments` array. Each item requires a UUID `id`, `title`, `type` (`Online assessment` or `Take-home`), and `status` (`Not started`, `In progress`, `Submitted`, `Completed`, or `Cancelled`). Optional fields are `deadline`, `submittedAt` (both YYYY-MM-DD), `repoUrl` (HTTP or HTTPS), `outcome`, and `notes`. A supplied array replaces the current array.
- **Agenda:** `GET /applications/agenda?from=2026-11-26&to=2026-12-10` returns `{ events: [] }` sorted chronologically. The boundaries are inclusive dates. The default start is the current UTC date. Events have an `id`, `applicationId`, `company`, `role`, `kind`, `title`, and `date`; scheduled interviews also have a UTC `dateTime`. Kind values are `application-deadline`, `follow-up`, `interview`, `assessment`, `referral-follow-up`, and `offer-deadline`. Closed applications, finished assessments, and cancelled interviews are excluded.
- **Offers:** `GET /applications/offers` returns `{ offers: [] }`, newest update first. Each row has `_id`, `company`, `role`, `stage`, and the stored `offer`. Offer data supports `base`, `bonus`, `equity`, `currency`, `notes`, and an optional `deadline` (YYYY-MM-DD). Amounts remain in their original currencies.

## Import a job posting

In a new application, paste a public job URL and select **Import**. Tracker extracts available details from a `JobPosting` JSON-LD record or a public LinkedIn job page and fills empty fields for review. The application is saved only when you select **Save**. Some sites require login, block automated requests, render details in JavaScript, or omit structured data. Enter those details manually.
