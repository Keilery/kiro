import { PrismaClient } from "@prisma/client";
import { env, isProd } from "../config/env.js";
import { logger } from "../utils/logger.js";

/**
 * Prisma singleton.
 *
 * In dev, Node may re-evaluate this module on hot-reload. We attach the
 * client to globalThis to avoid exhausting the database connection pool.
 */
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

export const prisma: PrismaClient =
  global.__prisma ??
  new PrismaClient({
    log: isProd
      ? [{ emit: "event", level: "error" }, { emit: "event", level: "warn" }]
      : [
          { emit: "event", level: "query" },
          { emit: "event", level: "error" },
          { emit: "event", level: "warn" },
          { emit: "event", level: "info" },
        ],
    datasources: { db: { url: env.DATABASE_URL } },
  });

// Forward Prisma logs through our logger for unified output.
// `as any` cast keeps the typed log narrow without pulling in Prisma's namespace.
(prisma as unknown as { $on: (e: string, cb: (l: { message?: string; query?: string; duration?: number }) => void) => void }).$on(
  "error",
  (e) => logger.error({ src: "prisma", ...e }),
);
(prisma as unknown as { $on: (e: string, cb: (l: { message?: string }) => void) => void }).$on(
  "warn",
  (e) => logger.warn({ src: "prisma", ...e }),
);

if (!isProd) global.__prisma = prisma;

/** Graceful shutdown — call from server shutdown handler. */
export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}
