import type { Request, Response, NextFunction } from "express";
import { nanoid } from "nanoid";

/**
 * Attach a stable per-request id used by:
 *  - access logs (pino-http reads `req.id`)
 *  - error responses (returned in the body for support correlation)
 *  - downstream services (sent as `X-Request-Id` header)
 *
 * If the upstream proxy already supplied an id, we keep it; otherwise
 * generate a short nanoid (12 chars is enough at our request volume).
 */
declare module "express-serve-static-core" {
  interface Request {
    id?: string;
  }
}

export function requestId(req: Request, res: Response, next: NextFunction): void {
  const incoming = req.header("x-request-id");
  const id = incoming && incoming.length <= 64 ? incoming : nanoid(12);
  req.id = id;
  res.setHeader("X-Request-Id", id);
  next();
}
