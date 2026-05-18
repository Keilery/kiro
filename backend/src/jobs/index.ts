import type { Worker, Queue } from "bullmq";
import { logger } from "../utils/logger.js";
import { rentalExpiryQueue, rentalExpiryWorker, scheduleRentalExpiryRecurring } from "./rentalExpiry.job.js";

/**
 * Background-job lifecycle.
 *
 * `startWorkers()` is called from server.ts when WORKER_ENABLED=true.
 * In production you'd typically split this into a separate container
 * by setting WORKER_ENABLED=false on API replicas and =true on a
 * dedicated worker pool.
 *
 * Adding a new job:
 *   1. Create `src/jobs/<name>.job.ts` exporting Queue + Worker + scheduler.
 *   2. Register them here in QUEUES and WORKERS.
 */

const QUEUES: Queue[] = [rentalExpiryQueue];
const WORKERS: Worker[] = [rentalExpiryWorker];

let started = false;

export function startWorkers(): void {
  if (started) return;
  started = true;

  // Schedule the recurring jobs once per process. BullMQ deduplicates
  // by the repeat key, so calling this on every replica is safe.
  void scheduleRentalExpiryRecurring().catch((err) =>
    logger.error({ err: (err as Error).message }, "failed to schedule rental-expiry job"),
  );

  for (const w of WORKERS) {
    w.on("ready", () => logger.info({ src: "jobs", queue: w.name }, "worker ready"));
    w.on("failed", (job, err) =>
      logger.warn({ src: "jobs", queue: w.name, jobId: job?.id, err: err?.message }, "job failed"),
    );
    w.on("error", (err) =>
      logger.error({ src: "jobs", queue: w.name, err: err.message }, "worker error"),
    );
  }

  logger.info({ count: WORKERS.length }, "background workers started");
}

export async function stopWorkers(): Promise<void> {
  if (!started) return;
  await Promise.allSettled([
    ...WORKERS.map((w) => w.close()),
    ...QUEUES.map((q) => q.close()),
  ]);
  started = false;
}
