# Low-Level Design (LLD)

## Cal.com Clone — Component-Level Design

| Field | Value |
| ----- | ----- |
| **Version** | 1.0 |
| **Date** | 2026-06-12 |
| **Parent doc** | [HLD.md](./HLD.md) |
| **Schema doc** | [SCHEMA.md](./SCHEMA.md) |

This document maps the HLD §5 components to concrete files, defines module contracts, the slot algorithm, error formats, and validation rules. Anything not specified here defaults to the HLD.

---

## 1. Folder Structure (definitive)

```
cal-clone/
├── frontend/                          # Next.js 14, App Router, TypeScript
│   ├── src/
│   │   ├── app/
│   │   │   ├── layout.tsx             # Root layout: Inter font, globals.css
│   │   │   ├── page.tsx               # redirect("/event-types")
│   │   │   ├── (admin)/               # Route group: shares admin sidebar layout
│   │   │   │   ├── layout.tsx         # AdminSidebar + main content area
│   │   │   │   ├── event-types/page.tsx
│   │   │   │   ├── availability/page.tsx
│   │   │   │   └── bookings/page.tsx
│   │   │   └── book/                  # Public — NO admin layout
│   │   │       └── [slug]/
│   │   │           ├── page.tsx       # 3-column booking flow
│   │   │           └── confirmed/page.tsx
│   │   ├── components/
│   │   │   ├── ui/                    # shadcn primitives (button, calendar, dialog, input, label, select)
│   │   │   ├── layout/AdminSidebar.tsx
│   │   │   ├── event-types/
│   │   │   │   ├── EventTypeCard.tsx
│   │   │   │   └── EventTypeForm.tsx  # used for create + edit dialog
│   │   │   ├── availability/WeeklySchedule.tsx
│   │   │   └── booking/
│   │   │       ├── EventInfo.tsx      # Col 1
│   │   │       ├── DatePicker.tsx     # Col 2 (wraps shadcn Calendar)
│   │   │       ├── TimeSlotGrid.tsx   # Col 3
│   │   │       └── BookingForm.tsx    # inline name/email form
│   │   └── lib/
│   │       ├── api.ts                 # all backend calls — ONLY place fetch() appears
│   │       ├── types.ts               # shared TS interfaces (mirror API responses)
│   │       └── utils.ts               # cn() helper, date formatting
│   ├── .env.local                     # gitignored
│   └── package.json
│
├── backend/                           # Express + TypeScript + Prisma
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── migrations/
│   │   └── seed.ts
│   ├── src/
│   │   ├── index.ts                   # app assembly: middleware, routers, listen/export
│   │   ├── routes/
│   │   │   ├── eventTypes.ts          # /api/event-types
│   │   │   ├── availability.ts        # /api/availability
│   │   │   ├── slots.ts               # /api/slots
│   │   │   └── bookings.ts            # /api/bookings
│   │   ├── services/
│   │   │   ├── slots.ts               # generateSlots() — PURE, no DB import
│   │   │   └── slots.test.ts
│   │   ├── middleware/
│   │   │   └── errorHandler.ts        # central error → JSON response
│   │   └── lib/
│   │       ├── db.ts                  # PrismaClient singleton
│   │       ├── constants.ts           # DEFAULT_USER_ID resolution
│   │       └── validate.ts            # input validation helpers
│   ├── vercel.json
│   ├── .env                           # gitignored
│   ├── .env.example                   # committed
│   └── package.json
│
├── README.md
├── .github/workflows/ci.yml
├── docs/                              # HLD, LLD, SCHEMA, API, ADRs, guides
└── .cursor/                           # project rules
```

**Rules:**

- Routes never contain business logic beyond orchestration — slot math lives in `services/`.
- `services/slots.ts` must not import Prisma; data is passed in (testable without DB).
- Frontend components never call `fetch` directly — always via `lib/api.ts`.

---

## 2. Backend Modules

### 2.1 `src/index.ts` — app assembly

```typescript
// Responsibilities (order matters):
// 1. cors({ origin: FRONTEND_URL })
// 2. express.json()
// 3. Mount routers: /api/event-types, /api/availability, /api/slots, /api/bookings
// 4. GET /api/health → { status: "ok" }
// 5. errorHandler middleware (LAST)
// 6. Local: app.listen(PORT). Vercel: export default app (no listen).
```

### 2.2 `src/lib/db.ts` — Prisma singleton

```typescript
// globalThis caching so dev hot-reload / serverless re-invocation
// doesn't open a new connection pool per reload.
const prisma = globalThis.prisma ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") globalThis.prisma = prisma;
export default prisma;
```

### 2.3 `src/lib/constants.ts` — default user

```typescript
// getDefaultUser(): finds the single seeded user by email (host@example.com).
// Cached in module scope after first lookup. All admin routes use this —
// no userId is ever accepted from the client (prevents IDOR).
```

### 2.4 Route modules — endpoint contracts

Every route module exports an Express `Router`. Handlers follow:
`validate input → call prisma/service → res.json` with errors thrown to `errorHandler`.

#### `routes/eventTypes.ts`

| Endpoint | Input | Success | Errors |
| -------- | ----- | ------- | ------ |
| `GET /api/event-types` | — | `200` `EventType[]` | — |
| `GET /api/event-types/slug/:slug` | slug param | `200` `EventType & { user: { name } }` | `404 NOT_FOUND` |
| `POST /api/event-types` | `{ title, description?, durationMinutes, slug }` | `201` `EventType` | `400 VALIDATION`, `409 SLUG_TAKEN` |
| `PUT /api/event-types/:id` | same as POST, all optional | `200` `EventType` | `400`, `404`, `409 SLUG_TAKEN` |
| `DELETE /api/event-types/:id` | id param | `204` empty | `404` |

#### `routes/availability.ts`

| Endpoint | Input | Success | Errors |
| -------- | ----- | ------- | ------ |
| `GET /api/availability` | — | `200` `{ timezone, rules: Rule[] }` | — |
| `PUT /api/availability` | `{ timezone, rules: [{ dayOfWeek, startTime, endTime }] }` | `200` updated schedule | `400 VALIDATION` |

PUT semantics: **transaction** — upsert schedule, `deleteMany` old rules, `createMany` new rules. Days absent from `rules` = unavailable.

#### `routes/slots.ts`

| Endpoint | Input | Success | Errors |
| -------- | ----- | ------- | ------ |
| `GET /api/slots?slug=&date=` | slug, date `YYYY-MM-DD` | `200` `{ slots: Slot[] }` | `400 VALIDATION`, `404 NOT_FOUND` |

```typescript
type Slot = {
  time: string;       // "09:00" — display, in schedule timezone
  startTime: string;  // ISO UTC — what gets POSTed back
  endTime: string;    // ISO UTC
};
```

#### `routes/bookings.ts`

| Endpoint | Input | Success | Errors |
| -------- | ----- | ------- | ------ |
| `GET /api/bookings?filter=upcoming\|past` | filter (default `upcoming`) | `200` `Booking[]` (incl. eventType title) | `400` |
| `POST /api/bookings` | `{ eventTypeId, attendeeName, attendeeEmail, startTime }` | `201` `Booking` | `400 VALIDATION`, `404`, `409 SLOT_TAKEN` |
| `PATCH /api/bookings/:id` | `{ status: "CANCELLED" }` | `200` `Booking` | `400`, `404` |

`filter=upcoming`: `startTime >= now`, ordered ASC. `past`: `startTime < now`, ordered DESC. `endTime` computed server-side: `startTime + durationMinutes` (client never supplies it).

---

## 3. Slot Engine — `services/slots.ts`

### 3.1 Signature (pure function)

```typescript
interface GenerateSlotsInput {
  date: string;                 // "2026-06-15"
  durationMinutes: number;      // from EventType
  timezone: string;             // from AvailabilitySchedule, e.g. "America/New_York"
  rule: { startTime: string; endTime: string } | null;  // rule for this weekday, or null
  bookings: { startTime: Date; endTime: Date }[];       // CONFIRMED bookings overlapping this date
  now?: Date;                   // injectable clock for tests (default: new Date())
}

function generateSlots(input: GenerateSlotsInput): Slot[];
```

### 3.2 Algorithm

```
1. if rule == null → return []                      // host not available this weekday
2. windowStartUtc = zonedTimeToUtc(`${date}T${rule.startTime}`, timezone)
   windowEndUtc   = zonedTimeToUtc(`${date}T${rule.endTime}`,   timezone)
3. slots = []
   cursor = windowStartUtc
   while cursor + duration <= windowEndUtc:
       slotEnd = cursor + duration
       isPast    = cursor <= now
       overlaps  = any booking where (cursor < b.endTime && slotEnd > b.startTime)
       if !isPast && !overlaps:
           slots.push({ time: formatInTz(cursor, timezone, "HH:mm"),
                        startTime: cursor.toISOString(),
                        endTime: slotEnd.toISOString() })
       cursor = slotEnd                              // step = duration (Cal.com default)
4. return slots
```

**Key decisions** (ADR-002):

- Timezone conversion happens once at window boundaries — slot math is pure UTC.
- `now` injectable → deterministic tests.
- Overlap predicate `aStart < bEnd && aEnd > bStart` is the single shared definition, reused by the booking insert check.

### 3.3 Required test cases (`slots.test.ts`)

| # | Case | Expect |
| - | ---- | ------ |
| 1 | Mon 09:00–17:00, 30 min, no bookings, date in future | 16 slots, first `09:00`, last `16:30` |
| 2 | `rule = null` (weekend) | `[]` |
| 3 | One booking 10:00–10:30 | 15 slots, `10:00` missing |
| 4 | `now` = 13:05 on same day | slots ≤ 13:00 excluded |
| 5 | 45-min duration in 09:00–17:00 | slots step by 45 min, none past 16:15 |

---

## 4. Booking Creation — double-booking prevention

`POST /api/bookings` handler logic (ADR-003):

```
1. Validate body (see §6)
2. eventType = prisma.eventType.findUnique(eventTypeId) → 404 if missing
3. startTime = new Date(body.startTime); reject if < now → 400
4. endTime = startTime + eventType.durationMinutes
5. prisma.$transaction:
   a. conflict = booking.findFirst({
        eventTypeId, status: CONFIRMED,
        startTime < endTime AND endTime > startTime   // shared overlap predicate
      })
   b. if conflict → throw ApiError(409, "SLOT_TAKEN")
   c. booking.create({ ... status: CONFIRMED })
6. res.status(201).json(booking)
```

Optional hardening (Task 4.2): Postgres `btree_gist` exclusion constraint as a second layer. The 409 path must already work without it.

---

## 5. Error Handling

### 5.1 Response format (uniform across ALL endpoints)

```json
{
  "error": {
    "code": "SLOT_TAKEN",
    "message": "This time slot has just been booked. Please pick another."
  }
}
```

### 5.2 `ApiError` + central handler

```typescript
class ApiError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message); }
}

// middleware/errorHandler.ts — registered LAST in index.ts
// instanceof ApiError → its status/code
// anything else      → 500 INTERNAL, generic message (never leak stack traces)
```

### 5.3 Error code catalog

| HTTP | Code | Used when |
| ---- | ---- | --------- |
| 400 | `VALIDATION` | Bad/missing input fields |
| 404 | `NOT_FOUND` | Event type / booking / slug doesn't exist |
| 409 | `SLUG_TAKEN` | Event type slug already used by host |
| 409 | `SLOT_TAKEN` | Booking overlap detected |
| 500 | `INTERNAL` | Unhandled — generic message only |

Frontend `lib/api.ts` parses `error.code` to choose user-facing messages (e.g. `SLOT_TAKEN` → refetch slots and prompt re-pick).

---

## 6. Input Validation Rules (`lib/validate.ts`)

| Field | Rule |
| ----- | ---- |
| `title` | string, trimmed, 1–100 chars |
| `description` | string, ≤ 500 chars, default `""` |
| `durationMinutes` | integer, one of allowed range 5–480 |
| `slug` | `/^[a-z0-9]+(-[a-z0-9]+)*$/`, 1–60 chars |
| `timezone` | must exist in `Intl.supportedValuesOf("timeZone")` |
| `dayOfWeek` | integer 0–6 |
| `startTime`/`endTime` (rules) | `/^([01]\d|2[0-3]):[0-5]\d$/`, and `startTime < endTime` |
| `attendeeName` | string, trimmed, 1–100 chars |vailability settings (weekly schedule + timezone)
- Public booking page (calendar, slots, form, confirmation)
- Bookings dashboard (upcoming, past, cancel)
- PostgreSQL database with Prisma ORM
| `attendeeEmail` | basic email regex `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`, ≤ 254 chars |
| `startTime` (booking) | valid ISO datetime, must be in the future |
| `date` (slots query) | `/^\d{4}-\d{2}-\d{2}$/` and a real calendar date |
| `filter` (bookings query) | `"upcoming"` or `"past"` only |

Validation failures throw `ApiError(400, "VALIDATION", "<field>: <reason>")`.

---

## 7. Frontend Modules

### 7.1 `lib/api.ts` — single API gateway

```typescript
// Base: process.env.NEXT_PUBLIC_API_URL
// One generic request<T>(path, options) wrapper:
//   - JSON headers, parses error body, throws ApiClientError { code, message }
// Exports:
//   getEventTypes() / createEventType(data) / updateEventType(id, data) / deleteEventType(id)
//   getEventBySlug(slug)
//   getAvailability() / updateAvailability(data)
//   getSlots(slug, date)
//   getBookings(filter) / createBooking(data) / cancelBooking(id)
```

### 7.2 Page-component breakdown

| Page | State owner | Children |
| ---- | ----------- | -------- |
| `book/[slug]/page.tsx` | `selectedDate`, `slots`, `selectedSlot`, `step` | EventInfo, DatePicker, TimeSlotGrid, BookingForm |
| `event-types/page.tsx` | `eventTypes`, dialog open/edit target | EventTypeCard[], EventTypeForm (dialog) |
| `availability/page.tsx` | `timezone`, `rules` draft | WeeklySchedule |
| `bookings/page.tsx` | `filter` tab, `bookings` | booking rows + cancel button |

Booking page flow: pick date → `getSlots()` → pick slot → form slides in → `createBooking()` → on 201 `router.push(.../confirmed?{params})`; on `SLOT_TAKEN` show message + refetch slots.

All pages are client components (`"use client"`) using `useEffect` + local state — no global state library needed at this scale.

### 7.3 Cal.com visual tokens

| Token | Value |
| ----- | ----- |
| Font | Inter |
| Card | `bg-white border border-gray-200 rounded-lg` |
| Active sidebar item | `bg-gray-100 rounded-md font-medium` |
| Slot button | outline button, full width, `hover:border-gray-900` |
| Page bg | `bg-gray-50` admin / `bg-white` public |

---

## 8. Environment Variables

### Backend (`backend/.env.example`)

```env
DATABASE_URL=        # Neon POOLED connection string (?pgbouncer=true)
DIRECT_URL=          # Neon direct string — migrations only
PORT=4000
FRONTEND_URL=http://localhost:3000
```

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`DEFAULT_USER_ID` is **not** an env var — resolved at runtime by seeded email (`constants.ts`), so deploys don't depend on a generated cuid.

---

## 9. HLD Traceability

| HLD §5.3 component | LLD implementation |
| ------------------ | ------------------ |
| Admin UI | §1 `(admin)/` route group, §7.2 |
| Public Booking UI | §1 `book/[slug]/`, §7.2 |
| API Client | §7.1 `lib/api.ts` |
| REST API | §2.4 route contracts |
| Slot Engine | §3 pure function + tests |
| Data Access | §2.2 Prisma singleton, [SCHEMA.md](./SCHEMA.md) |
| HLD §6.1 booking flow | §3 + §4 (slots → create with overlap check) |
| HLD §6.2 availability flow | §2.4 availability PUT transaction |
| HLD §11 security | §5 errors, §6 validation, §2.3 no client userId |
