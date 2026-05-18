import type { Request, Response, NextFunction } from "express";
import { redis } from "../database/redis.js";
import { AppError } from "../utils/errors.js";
import { logger } from "../utils/logger.js";

interface Options {
  /** Window length in milliseconds. */
  windowMs: number;
  /** Max requests in the window per key. */
  max: number;
  /** Logical key — used as the Redis namespace. */
  key: string;
  /** Override how the per-request key is derived (default: req.ip). */
  keyResolver?: (req: Request) => string;
}

/**
 * Redis-backed sliding-window-ish rate limiter using INCR + EXPIRE.
 *
 * Trade-off: it's fixed-window, not true sliding. For our needs (block
 * brute force and gentle global flood) the simplicity is worth it.
 *
 * Falls open if Redis is unreachable so we don't take the API down with
 * a cache outage. The error is logged for observability.
 */
export function rateLimit(opts: Options) {
  const { windowMs, max, key, keyResolver } = opts;
  const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000));

  return async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
    const subject = keyResolver ? keyResolver(req) : req.ip ?? "unknown";
    const redisKey = `rl:${key}:${subject}`;

    try {
      const count = await redis.incr(redisKey);
      if (count === 1) {
        await redis.expire(redisKey, ttlSeconds);
      }

      const remaining = Math.max(0, max - count);
      res.setHeader("X-RateLimit-Limit", String(max));
      res.setHeader("X-RateLimit-Remaining", String(remaining));

      if (count > max) {
        const ttl = await redis.ttl(redisKey);
        res.setHeader("Retry-After", String(Math.max(1, ttl)));
        return next(AppError.tooManyRequests(`Rate limit exceeded for ${key}`));
      }
      next();
    } catch (err) {
      logger.warn({ err: (err as Error).message, key }, "rate limiter degraded — allowing request");
      next();
    }
  };
}
