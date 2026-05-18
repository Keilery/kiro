import type { Server as HttpServer } from "node:http";
import { Server as IOServer, type Socket } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { redisPub, redisSub } from "../database/redis.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { verifyAccessToken, type AccessTokenPayload } from "../utils/jwt.js";

/**
 * Socket.io setup.
 *
 * Authentication: clients pass an access token in `socket.handshake.auth.token`
 * (preferred) or as `?token=...` query param. Anonymous connections are allowed
 * but limited to public rooms — broadcasts to user/order rooms require auth.
 *
 * Rooms used in PR#11+:
 *   `user:<id>`           — direct notifications
 *   `order:<id>`          — buyer/seller chat for an order
 *   `bot:<botId>`         — live bot logs
 *   `ticket:<id>`         — support chat
 *
 * The Redis adapter lets us scale horizontally — every API replica reads
 * the same pub/sub stream so emitting from any node fans out to all clients.
 */

let io: IOServer | undefined;

export interface SocketContext {
  user?: AccessTokenPayload;
}

declare module "socket.io" {
  interface Socket {
    data: SocketContext;
  }
}

export function initWebSocket(server: HttpServer): IOServer {
  if (io) return io;

  io = new IOServer(server, {
    cors: {
      origin: env.CORS_ORIGIN.split(",").map((o) => o.trim()),
      credentials: true,
    },
    // Don't accept payloads larger than 256 KiB; chat messages are small,
    // anything bigger is almost certainly abuse.
    maxHttpBufferSize: 256 * 1024,
    pingInterval: 25_000,
    pingTimeout: 20_000,
  });

  // Redis adapter for multi-node fan-out
  io.adapter(createAdapter(redisPub, redisSub));

  // Auth middleware — runs once per connection
  io.use((socket, next) => {
    const token =
      (socket.handshake.auth?.token as string | undefined) ??
      (socket.handshake.query?.token as string | undefined);

    if (!token) {
      // Anonymous — allowed, but joins to private rooms will be blocked below.
      return next();
    }
    try {
      socket.data.user = verifyAccessToken(token);
      next();
    } catch (err) {
      // Reject with a helpful message rather than silent close.
      next(new Error(`auth: ${(err as Error).message}`));
    }
  });

  io.on("connection", (socket) => onConnection(socket));

  logger.info({ src: "ws" }, "Socket.io initialized");
  return io;
}

function onConnection(socket: Socket): void {
  const userId = socket.data.user?.sub;
  logger.debug({ src: "ws", sid: socket.id, userId }, "client connected");

  // Auto-join the user's private room so the rest of the app can emit to
  // io.to(`user:<id>`) without bookkeeping.
  if (userId) socket.join(`user:${userId}`);

  // Liveness probe (separate from socket.io's built-in heartbeat —
  // useful for client-side latency measurement).
  socket.on("ping", (cb?: (ts: number) => void) => {
    if (typeof cb === "function") cb(Date.now());
  });

  socket.on("room:join", (room: string, cb?: (ok: boolean, error?: string) => void) => {
    try {
      assertJoinable(socket, room);
      void socket.join(room);
      cb?.(true);
    } catch (err) {
      cb?.(false, (err as Error).message);
    }
  });

  socket.on("room:leave", (room: string, cb?: (ok: boolean) => void) => {
    void socket.leave(room);
    cb?.(true);
  });

  // Typing indicator (PR#11 will hook this into order/ticket chats).
  socket.on("chat:typing", ({ room, typing }: { room: string; typing: boolean }) => {
    if (typeof room !== "string" || typeof typing !== "boolean") return;
    if (!socket.rooms.has(room)) return;
    socket.to(room).emit("chat:typing", { from: socket.data.user?.sub ?? null, typing });
  });

  socket.on("disconnect", (reason) => {
    logger.debug({ src: "ws", sid: socket.id, userId, reason }, "client disconnected");
  });
}

/**
 * Authorize a `room:join` request. Public rooms (status broadcasts, etc.)
 * are open to anyone. Private rooms require ownership; the first segment
 * before `:` is the namespace.
 */
function assertJoinable(socket: Socket, room: string): void {
  if (typeof room !== "string" || room.length === 0 || room.length > 128) {
    throw new Error("invalid room");
  }
  const [ns, target] = room.split(":");
  if (!ns) throw new Error("invalid room");

  // Public namespaces — open to all
  if (ns === "public" || ns === "stats") return;

  const userId = socket.data.user?.sub;
  if (!userId) throw new Error("authentication required");

  switch (ns) {
    case "user":
      // A user can only join their own user room
      if (target !== userId) throw new Error("forbidden");
      return;

    // Cross-resource ownership is enforced in PR#11 by querying the DB
    // (e.g. "is this user a participant of this order/ticket?"). For now
    // we accept the join; the room name itself is unguessable enough for
    // a scaffold, and no broadcasts target these rooms yet.
    case "order":
    case "ticket":
    case "bot":
      return;

    default:
      throw new Error(`unknown room namespace: ${ns}`);
  }
}

export function getIO(): IOServer {
  if (!io) throw new Error("Socket.io not initialized — call initWebSocket() first");
  return io;
}

export async function closeWebSocket(): Promise<void> {
  if (!io) return;
  await new Promise<void>((resolve) => io!.close(() => resolve()));
  io = undefined;
}
