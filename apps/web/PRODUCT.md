# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Job seekers across all career stages and disciplines ("for everyone") — from students and early-career candidates tracking high-volume applications and online assessments to experienced professionals managing multi-round interviews, referral outreach, and competing compensation offers. They operate in a focused, self-directed search where keeping deadlines, follow-ups, resume alignment, and interview preparation organized determines whether opportunities convert.

## Product Purpose

Job Tracker is a local-first personal workspace for managing a job search end to end: capturing opportunities, tracking pipeline progression across 11 stages (from Discovered through Offer, Rejected, Withdrawn, or Ghosted), organizing priorities and custom tags, coordinating referral contacts, preparing for interview rounds and technical/online assessments, checking resume skill coverage against job postings, viewing an actionable chronological agenda of deadlines and follow-ups, comparing offers, and analyzing conversion performance.

## Positioning

A private, local-first job-search operating workspace with deterministic resume skill-gap explanations, atomic versioned pipeline tracking, chronological deadline/follow-up agenda synthesis, and optional local-LLM (Ollama) referral message drafting — zero external cloud dependencies or data sharing required.

## Operating Context

- Used daily on desktop and mobile web browsers during active job hunting.
- Candidates switch rapidly between scanning their full pipeline (list or Kanban board), filtering by stage/priority/tag, triaging upcoming deadlines in the agenda, deep-editing a single application record (posting details, resume text, referrals, interviews, assessments, offer numbers), and reviewing conversion metrics.
- Supports both light and dark modes with system preference sync and persistent manual override.
- Connects via Vite proxy to two local services: Auth (port 3001, Ed25519 JWTs, Argon2id) and Tracker (port 3002, MongoDB, optimistic concurrency via `version` field).

## Capabilities and Constraints

- **Authentication**: Email and password (12–128 chars) registration and sign-in issuing 15-minute Ed25519 bearer tokens stored in `sessionStorage`.
- **Pipeline stages**: `Discovered`, `Saved`, `Applied`, `Recruiter Contacted`, `Screening`, `Technical Interview`, `Final Interview`, `Offer`, `Rejected`, `Withdrawn`, `Ghosted`.
- **Priorities and tags**: Optional `priority` (`High`, `Medium`, `Low`) and up to 25 deduplicated `tags` (up to 40 chars each) per application, with combinable backend query filters (`stage`, `priority`, `tag`) and explicit `clear` support.
- **Assessments**: Per-application array of `Online assessment` or `Take-home` items with UUID `id`, `title`, `type`, `status` (`Not started`, `In progress`, `Submitted`, `Completed`, `Cancelled`), optional `deadline`, `submittedAt`, `repoUrl`, `outcome`, and `notes`.
- **Referrals & local AI draft**: Per-application referral contacts (`Identified`, `Contacted`, `Responded`, `Referred`, `Declined`) with follow-up dates and `POST /applications/:id/referrals/:referralId/draft` via local Ollama (`localhost:11434`).
- **Interviews**: Per-application rounds (`Recruiter screening`, `Coding assessment`, `Technical round`, `System design`, `Hiring manager`, `HR discussion`) with UTC `dateTime`, interviewer, meeting link, topics, preparation notes, questions asked, performance review, and result (`Scheduled`, `Passed`, `Rejected`, `Pending`, `Cancelled`).
- **Resume coverage matching**: `GET /applications/:id/match` scoring required skills (`strong` = 1, `partial` = 0.5, `missing` = 0) with evidence excerpts, location/seniority fit signals, and preparation topics, plus `GET /applications/missing-skills` aggregation across applications.
- **Chronological Agenda**: `GET /applications/agenda?from=YYYY-MM-DD&to=YYYY-MM-DD` synthesizing upcoming `application-deadline`, `follow-up`, `interview`, `assessment`, `referral-follow-up`, and `offer-deadline` events across all open applications.
- **Offers comparison**: Per-application offer (`base`, `bonus`, `equity`, 3-letter `currency`, optional `deadline`, `notes`) and dedicated `GET /applications/offers` endpoint returning all recorded offers in original currencies.
- **Optimistic concurrency**: Every `PATCH /applications/:id` requires the current integer `version` and returns HTTP 409 on conflict.

## Brand Commitments

- Name: **Job Tracker**
- Visual language: **Modern shadcn/ui SaaS workspace** benchmarked against **Linear**, **Attio**, and **Vercel Dashboard** — crisp 1px zinc/neutral hairline borders, `Geist Variable` typography with tabular numerals, command-bar filtering (stage, priority, tag pills), structured data tables, clean Kanban columns, and high-craft tabbed application sheets/inspectors without novelty themes or smuggled quirk.
- Preserve both light and dark themes with seamless toggle and high legibility.
- Preserve local-first privacy posture: no fabricated cloud integrations, social feeds, or external telemetry claims.

## Evidence on Hand

- Live backend routes in `services/tracker/src/applications/routes.ts` and schema in `services/tracker/src/applications/schema.ts`.
- Live frontend application in `apps/web/src/` (`App.tsx`, `editor.tsx`, `analytics.tsx`, `api.ts`, `types.ts`).
- No external marketing claims, customer logos, or testimonials exist and none may be fabricated.

## Product Principles

1. **Operational clarity over ceremony**: Every view must let candidates scan status, priority, next action, and deadlines at a glance and act with minimal clicks.
2. **Complete fidelity to the data model**: Every capability in the Tracker service — priorities, tags, assessments, agenda events, offer deadlines, and all 11 stages including Ghosted — is first-class in the interface.
3. **Calm authority under pressure**: Job searching is high-stakes; the workspace should feel composed, tactile, and trustworthy in both light and dark themes.
4. **Honest local intelligence**: Resume skill matching and optional local Ollama referral drafts explain their evidence transparently and keep the user in editorial control.

## Accessibility & Inclusion

- Full keyboard navigation, visible focus rings, semantic landmarks, accessible form labels and status alerts, and WCAG AA contrast across both light and dark modes.
