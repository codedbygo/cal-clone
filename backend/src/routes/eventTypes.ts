// Event types router — /api/event-types (LLD §2.4)
//
// Task 1.1: GET /            — list for default user
//           GET /slug/:slug  — public event details (404 NOT_FOUND)
// Task 2.2: POST /           — create (400 VALIDATION, 409 SLUG_TAKEN)
//           PUT /:id         — update
//           DELETE /:id      — delete (cascades bookings)
