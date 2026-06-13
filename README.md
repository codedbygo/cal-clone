# Cal.com Clone — Scheduling Platform

A full-stack scheduling application built for the **SDE Fullstack Assignment**. Hosts manage event types, availability, and bookings on an admin dashboard; visitors book time slots through a public page — **no login required**.

---

## Links

| Resource | URL |
| -------- | --- |
| **Live app** | [https://cal-clone-9eg7.vercel.app](https://cal-clone-9eg7.vercel.app) |
| **API health** | [https://cal-clone-phi.vercel.app/api/health](https://cal-clone-phi.vercel.app/api/health) |
| **GitHub** | [https://github.com/codedbygo/cal-clone](https://github.com/codedbygo/cal-clone) |

**Try it:** [Event types](https://cal-clone-9eg7.vercel.app/event-types) · [Book 30 min](https://cal-clone-9eg7.vercel.app/book/30-min) · [Bookings](https://cal-clone-9eg7.vercel.app/bookings)

---

## Quick start

**Prerequisites:** Node.js ≥ 20, npm ≥ 10, a free [Neon](https://neon.tech) account.

```bash
git clone https://github.com/codedbygo/cal-clone.git
cd cal-clone

make setup          # install deps + copy .env examples
# Edit backend/.env and frontend/.env.local (see below)
make migrate        # create tables
make seed           # sample data
make run            # backend :4000 + frontend :3000
```

Open [http://localhost:3000/event-types](http://localhost:3000/event-types).

---

## Tech stack

| Layer | Technology |
| ----- | ---------- |
| **Frontend** | Next.js 14 (App Router), React 18, TypeScript |
| **UI** | Tailwind CSS, shadcn/ui, Lucide icons — Cal.com-inspired dark/light theme |
| **Data fetching** | TanStack Query (availability pages) |
| **Backend** | Node.js 20+, Express 5, TypeScript |
| **Database** | PostgreSQL on [Neon](https://neon.tech) |
| **ORM** | Prisma 6 (migrations + seed) |
| **Date/time** | `date-fns`, `date-fns-tz` — slot generation with timezone + DST |
| **Deployment** | Vercel (frontend + backend as two projects) |

**Monorepo:** `frontend/` and `backend/` deploy independently from one GitHub repo.

---

## Features

### Core (assignment requirements)

| Feature | Route / API |
| ------- | ----------- |
| Create, edit, delete, list event types | `/event-types` · `POST/PUT/DELETE /api/event-types` |
| Title, description, duration, unique slug | Event type form · `EventType` model |
| Public booking link | `/book/{slug}` |
| Weekly availability (days + time windows) | `/availability/[id]` · `AvailabilityRule` |
| Timezone on schedule | Schedule editor · `AvailabilitySchedule.timezone` |
| Public calendar + slot picker | `/book/[slug]` |
| Booking form (name + email) | `BookingForm` |
| Prevent double booking | DB transaction + overlap check → `409 SLOT_TAKEN` |
| Booking confirmation page | `/booking/confirmed?id={bookingId}` |
| Upcoming / past / cancelled bookings | `/bookings` (filter tabs) |
| Cancel booking | `PATCH /api/bookings/:id` with `{ status: "CANCELLED" }` |

### Bonus features

| Feature | Description |
| ------- | ----------- |
| **Multiple schedules** | Named availability schedules; one marked default |
| **Event visibility toggle** | Hidden events return 404 on public page; preview via `?preview=1` |
| **Buffer time** | Before/after minutes on event types; blocks adjacent slots |
| **Date overrides** | One-off unavailable or custom hours on specific dates |
| **Reschedule** | Guest picks new slot via `/book/{slug}?reschedule={id}` |
| **Custom questions** | Optional fields on event types; answers stored on booking |
| **Dark mode** | Default dark theme; toggle in admin sidebar |
| **Apps integrations** | Google Calendar/Meet + Zoom OAuth at `/apps` |
| **Insights dashboard** | Booking analytics, routing, utilization, call history at `/insights/*` |

### Assignment checklist

| Requirement | Status |
| ----------- | ------ |
| UI resembles Cal.com | Sidebar nav, list rows, public booking calendar, dark/light theme |
| No login required | Single seeded host; admin + public routes open |
| Sample data | `make seed` → 3 event types, Mon–Fri 9–5, 9 demo bookings |
| Own database schema | [docs/SCHEMA.md](./docs/SCHEMA.md) |
| README with setup + assumptions | This file |
| Deployed | Vercel (links above) |

---

## How it works

```
┌──────────────────────┐         REST (JSON)          ┌──────────────────────┐
│  Next.js frontend    │  ◄────────────────────────►  │  Express API         │
│  localhost:3000      │   NEXT_PUBLIC_API_URL      │  localhost:4000      │
└──────────────────────┘                              └──────────┬───────────┘
                                                                 │ Prisma
                                                                 ▼
                                                      ┌──────────────────────┐
                                                      │  Neon PostgreSQL     │
                                                      └──────────────────────┘
```

### User flows

1. **Event types** — CRUD, copy public link, toggle visibility (hidden = 404).
2. **Availability** — Create schedules, set weekly hours + timezone, mark one as default.
3. **Bookings** — Upcoming / Past / Cancelled tabs; cancel frees the slot.
4. **Public booking** — Calendar → time slots → name/email form → confirmation page.
5. **Slot engine** — Load default schedule → generate slots by duration → subtract bookings + past times.

**Double-booking prevention:** overlap check inside a Prisma transaction on `DIRECT_URL` (non-pooled connection).

---

## Assumptions

1. **Single default host** — no auth; anyone on admin URLs acts as the host (per assignment).
2. **Default schedule only** — public slots use the schedule marked default.
3. **One time window per weekday** — no lunch breaks or multiple blocks per day (v1).
4. **Slot step = event duration** — a 30-minute event produces 30-minute slots.
5. **UTC storage, local rules** — bookings stored as UTC; availability as `HH:mm` in schedule timezone.
6. **Soft cancel** — cancelled bookings kept with `status: CANCELLED`; slot becomes bookable again.
7. **No email notifications** — confirmation shown in-app only (assignment scope).
8. **Neon connection split** — `DATABASE_URL` (pooled) for queries; `DIRECT_URL` (direct) for migrations and booking transactions.

---

## Local setup

### 1. Environment variables

**Backend** — copy and edit `backend/.env`:

```env
DATABASE_URL="postgresql://USER:PASS@ep-dev-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://USER:PASS@ep-dev-xxx.region.aws.neon.tech/neondb?sslmode=require"
PORT=4000
FRONTEND_URL=http://localhost:3000
```

**Frontend** — copy and edit `frontend/.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Never commit `.env` or `.env.local`.

### 2. Migrate and seed

```bash
make migrate
make seed
```

Expected output: `Seeded: { users: 1, eventTypes: 3, schedules: 1, rules: 5, bookings: 9 }`

Seeded public slugs: `30-min`, `15-min`, `intro-call`.

### 3. Run

```bash
make run
```

| Flow | URL | Check |
| ---- | --- | ----- |
| Event types | [/event-types](http://localhost:3000/event-types) | CRUD, copy link, visibility |
| Availability | [/availability](http://localhost:3000/availability) | Edit hours, set default |
| Bookings | [/bookings](http://localhost:3000/bookings) | Upcoming / Past / Cancelled |
| Public book | [/book/30-min](http://localhost:3000/book/30-min) | Date → slot → confirm |
| Double-book | Book same slot twice | Second attempt → slot taken |

---

## Dev vs production database

Use **separate Neon projects** for local dev and Vercel production. If both use the same `DATABASE_URL`, changes appear in both environments.

| Environment | Config | Database |
| ----------- | ------ | -------- |
| Local | `backend/.env` | e.g. `cal-clone-dev` |
| Production | Vercel backend env vars | e.g. `cal-clone-prod` |

After pointing Vercel at prod Neon:

```bash
cd backend
npx prisma migrate deploy
npx prisma db seed
```

---

## Deployment

Two Vercel projects from the same repo:

| Project | Root | Environment variables |
| ------- | ---- | --------------------- |
| Backend | `backend` | `DATABASE_URL`, `DIRECT_URL`, `FRONTEND_URL`, OAuth vars (optional) |
| Frontend | `frontend` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL` |

Full walkthrough: [docs/IMPLEMENTATION_GUIDE.md](./docs/IMPLEMENTATION_GUIDE.md)

---

## Makefile commands

| Command | Description |
| ------- | ----------- |
| `make setup` | Install + copy env examples |
| `make migrate` | `prisma migrate dev` |
| `make seed` | Load sample data |
| `make run` | Start backend + frontend |
| `make build` | Production build both packages |
| `make fix-ui` | Clear `.next` cache (fixes broken CSS after mixed build/dev) |
| `make help` | List all targets |

---

## API reference

| Method | Endpoint | Description |
| ------ | -------- | ----------- |
| `GET` | `/api/health` | Health check |
| `GET/POST` | `/api/event-types` | List / create |
| `GET/PUT/DELETE` | `/api/event-types/:id` | Read / update / delete |
| `GET` | `/api/event-types/slug/:slug` | Public event lookup |
| `GET/POST` | `/api/availability` | List / create schedules |
| `GET/PUT/DELETE` | `/api/availability/:id` | Schedule CRUD + overrides |
| `PATCH` | `/api/availability/:id/default` | Set default schedule |
| `GET` | `/api/slots/bootstrap` | Event + month + slots (one call) |
| `GET` | `/api/slots?slug=&date=` | Slots for one day |
| `POST` | `/api/bookings` | Create booking |
| `GET` | `/api/bookings?filter=` | `upcoming` \| `past` \| `cancelled` |
| `GET` | `/api/bookings/:id` | Booking details (confirmation) |
| `PATCH` | `/api/bookings/:id` | Cancel `{ status: "CANCELLED" }` or reschedule `{ startTime }` |
| `GET` | `/api/integrations` | List app connection status |
| `GET` | `/api/integrations/:provider/auth-url` | Start OAuth (`google` \| `zoom`) |
| `GET` | `/api/integrations/:provider/callback` | OAuth callback (backend redirect) |
| `DELETE` | `/api/integrations/:provider` | Disconnect integration |
| `GET` | `/api/insights/bookings` | Booking volume analytics |
| `GET` | `/api/insights/routing` | Direct booking entry points |
| `GET` | `/api/insights/router-position` | Availability utilization |
| `GET` | `/api/insights/call-history` | Past meetings with video links |
| `GET` | `/api/insights/wrong-routing` | Cancellations by event type |

---

## Apps integrations (Google + Zoom)

Connect calendar and video apps at [/apps](http://localhost:3000/apps). When connected, new bookings automatically get a meeting link (Google Meet preferred, then Zoom, else Cal Video stub).

### OAuth setup

1. **Google Cloud Console** — create OAuth 2.0 client, enable Calendar API, add redirect URI:
   - Local: `http://localhost:4000/api/integrations/google/callback`
   - Prod: `https://cal-clone-phi.vercel.app/api/integrations/google/callback`

2. **Zoom Marketplace** — create OAuth app with scopes `meeting:write`, `user:read`, redirect URI:
   - Local: `http://localhost:4000/api/integrations/zoom/callback`
   - Prod: `https://cal-clone-phi.vercel.app/api/integrations/zoom/callback`

3. Add to `backend/.env`:

```env
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:4000/api/integrations/google/callback
ZOOM_CLIENT_ID=...
ZOOM_CLIENT_SECRET=...
ZOOM_REDIRECT_URI=http://localhost:4000/api/integrations/zoom/callback
OAUTH_STATE_SECRET=your-random-secret
```

Restart the backend after adding credentials, then click **Connect** on the Apps page.

---

## Insights

Analytics dashboard at `/insights/bookings` (sidebar → Insights):

| Page | URL | Data |
| ---- | --- | ---- |
| Bookings | `/insights/bookings` | Volume, cancellations, trends by event/day/hour |
| Routing | `/insights/routing` | Direct booking entry points by event slug |
| Router position | `/insights/router-position` | Booked vs available hours (utilization) |
| Call history | `/insights/call-history` | Past meetings with join links |
| Wrong routing | `/insights/wrong-routing` | Cancellation rates by event type |

---

## Project structure

```
cal-clone/
├── Makefile
├── frontend/          # Next.js 14 — admin + public booking UI
├── backend/
│   ├── prisma/        # schema, migrations, seed
│   └── src/routes/    # Express REST handlers
└── docs/              # HLD, LLD, SCHEMA, deployment guide
```

---

## Troubleshooting

| Problem | Fix |
| ------- | --- |
| Local changes appear on Vercel | Dev and prod share same `DATABASE_URL` — use separate Neon projects |
| `Can't reach database server` | Wake Neon; verify URLs in `backend/.env` |
| `P2028 Transaction not found` | Set `DIRECT_URL` (non-pooler); restart backend |
| `/_next/static/... 404` | `make fix-ui` then `cd frontend && npm run dev` — one dev server only |
| Empty calendar on booking page | Run `make seed`; pick a weekday within availability |
| CORS errors | `FRONTEND_URL` in backend must match frontend origin |

---

## Documentation

| Document | Contents |
| -------- | -------- |
| [docs/HLD.md](./docs/HLD.md) | High-level architecture |
| [docs/LLD.md](./docs/LLD.md) | Module-level design |
| [docs/SCHEMA.md](./docs/SCHEMA.md) | Database rationale |
| [docs/IMPLEMENTATION_GUIDE.md](./docs/IMPLEMENTATION_GUIDE.md) | Deploy + env checklist |
