import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "@prisma/client";
import { verifyAccessToken, type AccessTokenPayload } from "../utils/jwt.js";
import { AppError } from "../utils/errors.js";

/**
 * Augment Express's Request with the authenticated principal.
 * Populated by `requireAuth`; left unset for public routes.
 */
declare module "express-serve-static-core" {
  interface Request {
    user?: AccessTokenPayload;
  }
}

/**
 * Reject the request unless a valid Bearer access token is presented.
 * The decoded payload is attached to `req.user` for downstream handlers.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return next(AppError.unauthorized("Missing or malformed Authorization header"));
  }
  const token = header.slice("Bearer ".length).trim();
  if (!token) return next(AppError.unauthorized("Empty token"));

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch (err) {
    next(AppError.unauthorized((err as Error).message ?? "Invalid token"));
  }
}

/**
 * Optional auth — populate `req.user` if a token is present, otherwise
 * pass through. Useful for endpoints whose response varies for guests.
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) return next();
  try {
    req.user = verifyAccessToken(header.slice("Bearer ".length).trim());
  } catch {
    // Malformed/expired tokens are silently ignored on optional routes.
  }
  next();
}

const ROLE_RANK: Record<UserRole, number> = {
  USER: 0,
  SELLER: 1,
  MODERATOR: 2,
  ADMIN: 3,
  SUPERADMIN: 4,
};

/**
 * Require the authenticated user to have at least the given role.
 * Composes with `requireAuth` — chain them in order.
 */
export function requireRole(min: UserRole) {
  return function roleGuard(req: Request, _res: Response, next: NextFunction): void {
    if (!req.user) return next(AppError.unauthorized());
    if (ROLE_RANK[req.user.role] < ROLE_RANK[min]) {
      return next(AppError.forbidden(`Requires role >= ${min}`));
    }
    next();
  };
}
