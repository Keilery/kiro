import express, { type Express, type Request, type Response, type NextFunction } from "express";
import helmet from "helmet";
import cors from "cors";
import cookieParser from "cookie-parser";
import pinoHttp from "pino-http";

import { env, isProd } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { requestId } from "./middleware/requestId.js";
import { errorHandler, notFoundHandler } from "./middleware/error.js";
import { rateLimit } from "./middleware/rateLimit.js";
import { v1Router } from "./api/v1/index.js";
import { openapiDoc } from "./api/openapi.js";
import { metricsHandler } from "./api/metrics.js";
import swaggerUi from "swagger-ui-express";

/**
 * Build the Express application.
 *
 * `server.ts` consumes this and attaches it to an `http.Server` so that
 * Socket.io can share the same port. Tests can also import `buildApp()`
 * directly to fire requests via supertest without binding a port.
 */
export function buildApp(): Express {
  const app = express();

  // Trust the upstream proxy headers (X-Forwarded-For, etc.) so that
  // rate limiting and IP logging see the real client IP.
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  // Request ID first — every other middleware can log it.
  app.use(requestId);

  // Structured access log
  app.use(
    pinoHttp({
      logger,
      genReqId: (req) => (req.headers["x-request-id"] as string | undefined) ?? "",
      customLogLevel(_req, res, err) {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
      },
      // Trim noisy fields from the default serializer
      serializers: {
        req(req) {
          return { method: req.method, url: req.url, id: req.id };
        },
        res(res) {
          return { statusCode: res.statusCode };
        },
      },
    }),
  );

  // Security headers. CSP is intentionally permissive in dev; tightened in PR#11/15.
  app.use(
    helmet({
      contentSecurityPolicy: isProd ? undefined : false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );

  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
      credentials: true,
      methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    }),
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());

  // Light global rate limit. Per-route auth limiter is stricter.
  app.use(rateLimit({ windowMs: 60_000, max: 600, key: "global" }));

  // Health checks (also exposed via the v1 router for convenience).
  app.get("/healthz", (_req: Request, res: Response) => {
    res.json({ status: "ok", uptime: process.uptime() });
  });
  app.get("/readyz", async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const { prisma } = await import("./database/prisma.js");
      const { redis } = await import("./database/redis.js");
      await prisma.$queryRaw`SELECT 1`;
      await redis.ping();
      res.json({ status: "ready" });
    } catch (err) {
      next(err);
    }
  });

  // Prometheus exposition (scraped by Prometheus / Datadog agent / etc.)
  app.get("/metrics", metricsHandler);

  // OpenAPI placeholder — full schema is registered in PR#12.
  app.get("/openapi.json", (_req, res) => res.json(openapiDoc));
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(openapiDoc, {
      customSiteTitle: "NexusMarket API",
      swaggerOptions: { persistAuthorization: true, displayRequestDuration: true },
    }),
  );

  // Versioned API
  app.use("/api/v1", v1Router);

  // 404 → typed not-found
  app.use(notFoundHandler);
  // Error handler must come last
  app.use(errorHandler);

  return app;
}
