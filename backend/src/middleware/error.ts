import type { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";
import { AppError, isAppError } from "../utils/errors.js";
import { isProd } from "../config/env.js";
import { logger } from "../utils/logger.js";

/**
 * 404 handler — anything that didn't match a route lands here.
 * It runs before the error handler so we get a typed AppError downstream.
 */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
  next(AppError.notFound(`Route ${req.method} ${req.path}`));
}

interface ErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

/**
 * Global error handler.
 *
 * Translates AppError, ZodError, and known Prisma errors into uniform
 * JSON shapes. Anything else becomes a generic 500; the real message
 * is logged but never exposed in production.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Express requires 4-arg signature
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  const requestId = req.id;

  // 1. AppError — already shaped
  if (isAppError(err)) {
    if (err.status >= 500) logger.error({ err: err.message, code: err.code, requestId }, "AppError 5xx");
    else logger.debug({ err: err.message, code: err.code, requestId }, "AppError");
    res.status(err.status).json(<ErrorBody>{
      error: {
        code: err.code,
        message: err.message,
        details: err.expose ? err.details : undefined,
        requestId,
      },
    });
    return;
  }

  // 2. ZodError — validation
  if (err instanceof ZodError) {
    const flat = err.flatten();
    res.status(422).json(<ErrorBody>{
      error: {
        code: "UNPROCESSABLE_ENTITY",
        message: "Validation failed",
        details: { fieldErrors: flat.fieldErrors, formErrors: flat.formErrors },
        requestId,
      },
    });
    return;
  }

  // 3. Prisma — known constraint failures get human-friendly mapping
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      // unique constraint
      res.status(409).json(<ErrorBody>{
        error: {
          code: "CONFLICT",
          message: "Resource already exists",
          details: { target: err.meta?.target },
          requestId,
        },
      });
      return;
    }
    if (err.code === "P2025") {
      // record not found
      res.status(404).json(<ErrorBody>{
        error: { code: "NOT_FOUND", message: "Record not found", requestId },
      });
      return;
    }
    logger.warn({ prismaCode: err.code, requestId }, "unhandled prisma error code");
  }

  // 4. Anything else — generic 500
  const message = err instanceof Error ? err.message : "Unknown error";
  const stack = err instanceof Error ? err.stack : undefined;
  logger.error({ err: message, stack, requestId }, "unhandled error");

  res.status(500).json(<ErrorBody>{
    error: {
      code: "INTERNAL_ERROR",
      message: isProd ? "Internal server error" : message,
      requestId,
    },
  });
}
