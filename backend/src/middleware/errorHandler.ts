// Central error handling middleware — implemented in Task 1.1
//
// Responsibilities (LLD §5):
// - ApiError class: status + code + message
// - errorHandler: registered LAST in index.ts; maps ApiError to the
//   uniform { error: { code, message } } JSON shape, everything else
//   to 500 INTERNAL without leaking internals
