import type { Request, Response, NextFunction, RequestHandler } from "express";
import type { ZodTypeAny, z } from "zod";

/**
 * Zod-based request validator.
 *
 * Validates body / query / params in one pass and replaces the parsed
 * payload back onto the request so handlers see typed values.
 *
 * Usage:
 *   router.post("/auth/login", validate({ body: LoginSchema }), handler);
 *   // inside handler: const { email, password } = req.body;  // typed
 *
 * On failure, throws a ZodError which the global error handler turns
 * into a 422 with `{ fieldErrors, formErrors }`.
 */
interface Schemas {
  body?: ZodTypeAny;
  query?: ZodTypeAny;
  params?: ZodTypeAny;
}

export function validate(schemas: Schemas): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if (schemas.body) {
        req.body = schemas.body.parse(req.body);
      }
      if (schemas.query) {
        // express's req.query is read-only after Express 5; assign via
        // `Object.assign` so this works on both v4 and v5.
        const parsed = schemas.query.parse(req.query);
        Object.assign(req.query, parsed);
      }
      if (schemas.params) {
        const parsed = schemas.params.parse(req.params);
        Object.assign(req.params, parsed);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}

/** Helper to infer the parsed body type. */
export type BodyOf<S extends ZodTypeAny> = z.infer<S>;
