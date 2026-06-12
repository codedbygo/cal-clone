// Availability router — /api/availability (LLD §2.4)
//
// Task 2.3: GET /  — schedule timezone + weekly rules
//           PUT /  — transaction: upsert schedule, replace all rules;
//                    absent day = unavailable
