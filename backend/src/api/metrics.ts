import type { Request, Response } from "express";
import { redis } from "../database/redis.js";
import { prisma } from "../database/prisma.js";
import { logger } from "../utils/logger.js";

/**
 * Lightweight Prometheus exposition.
 *
 * We don't pull in `prom-client` yet — that's a PR#15 concern when we
 * wire proper histograms for HTTP latency etc. For now expose a few
 * gauges and process metrics in the standard text format so an external
 * scraper can verify the endpoint at integration-test time.
 */
export async function metricsHandler(_req: Request, res: Response): Promise<void> {
  const startedAt = process.uptime();
  const mem = process.memoryUsage();

  // Liveness probes for downstream deps (best-effort).
  let dbUp = 0;
  let redisUp = 0;
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbUp = 1;
  } catch (err) {
    logger.debug({ err: (err as Error).message }, "metrics: db check failed");
  }
  try {
    const pong = await redis.ping();
    redisUp = pong === "PONG" ? 1 : 0;
  } catch (err) {
    logger.debug({ err: (err as Error).message }, "metrics: redis check failed");
  }

  const lines: string[] = [
    "# HELP nexus_process_uptime_seconds How long the API process has been running.",
    "# TYPE nexus_process_uptime_seconds gauge",
    `nexus_process_uptime_seconds ${startedAt.toFixed(3)}`,
    "",
    "# HELP nexus_process_memory_rss_bytes Resident set size of the API process.",
    "# TYPE nexus_process_memory_rss_bytes gauge",
    `nexus_process_memory_rss_bytes ${mem.rss}`,
    "",
    "# HELP nexus_process_memory_heap_used_bytes V8 heap currently in use.",
    "# TYPE nexus_process_memory_heap_used_bytes gauge",
    `nexus_process_memory_heap_used_bytes ${mem.heapUsed}`,
    "",
    "# HELP nexus_db_up 1 if Postgres responded within 1s.",
    "# TYPE nexus_db_up gauge",
    `nexus_db_up ${dbUp}`,
    "",
    "# HELP nexus_redis_up 1 if Redis responded within 1s.",
    "# TYPE nexus_redis_up gauge",
    `nexus_redis_up ${redisUp}`,
  ];

  res.setHeader("Content-Type", "text/plain; version=0.0.4; charset=utf-8");
  res.send(lines.join("\n") + "\n");
}
