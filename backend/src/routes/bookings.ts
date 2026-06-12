// Bookings router — /api/bookings (LLD §2.4)
//
// Task 1.4: POST /       — create inside $transaction with overlap
//                          check (409 SLOT_TAKEN); endTime computed
//                          server-side from event duration
// Task 2.4: GET /?filter=upcoming|past
//           PATCH /:id   — cancel (status → CANCELLED)
