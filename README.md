# Job Tracker

A local React workspace for tracking applications, interview rounds, referrals, and job-search performance. Resume matching explains which required skills appear in a pasted resume. An optional local model drafts referral messages for review.

## Run locally

Use Node.js 26, pnpm 12, and Docker Compose.

```sh
pnpm install --frozen-lockfile
docker compose up -d mongo
```

Generate the JWT signing keys once in a fresh checkout:

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

Run each command in its own terminal from the repository root:

```sh
pnpm --filter @job-tracker/auth dev
pnpm --filter @job-tracker/tracker dev
pnpm --dir apps/web dev
```

Open the URL printed by Vite, then create an account. Use at least 12 characters for your password. To enable the local Git hooks, run `pnpm install-hooks`. Run `pnpm run ci` to lint, type-check, test, and build.

## Architecture and data

- **Auth** listens on port 3001. It stores users and Argon2id password hashes in `job_tracker_auth.users`, normalizes email addresses, and enforces uniqueness with an index. It issues 15-minute Ed25519 JWTs.
- **Tracker** listens on port 3002. It verifies Auth tokens locally using the public key and filters every application operation by the verified JWT subject. It owns `job_tracker_tracker.applications`, indexed by owner and update time.
- **React** connects to both services through Vite's HTTP proxy. The apps exchange identity through the signed token. Tracker can verify tokens independently once it has the public key.
- Each application document stores posting fields, interview rounds, referrals, and stage history. The version filter, stage update, and history append form a single atomic MongoDB write. A competing update returns HTTP 409.

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
