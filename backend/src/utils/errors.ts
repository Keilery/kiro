/**
 * Typed application errors.
 *
 * Throw an `AppError` from anywhere; the global error handler will
 * translate it into a consistent JSON response. Anything else that
 * leaks through becomes a 500 with the message hidden in production.
 */

export type ErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "UNPROCESSABLE_ENTITY"
  | "TOO_MANY_REQUESTS"
  | "PAYMENT_REQUIRED"
  | "INTERNAL_ERROR"
  | "SERVICE_UNAVAILABLE";

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  PAYMENT_REQUIRED: 402,
  INTERNAL_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

export class AppError extends Error {
  readonly code: ErrorCode;
  readonly status: number;
  readonly details?: unknown;
  readonly expose: boolean;

  constructor(code: ErrorCode, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.status = STATUS_BY_CODE[code];
    this.details = details;
    // Errors with status < 500 are safe to send to the client verbatim.
    this.expose = this.status < 500;
  }

  // Convenience constructors so call sites read like `throw badRequest(...)`.
  static badRequest(message = "Bad request", details?: unknown) { return new AppError("BAD_REQUEST", message, details); }
  static unauthorized(message = "Unauthorized") { return new AppError("UNAUTHORIZED", message); }
  static forbidden(message = "Forbidden") { return new AppError("FORBIDDEN", message); }
  static notFound(resource = "Resource") { return new AppError("NOT_FOUND", `${resource} not found`); }
  static conflict(message = "Conflict", details?: unknown) { return new AppError("CONFLICT", message, details); }
  static unprocessable(message = "Unprocessable entity", details?: unknown) { return new AppError("UNPROCESSABLE_ENTITY", message, details); }
  static tooManyRequests(message = "Too many requests") { return new AppError("TOO_MANY_REQUESTS", message); }
  static internal(message = "Internal server error") { return new AppError("INTERNAL_ERROR", message); }
}

/** Type guard. */
export function isAppError(err: unknown): err is AppError {
  return err instanceof AppError;
}
