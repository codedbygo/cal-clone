# ADR-001: Tech Stack — Split Next.js Frontend + Express Backend

| Field | Value |
| ----- | ----- |
| **Status** | Accepted |
| **Date** | 2026-06-12 |
| **Deciders** | Project owner |
| **Related** | [HLD.md](../HLD.md) §7 · [LLD.md](../LLD.md) §1 |

## Context

The assignment requires a scheduling platform (Cal.com clone) with a prescribed stack menu:

- **Frontend:** React.js or Next.js
- **Backend:** Node.js with Express.js, OR Python with FastAPI/Django
- **Database:** PostgreSQL or MySQL

Delivery window is one day, the repo must be public on GitHub, and the app must be deployed. An alternative architecture was considered: a single Next.js application using its built-in API route handlers as the backend (no separate server), which would be faster to build and deploy.

## Decision

Build a **monorepo with two applications**:

1. **`frontend/`** — Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui. UI only; no API routes. All backend communication through a single API client module.
2. **`backend/`** — Node.js + **Express.js** + TypeScript, with Prisma ORM over **PostgreSQL** (hosted on Neon).

Deploy both to Vercel as two projects from the same repo (backend as a serverless function); Neon provides the managed PostgreSQL instance.

## Rationale

| Factor | Why this choice wins |
| ------ | -------------------- |
| **Assignment compliance** | The spec names "Node.js with Express.js" explicitly. Next.js API routes are Node.js but are *not* Express — a monolith would arguably miss the stated backend requirement. |
| **Separation of concerns** | Clear boundary: Express owns business logic, validation, and data access; Next.js owns rendering. This is an explicit evaluation criterion ("code modularity"). |
| **Database fit** | PostgreSQL over MySQL for range/overlap-friendly querying, `timestamptz`, and the optional exclusion-constraint hardening for double-booking (SCHEMA.md §4). Neon is hosting, not a different database. |
| **Prisma** | Migrations, seeding, and type-safe queries materially speed up a one-day build versus raw SQL, while the schema remains plain PostgreSQL underneath. |
| **TypeScript both sides** | Catches contract mismatches at compile time; API response types mirrored in the frontend. |
| **Vercel for both** | One platform, free tier, auto-deploy from GitHub. Express runs serverless via `@vercel/node`; acceptable for this traffic profile. |

## Alternatives considered

| Alternative | Rejected because |
| ----------- | ---------------- |
| **Next.js monolith (API routes as backend)** | Fastest option (~1–2h saved: no CORS, one deploy), but does not satisfy the explicit "Express.js" requirement. |
| **Python FastAPI/Django backend** | Allowed by spec, but Node/TS on both sides means one language, shared mental model, and Prisma's DX — better for the one-day window. |
| **MySQL** | Allowed by spec; no advantage here, and PostgreSQL's `tstzrange` + `EXCLUDE` constraints map directly onto the double-booking problem. |
| **Railway/Render for backend** | Traditional always-on server, no cold starts — but a second platform/account to manage. Kept as documented fallback if Vercel serverless limits are hit. |

## Consequences

**Positive**

- Spec-compliant stack; defensible in evaluation
- Backend independently testable with curl before any UI exists (enables booking-flow-first build order)
- Swappable frontend/backend independently

**Negative / accepted trade-offs**

- CORS configuration required between the two origins (mitigated: configured and tested in Phase 0)
- Two deployments and two env-var sets to manage (mitigated: both on Vercel, documented in IMPLEMENTATION_GUIDE.md §6)
- Serverless Express has cold starts (~hundreds of ms on free tier) — acceptable for a demo; Neon pooled connections prevent connection exhaustion
