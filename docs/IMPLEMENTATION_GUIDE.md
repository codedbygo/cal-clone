# Implementation Guide

## Cal.com Clone — Setup, Build Order & Deployment

| Field | Value |
| ----- | ----- |
| **Version** | 1.0 |
| **Date** | 2026-06-12 |
| **Design docs** | [HLD.md](./HLD.md) · [LLD.md](./LLD.md) · [SCHEMA.md](./SCHEMA.md) |
| **Execution plan** | [TASK_SPLIT.md](./TASK_SPLIT.md) · [24_HOUR_SPRINT.md](./24_HOUR_SPRINT.md) |

This is the practical "how to build and run it" document. Architecture questions → HLD. Module contracts → LLD. Database → SCHEMA.

---

## 1. Prerequisites

| Tool | Version | Check |
| ---- | ------- | ----- |
| Node.js | ≥ 20.x | `node -v` |
| npm | ≥ 10.x | `npm -v` |
| Git | any recent | `git -v` |
| Neon account | free tier | https://neon.tech |
| Vercel account | free tier | https://vercel.com |
| GitHub repo | public | `git remote -v` → `codedbygo/cal-clone` |

No local PostgreSQL or Docker needed — Neon is used for dev and prod (separate branches/databases recommended).

---

## 2. Repository Layout

```
cal-clone/            # monorepo, one public GitHub repo
├── frontend/         # Next.js 14 — Vercel project 1
├── backend/          # Express + Prisma — Vercel project 2
├── .github/workflows # CI
├── docs/             # all design docs + ADRs
└── .cursor/          # project rules
```

Full file tree: [LLD.md §1](./LLD.md#1-folder-structure-definitive).

---

## 3. Environment Variables

### 3.1 Backend — `backend/.env` (gitignored; commit `.env.example`)

```env
# Neon POOLED connection string — used by the app at runtime
DATABASE_URL="postgresql://USER:PASS@HOST-pooler.neon.tech/DB?sslmode=require&pgbouncer=true"

# Neon DIRECT connection string — used ONLY by prisma migrate
DIRECT_URL="postgresql://USER:PASS@HOST.neon.tech/DB?sslmode=require"

PORT=4000
FRONTEND_URL=http://localhost:3000
```

### 3.2 Frontend — `frontend/.env.local` (gitignored)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3.3 Production values

| Variable | Where set | Production value |
| -------- | --------- | ---------------- |
| `DATABASE_URL` / `DIRECT_URL` | Vercel backend project | Neon prod strings |
| `FRONTEND_URL` | Vercel backend project | `https://<frontend>.vercel.app` |
| `NEXT_PUBLIC_API_URL` | Vercel frontend project | `https://<backend>.vercel.app/api` |
| `NEXT_PUBLIC_APP_URL` | Vercel frontend project | `https://<frontend>.vercel.app` |

**Never commit `.env` / `.env.local`.** Root `.gitignore` must cover both before the first backend commit.

---

## 4. Local Setup (once repo has code)

```bash
# 1. Clone
git clone git@github.com:codedbygo/cal-clone.git && cd cal-clone

# 2. Backend
cd backend
npm install
cp .env.example .env          # then paste Neon connection strings
npx prisma migrate dev        # apply migrations (uses DIRECT_URL)
npx prisma db seed            # default user, 2 event types, Mon-Fri 9-5, 3 bookings
npm run dev                   # → http://localhost:4000/api/health

# 3. Frontend (second terminal)
cd frontend
npm install
cp .env.example .env.local    # defaults already point at localhost:4000
npm run dev                   # → http://localhost:3000
```

**Verify:** open `http://localhost:3000/book/30-min` — calendar should show slots Mon–Fri.

### Daily dev loop

| Command | Where | Purpose |
| ------- | ----- | ------- |
| `npm run dev` | backend | tsx watch, auto-restart |
| `npm run dev` | frontend | Next.js dev server |
| `npm test` | backend | slot engine tests |
| `npx prisma studio` | backend | visual DB browser |
| `npx prisma migrate dev --name <change>` | backend | after editing `schema.prisma` |

---

## 5. File Build Order (enforced)

Matches [TASK_SPLIT.md](./TASK_SPLIT.md). **Do not create files ahead of their task.**

| Step | Task | Files | Proves |
| ---- | ---- | ----- | ------ |
| 1 | 0.5 | `backend/package.json`, `tsconfig.json`, `src/index.ts` | `GET /api/health` 200 locally |
| 2 | 0.6 | migrate, `src/lib/db.ts`, `prisma/seed.ts` (stub) | Tables exist in Neon |
| 3 | 0.7 | `backend/vercel.json` | Health 200 on production |
| 4 | 1.1 | full seed, `routes/eventTypes.ts` (reads) | curl returns seeded event types |
| 5 | 1.2 | `services/slots.ts` + tests | `npm test` green |
| 6 | 1.3 | `routes/slots.ts` | curl slots for weekday vs weekend |
| 7 | 1.4 | `routes/bookings.ts` (POST) | double-book curl → 409 |
| 8 | 1.5 | `frontend/` scaffold, `lib/api.ts` | browser fetch passes CORS |
| 9 | 1.6–1.7 | booking page + confirmation | full public flow in browser |
| 10 | 2.1–2.4 | admin layout, event types CRUD, availability, bookings dashboard | all admin features |
| 11 | 3.1–3.5 | validation, CI, frontend deploy, polish, README | pipeline green, live URLs |
| 12 | 4.x | bonus + smoke test + submit | — |

Rationale for "backend booking core before any UI": [24_HOUR_SPRINT.md](./24_HOUR_SPRINT.md) Phase 1 notes — the public booking flow is the demo-critical path and its API can be fully verified with curl.

---

## 6. Deployment

### 6.1 Topology

One GitHub repo → **two Vercel projects** (different Root Directories) + Neon.

| Project | Root directory | Framework preset | URL pattern |
| ------- | -------------- | ---------------- | ----------- |
| `cal-clone` | `frontend` | Next.js (auto) | `https://cal-clone-*.vercel.app` |
| `cal-clone-api` | `backend` | Other | `https://cal-clone-api-*.vercel.app` |

### 6.2 Backend on Vercel (Task 0.7)

Express runs as a serverless function — `src/index.ts` must `export default app` and only call `app.listen()` when not on Vercel:

```typescript
if (!process.env.VERCEL) app.listen(PORT);
export default app;
```

`backend/vercel.json`:

```json
{
  "version": 2,
  "builds": [{ "src": "src/index.ts", "use": "@vercel/node" }],
  "routes": [{ "src": "/(.*)", "dest": "src/index.ts" }]
}
```

Steps:

1. Vercel dashboard → Add New Project → import `codedbygo/cal-clone`
2. Root Directory = `backend`, framework = Other
3. Set env vars (§3.3) — use **pooled** `DATABASE_URL`
4. Deploy → verify `GET /api/health` returns `{ "status": "ok" }`
5. Migrations run locally against prod DB (`npx prisma migrate deploy`), not in Vercel build — keeps build fast and avoids migrate-on-every-deploy races

### 6.3 Frontend on Vercel (Task 3.3)

1. Add New Project → same repo again
2. Root Directory = `frontend`, framework auto-detected (Next.js)
3. Set `NEXT_PUBLIC_API_URL` + `NEXT_PUBLIC_APP_URL` (§3.3)
4. Deploy, then update backend's `FRONTEND_URL` to the real frontend URL and redeploy backend (CORS)

### 6.4 Database (Neon)

1. Create project → copy **pooled** and **direct** connection strings
2. `npx prisma migrate deploy` from local machine (uses `DIRECT_URL`)
3. `npx prisma db seed` once against prod
4. Optional: separate Neon branch for local dev

---

## 7. CI/CD (Task 3.2)

`.github/workflows/ci.yml` — stages per the project rules:

```
lint (frontend eslint)
  → test (backend: npm test — slot engine)
  → build (backend tsc + frontend next build)
  → deploy (Vercel auto-deploys on push to main; CI gates the merge)
```

- PRs must be green before merge to `main`
- Vercel's GitHub integration handles the actual deploy on merge; the CI pipeline is the quality gate

---

## 8. Verification Checklist (run before every PR)

From [.cursor/rules/cursor_rules.md](../.cursor/rules/cursor_rules.md):

- [ ] Code aligns with [HLD](./HLD.md) component boundaries
- [ ] Code aligns with [LLD](./LLD.md) module contracts (§2) and error format (§5)
- [ ] Implementation matches [SCHEMA](./SCHEMA.md) (no ad-hoc fields/queries)
- [ ] Input validation per LLD §6 on all write endpoints
- [ ] OWASP pass: no injection (Prisma parameterized), no secrets committed, CORS restricted to `FRONTEND_URL`, no client-supplied `userId`
- [ ] Tested locally (curl / browser / `npm test`)
- [ ] API docs / user stories updated if endpoints changed
- [ ] CI green (once pipeline exists)

---

## 9. Assumptions (mirror in README)

- Single default host (`host@example.com`), no authentication
- One availability schedule per host; one time window per weekday
- Slot step = event duration (Cal.com default)
- Booker sees times in the host schedule's timezone
- Deleting an event type cascades its bookings
- Email notifications, buffer time, date overrides, rescheduling = bonus only

---

## 10. Troubleshooting

| Symptom | Likely cause | Fix |
| ------- | ------------ | --- |
| CORS error in browser console | `FRONTEND_URL` mismatch | Check backend env matches exact frontend origin (no trailing slash) |
| `prisma migrate` hangs on Vercel/Neon | Using pooled URL for migration | Migrations need `DIRECT_URL` |
| "Too many connections" on Neon | Direct URL at runtime | Runtime must use pooled URL (`pgbouncer=true`) |
| Slots empty on a weekday | No seed / wrong `dayOfWeek` convention | Verify rules use 0=Sun…6=Sat; check `prisma studio` |
| Slot times off by hours | TZ conversion at wrong layer | Conversion happens only in slot engine ([LLD §3.2](./LLD.md)) |
| 404 on Vercel backend routes | `vercel.json` routes missing | All paths must route to `src/index.ts` |
