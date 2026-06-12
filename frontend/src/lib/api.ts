// API client — the ONLY place fetch() appears (LLD §7.1)
// Implemented in Task 1.5, extended in Tasks 2.2–2.4.
//
// Base URL: process.env.NEXT_PUBLIC_API_URL
// One generic request<T>() wrapper that parses the backend's
// { error: { code, message } } shape into a typed ApiClientError.
//
// Exports: getEventTypes, createEventType, updateEventType,
// deleteEventType, getEventBySlug, getAvailability, updateAvailability,
// getSlots, getBookings, createBooking, cancelBooking
