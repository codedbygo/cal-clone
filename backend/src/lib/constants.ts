// Default user resolution — implemented in Task 1.1
//
// Responsibilities (LLD §2.3):
// - getDefaultUserId(): look up the seeded host by email
//   (host@example.com), cache in module scope
// - Admin routes always act as this user; userId is NEVER accepted
//   from the client
