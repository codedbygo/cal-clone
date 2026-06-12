import { NextFunction, Request, Response } from "express";

// Typed, throwable API error. Routes throw these; the handler below
// turns them into the uniform JSON error shape (LLD §5).
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message);
  }
}

// Central error handler — registered LAST in index.ts.
// Express identifies error middleware by its 4-argument signature,
// so `_next` must stay even though it is unused.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof ApiError) {
    return res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message } });
  }

  // Unexpected errors: log server-side, never leak details to clients
  console.error(err);
  return res
    .status(500)
    .json({ error: { code: "INTERNAL", message: "Something went wrong." } });
}
