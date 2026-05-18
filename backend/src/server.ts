import http from "node:http";
import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./utils/logger.js";
import { disconnectPrisma } from "./database/prisma.js";
import { disconnectRedis } from "./database/redis.js";
import { initWebSocket, closeWebSocket } from "./websocket/index.js";
import { startWorkers, stopWorkers } from "./jobs/index.js";

const app = buildApp();
const server = http.createServer(app);

// Attach Socket.io to the same HTTP server so it shares PORT.
initWebSocket(server);

// Spin up BullMQ workers in-process for dev. In production split this
// into a dedicated worker container by setting WORKER_ENABLED=false.
if (env.WORKER_ENABLED) {
  startWorkers();
}

server.listen(env.PORT, env.HOST, () => {
  logger.info({ port: env.PORT, host: env.HOST, env: env.NODE_ENV }, "API listening");
});

// ─── Graceful shutdown ────────────────────────────────────────────────
let shuttingDown = false;
async function shutdown(signal: NodeJS.Signals): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  logger.info({ signal }, "shutting down gracefully");

  // Stop accepting new connections, but let in-flight requests finish.
  server.close((err) => {
    if (err) logger.error({ err: err.message }, "error closing http server");
  });

  // Hard timeout — never hang past 15s.
  const killTimer = setTimeout(() => {
    logger.warn("forcing exit after 15s shutdown timeout");
    process.exit(1);
  }, 15_000);
  killTimer.unref();

  await Promise.allSettled([closeWebSocket(), stopWorkers(), disconnectPrisma(), disconnectRedis()]);
  process.exit(0);
}

(["SIGINT", "SIGTERM"] as const).forEach((s) => process.on(s, () => void shutdown(s)));

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "unhandledRejection");
});
process.on("uncaughtException", (err) => {
  logger.fatal({ err: err.message, stack: err.stack }, "uncaughtException");
  // Attempt graceful shutdown, then bail
  void shutdown("SIGTERM");
});
