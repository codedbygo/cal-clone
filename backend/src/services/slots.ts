// Slot availability engine — implemented in Task 1.2
//
// PURE module (LLD §3): never imports Prisma, never reads the clock
// implicitly. Caller passes rules, bookings, and `now` — that is what
// makes it unit-testable without a database.
//
// generateSlots({ date, durationMinutes, timezone, rule, bookings, now })
//   → [{ time: "09:00", startTime: ISO-UTC, endTime: ISO-UTC }]
//
// Algorithm: convert rule window to UTC once (date-fns-tz), iterate in
// duration-sized steps, drop past slots and any overlapping a booking
// (aStart < bEnd && aEnd > bStart).
