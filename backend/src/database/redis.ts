import IORedis, { type Redis } from "ioredis";
import { env, isProd } from "../config/env.js";
import { logger } from "../utils/logger.js";

/**
 * Redis singletons.
 *
 * - `redis` — general-purpose client (caching, sessions, rate limit).
 * - `redisSub` / `redisPub` — pub/sub pair for Socket.io and notifications.
 * - `redisQueue` — BullMQ requires its own client with `maxRetriesPerRequest=null`.
 *
 * All four share the same URL but separate connections, which is the
 * pattern documented by ioredis and BullMQ.
 */
declare global {
  // eslint-disable-next-line no-var
  var __redis: Redis | undefined;
  // eslint-disable-next-line no-var
  var __redisSub: Redis | undefined;
  // eslint-disable-next-line no-var
  var __redisPub: Redis | undefined;
  // eslint-disable-next-line no-var
  var __redisQueue: Redis | undefined;
}

function makeClient(label: string, opts: Partial<ConstructorParameters<typeof IORedis>[1]> = {}): Redis {
  const client = new IORedis(env.REDIS_URL, {
    lazyConnect: false,
    enableReadyCheck: true,
    ...opts,
  });
  client.on("error", (err) => logger.error({ src: "redis", label, err: err.message }, "redis error"));
  client.on("connect", () => logger.debug({ src: "redis", label }, "redis connected"));
  return client;
}

export const redis: Redis = global.__redis ?? makeClient("default");
export const redisSub: Redis = global.__redisSub ?? makeClient("sub");
export const redisPub: Redis = global.__redisPub ?? makeClient("pub");
// BullMQ requires { maxRetriesPerRequest: null }
export const redisQueue: Redis =
  global.__redisQueue ?? makeClient("queue", { maxRetriesPerRequest: null });

if (!isProd) {
  global.__redis = redis;
  global.__redisSub = redisSub;
  global.__redisPub = redisPub;
  global.__redisQueue = redisQueue;
}

export async function disconnectRedis(): Promise<void> {
  await Promise.allSettled([
    redis.quit(),
    redisSub.quit(),
    redisPub.quit(),
    redisQueue.quit(),
  ]);
}
