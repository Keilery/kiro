import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wrap an async route handler so rejections are forwarded to Express's
 * error pipeline instead of crashing as unhandled rejections.
 *
 * Express 5 will do this natively, but we target v4 for stability.
 */
export function asyncHandler<TReq extends Request = Request>(
  fn: (req: TReq, res: Response, next: NextFunction) => Promise<unknown>,
): RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req as TReq, res, next)).catch(next);
  };
}
