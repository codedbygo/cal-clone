// Input validation helpers — implemented incrementally (Tasks 1.1–3.1)
//
// Rules catalog lives in LLD §6: title/name lengths, slug pattern,
// email regex, HH:mm time format, IANA timezone check, ISO dates.
// Failures throw ApiError(400, "VALIDATION", "<field>: <reason>").
