# Cal.com Clone — Scheduling Platform

A full-stack scheduling application built for the **SDE Fullstack Assignment**. It replicates Cal.com’s core experience: hosts manage event types and availability on an admin dashboard, and external visitors book time slots through a public booking page—no login required on either side.

---

## Links

| Resource | URL |
|----------|-----|
| **Live app (frontend)** | _Add after Vercel deploy_ |
| **API (backend)** | _Add after Vercel deploy_ |
| **GitHub repository** | _Add your public repo URL_ |

---

## Tech stack

| Layer | Technology | Why |
|-------|------------|-----|
| **Frontend** | [Next.js 14](https://nextjs.org/) (App Router), React 18, TypeScript | Server/client components, file-based routing, production-ready SPA |
| **Styling** | Tailwind CSS, Lucide icons | Cal.com-style dark admin UI and responsive layout |
| **Backend** | [Node.js](https://nodejs.org/) 20+, [Express 5](https://expressjs.com/), TypeScript | REST API matching assignment requirements |
| **Database** | [PostgreSQL](https://www.postgresql.org/) on [Neon](https://neon.tech) | Serverless Postgres, free tier, no local DB setup |
| **ORM** | [Prisma 6](https://www.prisma.io/) | Type-safe queries, migrations, seed scripts |
| **Date/time** | `date-fns`, `date-fns-tz` | Slot generation with correct timezone/DST handling |
| **Deployment** | Vercel (frontend + backend as separate projects) | Zero-config Next.js and serverless Express |

**Monorepo layout:** `frontend/` and `backend/` in one repository; each deploys independently.

---

## Features implemented

### 1. Event types management
- Create, edit, delete, and list event types (title, description, duration, URL slug)
- Unique slug per host with `409` on duplicates
- Public booking link: `/book/{slug}`
- Hidden event types + preview mode (`?preview=1`) for draft review

### 2. Availability settings
- Weekly schedule: toggle days on/off, one time window per day (e.g. Mon–Fri 9:00 AM–5:00 PM)
- Timezone selector (IANA, e.g. `Asia/Kolkata`)
- Multiple named schedules with **Set as default** (default schedule drives public slots)

### 3. Public booking page
- Month calendar with unavailable/past dates disabled
- Available time slots from host availability minus existing bookings
- Booking form (name + email, required)
- Double-booking prevention (transaction + overlap check → `409 SLOT_TAKEN`)
- Confirmation page with event details, host/guest info, and back navigation

### 4. Bookings dashboard
- Tabs: **Upcoming**, **Past**, **Cancelled**
- Each row: guest name, email, event type, date/time, duration
- Cancel with confirmation; cancelled bookings move to Cancelled tab

### Bonus (partial)
- Multiple availability schedules (Cal.com-style list + create-by-name flow)
- Performance: single bootstrap API for calendar + slots, server/client caching
- Cal.com-inspired dark admin UI

**Not implemented (out of scope):** email notifications, date overrides, reschedule, buffer time, custom questions, user authentication.

---

## Assumptions & design decisions

These choices match the assignment brief (“no login required, default user logged in for admin”):

1. **Single default host** — All admin APIs resolve to one seeded user (`host@example.com`). There is no sign-up, login, or JWT. Anyone who can reach `/event-types` acts as the host. This is intentional for v1.

2. **No authentication on public routes** — `/book/{slug}` and booking creation are open. Hidden event types return `404` unless `?preview=1`.

3. **Default availability schedule** — If multiple schedules exist, only the one marked **default** is used for public slot calculation. Event types are not linked to individual schedules in v1.

4. **One continuous window per weekday** — Each enabled day has a single start/end time (no “+ add slot” or lunch breaks). Matches assignment scope.

5. **Slot step = event duration** — A 30-minute event produces 30-minute slots within the availability window.

6. **Times stored in UTC, rules in local HH:mm** — `AvailabilityRule` stores wall-clock strings in the schedule timezone; bookings store UTC instants. Avoids DST bugs on recurring weekly rules.

7. **Soft cancel** — Cancelled bookings remain in the database (`status: CANCELLED`) for history and free the slot for rebooking.

8. **No email** — Confirmation is shown in the app only; no SMTP or third-party mail service.

9. **Sample seed data** — `npx prisma db seed` loads a default host, 3 event types, Mon–Fri 9–5 availability, and **9 demo bookings** (3 upcoming, 3 past, 3 cancelled). Emails use the `demo-*@example.com` pattern. Re-seeding removes non-demo bookings and refreshes demo rows.

10. **Neon connection split** — `DATABASE_URL` (pooled) for runtime queries; `DIRECT_URL` (direct) for migrations and booking transactions (PgBouncer does not support interactive transactions).

---

## Architecture (high level)

```
┌─────────────────┐     REST (JSON)      ┌─────────────────┐
│  Next.js        │ ◄──────────────────► │  Express API    │
│  localhost:3000 │                      │  localhost:4000 │
└─────────────────┘                      └────────┬────────┘
                                                  │
                                                  ▼
                                         ┌─────────────────┐
                                         │  Neon Postgres  │
                                         │  (Prisma ORM)   │
                                         └─────────────────┘
```

**Key backend modules:**
- `routes/eventTypes.ts` — CRUD + public slug lookup
- `routes/availability.ts` — Schedule CRUD + weekly rules
- `routes/slots.ts` — Slot engine + bootstrap endpoint
- `routes/bookings.ts` — Create, list, cancel
- `services/slots.ts` — Pure slot generation (availability − bookings − past)

Detailed design: [docs/HLD.md](./docs/HLD.md) · [docs/LLD.md](./docs/LLD.md) · [docs/SCHEMA.md](./docs/SCHEMA.md)

---

## Prerequisites

- **Node.js** ≥ 20.x (`node -v`)
- **npm** ≥ 10.x (`npm -v`)
- **Git**
- **Neon account** (free) — [neon.tech](https://neon.tech)
- **Vercel account** (free) — for deployment

No Docker or local PostgreSQL required.

---

## Local setup

### Step 1 — Clone and install dependencies

```bash
git clone <your-repo-url>
cd cal-clone

cd backend && npm install
cd ../frontend && npm install
```

### Step 2 — Create a Neon database

1. Create a project on [Neon](https://neon.tech).
2. Copy **two** connection strings from the dashboard:
   - **Pooled** (hostname contains `-pooler`) → `DATABASE_URL`
   - **Direct** (no `-pooler`) → `DIRECT_URL`

### Step 3 — Configure environment variables

**Backend** — create `backend/.env` from the example:

```bash
cp backend/.env.example backend/.env
```

```env
DATABASE_URL="postgresql://USER:PASS@ep-xxx-pooler.region.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://USER:PASS@ep-xxx.region.aws.neon.tech/neondb?sslmode=require"
PORT=4000
FRONTEND_URL=http://localhost:3000
```

**Frontend** — create `frontend/.env.local`:

```bash
cp frontend/.env.example frontend/.env.local
```

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Never commit `.env` or `.env.local` — they are gitignored.

### Step 4 — Run database migrations and seed

```bash
cd backend
npx prisma migrate dev      # creates tables (uses DIRECT_URL)
npx prisma db seed          # sample host, event types, availability, 9 demo bookings
```

Expected seed output:

```
Seeded: { users: 1, eventTypes: 3, schedules: 1, rules: 5, bookings: 9 }
```

*(Event type / schedule counts may be higher if you created extras during testing; bookings will always reset to 9 demo rows.)*

### Step 5 — Start development servers

**Terminal 1 — API:**

```bash
cd backend
npm run dev
```

Health check: [http://localhost:4000/api/health](http://localhost:4000/api/health) → `{ "status": "ok" }`

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

App: [http://localhost:3000](http://localhost:3000)

### Step 6 — Verify core flows

| Flow | URL | What to check |
|------|-----|----------------|
| Admin — event types | [/event-types](http://localhost:3000/event-types) | List, create, edit, delete, copy link |
| Admin — availability | [/availability](http://localhost:3000/availability) | + New schedule, edit days/times/timezone, Save |
| Admin — bookings | [/bookings](http://localhost:3000/bookings) | 3 rows each in Upcoming / Past / Cancelled |
| Public booking | [/book/30-min](http://localhost:3000/book/30-min) | Pick date → slot → form → confirmation |
| Double-book test | Book same slot twice | Second attempt shows “time was just taken” |

---

## Deployment

Deploy as **two Vercel projects** from the same repo:

| Project | Root directory | Key env vars |
|---------|----------------|--------------|
| **Backend** | `backend` | `DATABASE_URL`, `DIRECT_URL`, `FRONTEND_URL` |
| **Frontend** | `frontend` | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL` |

**After first production deploy:**

```bash
cd backend
# Point env at production Neon, then:
npx prisma migrate deploy
npx prisma db seed
```

Production uses a **separate Neon database** from local dev unless you intentionally share connection strings—local test bookings will not appear on live.

Full walkthrough: [docs/IMPLEMENTATION_GUIDE.md](./docs/IMPLEMENTATION_GUIDE.md)

---

## Useful commands

| Command | Directory | Description |
|---------|-----------|-------------|
| `npm run dev` | `backend` / `frontend` | Start dev server with hot reload |
| `npm run build` | `backend` / `frontend` | Production build |
| `npm start` | `backend` | Run compiled API (`dist/`) |
| `npx prisma migrate dev` | `backend` | Apply migrations (development) |
| `npx prisma migrate deploy` | `backend` | Apply migrations (production) |
| `npx prisma db seed` | `backend` | Load / refresh sample data |
| `npx prisma studio` | `backend` | Visual database browser |
| `npm test` | `backend` | Run backend tests |

---

## Project structure

```
cal-clone/
├── frontend/                 # Next.js 14 app
│   ├── src/app/              # Routes (admin + public booking)
│   ├── src/components/       # UI components (booking, event-types, availability)
│   └── src/lib/              # API client, types, utilities
├── backend/
│   ├── prisma/               # Schema, migrations, seed
│   └── src/
│       ├── routes/           # Express route handlers
│       ├── services/         # Slot engine, availability math
│       └── lib/              # DB, validation, helpers
├── docs/                     # HLD, LLD, schema, implementation guide
└── README.md
```

---

## API reference (summary)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET/POST` | `/api/event-types` | List / create event types |
| `GET/PUT/DELETE` | `/api/event-types/:id` | Read / update / delete |
| `GET` | `/api/event-types/slug/:slug` | Public event lookup |
| `GET/POST` | `/api/availability` | List / create schedules |
| `GET/PUT/DELETE` | `/api/availability/:id` | Schedule CRUD |
| `PATCH` | `/api/availability/:id/default` | Set default schedule |
| `GET` | `/api/slots/bootstrap` | Event + month dates + all slots (one call) |
| `GET` | `/api/slots?slug=&date=` | Slots for a single day |
| `POST` | `/api/bookings` | Create booking |
| `GET` | `/api/bookings?filter=` | Dashboard list (`upcoming` \| `past` \| `cancelled`) |
| `GET` | `/api/bookings/:id` | Booking details (confirmation page) |
| `PATCH` | `/api/bookings/:id` | Cancel booking |

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `Can't reach database server` | Check Neon is awake; verify `DATABASE_URL` / `DIRECT_URL` in `.env` |
| `P2028 Transaction not found` | Ensure `DIRECT_URL` is set (non-pooler); restart backend |
| Empty calendar on booking page | Run seed; confirm default schedule has rules; pick a weekday |
| CORS errors | Set `FRONTEND_URL` in backend `.env` to match frontend origin |
| Migration failed on shadow DB | Run `npx prisma migrate deploy` if migration already applied manually |

---

## Author

Built as part of the SDE Fullstack Assignment — Cal.com Clone.

For deeper technical documentation, see the [`docs/`](./docs/) folder.
