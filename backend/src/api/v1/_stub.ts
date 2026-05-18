import { Router, type Request, type Response } from "express";

/**
 * Minimal stub router used until each domain module is implemented.
 *
 * Each `route` becomes a 501 Not Implemented response that documents
 * the intended method, path, and the PR that will deliver it. This way
 * the OpenAPI-style URL surface is visible from day one, and clients
 * can target the final endpoints without rewrites later.
 */
export interface StubRoute {
  method: "get" | "post" | "patch" | "put" | "delete";
  path: string;
  /** Short human-readable description of the future behaviour. */
  description: string;
  /** Future PR number that will land this endpoint. */
  plannedIn: string;
  /** Optional: requires Bearer auth. Documentation only. */
  requiresAuth?: boolean;
  /** Optional: minimum role. Documentation only. */
  minRole?: "USER" | "SELLER" | "MODERATOR" | "ADMIN" | "SUPERADMIN";
}

export function buildStubRouter(moduleName: string, routes: readonly StubRoute[]): Router {
  const router = Router();

  router.get("/", (_req: Request, res: Response) => {
    res.json({
      module: moduleName,
      status: "stub",
      message: `${moduleName} module — endpoints stubbed. See routes[].plannedIn for delivery.`,
      routes,
    });
  });

  for (const r of routes) {
    router[r.method](r.path, (_req: Request, res: Response) => {
      res.status(501).json({
        error: {
          code: "NOT_IMPLEMENTED",
          message: `${moduleName}.${r.method.toUpperCase()} ${r.path} — planned in ${r.plannedIn}`,
          details: { description: r.description, requiresAuth: r.requiresAuth, minRole: r.minRole },
        },
      });
    });
  }

  return router;
}
