import { prisma } from "../../../database/prisma.js";
import { AppError } from "../../../utils/errors.js";
import { hashPassword, verifyPassword } from "../../../utils/password.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashRefreshToken,
} from "../../../utils/jwt.js";
import { logger } from "../../../utils/logger.js";
import {
  AccountStatus,
  AuthProvider,
  Prisma,
  UserRole,
  type User,
} from "@prisma/client";
import type { RegisterInput, LoginInput } from "./auth.dto.js";

/** What we hand back to the client after auth succeeds. */
export interface AuthResult {
  user: PublicUser;
  accessToken: string;
  refreshToken: string;
}

export interface PublicUser {
  id: string;
  email: string;
  username: string;
  displayName: string | null;
  role: UserRole;
  status: AccountStatus;
  emailVerifiedAt: Date | null;
  avatarUrl: string | null;
}

function publicUser(u: User): PublicUser {
  return {
    id: u.id,
    email: u.email,
    username: u.username,
    displayName: u.displayName,
    role: u.role,
    status: u.status,
    emailVerifiedAt: u.emailVerifiedAt,
    avatarUrl: u.avatarUrl,
  };
}

/**
 * Resolve the refresh-token TTL into a concrete expiry Date.
 *
 * We can't just trust the JWT's `exp` because we want to delete sessions
 * deterministically from a worker. Mirror the env value here.
 */
import { env } from "../../../config/env.js";
function refreshExpiresAt(): Date {
  // The TTL string is something like "30d" / "12h". Use a minimal parser
  // — full date-fns is overkill for one shape.
  const match = /^(\d+)([smhdw])$/.exec(env.JWT_REFRESH_TTL);
  if (!match) {
    throw new Error(`Cannot parse JWT_REFRESH_TTL=${env.JWT_REFRESH_TTL}`);
  }
  const [, n, unit] = match;
  const value = Number(n);
  const ms =
    unit === "s" ? value * 1_000 :
    unit === "m" ? value * 60_000 :
    unit === "h" ? value * 3_600_000 :
    unit === "d" ? value * 86_400_000 :
    /* w */        value * 604_800_000;
  return new Date(Date.now() + ms);
}

interface SessionContext {
  ip?: string;
  userAgent?: string;
  deviceLabel?: string;
  fingerprint?: string;
  rotatedFromId?: string;
}

/**
 * Create a session row + matching refresh token for a user.
 * Returns the raw refresh token (only place we ever see it in plaintext).
 */
async function issueSession(user: User, ctx: SessionContext): Promise<{
  refreshToken: string;
  sessionId: string;
}> {
  // Allocate the session id first so the JWT can carry it.
  const session = await prisma.session.create({
    data: {
      userId: user.id,
      // Placeholder — overwritten below once the token is signed.
      refreshTokenHash: `pending:${crypto.randomUUID()}`,
      expiresAt: refreshExpiresAt(),
      ip: ctx.ip,
      userAgent: ctx.userAgent,
      deviceLabel: ctx.deviceLabel,
      fingerprint: ctx.fingerprint,
      rotatedFromId: ctx.rotatedFromId,
    },
  });

  const refreshToken = signRefreshToken({ sub: user.id, sid: session.id });
  await prisma.session.update({
    where: { id: session.id },
    data: { refreshTokenHash: hashRefreshToken(refreshToken) },
  });

  return { refreshToken, sessionId: session.id };
}

function issueAccessToken(user: User): string {
  return signAccessToken({ sub: user.id, role: user.role, username: user.username });
}

// ─── Public API ──────────────────────────────────────────────────────

export async function register(input: RegisterInput, ctx: SessionContext): Promise<AuthResult> {
  const passwordHash = await hashPassword(input.password);

  let created: User;
  try {
    created = await prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        displayName: input.displayName,
        passwordHash,
        authProvider: AuthProvider.PASSWORD,
        role: UserRole.USER,
        status: AccountStatus.PENDING_VERIFICATION,
      },
    });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.[0] ?? "field";
      throw AppError.conflict(`A user with this ${target} already exists`);
    }
    throw err;
  }

  // TODO(PR#11): enqueue verification email and trigger ACCOUNT_LOGIN notification.
  // Optional referral linking
  if (input.referralCode) {
    const referrer = await prisma.user.findFirst({
      where: { customSlug: input.referralCode },
      select: { id: true },
    });
    if (referrer && referrer.id !== created.id) {
      await prisma.referral.create({
        data: { referrerId: referrer.id, refereeId: created.id, code: input.referralCode },
      }).catch((e) => logger.warn({ err: (e as Error).message }, "referral link failed (non-fatal)"));
    }
  }

  const { refreshToken } = await issueSession(created, ctx);
  return {
    user: publicUser(created),
    accessToken: issueAccessToken(created),
    refreshToken,
  };
}

export async function login(input: LoginInput, ctx: SessionContext): Promise<AuthResult> {
  const isEmail = input.identifier.includes("@");
  const where: Prisma.UserWhereInput = isEmail
    ? { email: input.identifier.toLowerCase() }
    : { username: input.identifier.toLowerCase() };

  const user = await prisma.user.findFirst({ where });

  // Run verifyPassword whether or not the user exists, so that response
  // time is roughly constant — denies user enumeration via timing.
  const fakeHash = "$argon2id$v=19$m=19456,t=2,p=1$" + "x".repeat(22) + "$" + "y".repeat(43);
  const ok = await verifyPassword(user?.passwordHash ?? fakeHash, input.password);

  if (!user || !user.passwordHash || !ok) {
    throw AppError.unauthorized("Invalid credentials");
  }
  if (user.status === AccountStatus.BANNED) {
    throw AppError.forbidden("Account is banned");
  }

  const { refreshToken } = await issueSession(user, ctx);
  return {
    user: publicUser(user),
    accessToken: issueAccessToken(user),
    refreshToken,
  };
}

/**
 * Rotate a refresh token.
 *
 * Single-use refresh tokens (per OWASP guidance): on every refresh we
 * mint a new pair AND revoke the old session. If the same refresh token
 * is presented twice, the second attempt fails — a sign of theft, so we
 * also revoke every session of that user as a defensive sweep.
 */
export async function refresh(rawRefreshToken: string, ctx: SessionContext): Promise<AuthResult> {
  let payload: { sub: string; sid: string };
  try {
    payload = verifyRefreshToken(rawRefreshToken);
  } catch {
    throw AppError.unauthorized("Invalid refresh token");
  }

  const tokenHash = hashRefreshToken(rawRefreshToken);
  const session = await prisma.session.findUnique({
    where: { id: payload.sid },
    include: { user: true },
  });

  if (!session || session.userId !== payload.sub) {
    throw AppError.unauthorized("Session not found");
  }
  if (session.revokedAt) {
    // Reuse of a revoked token → likely theft. Revoke all live sessions.
    logger.warn({ userId: session.userId, sessionId: session.id }, "refresh token reuse detected");
    await prisma.session.updateMany({
      where: { userId: session.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw AppError.unauthorized("Token reuse detected — all sessions revoked");
  }
  if (session.refreshTokenHash !== tokenHash) {
    throw AppError.unauthorized("Token mismatch");
  }
  if (session.expiresAt.getTime() < Date.now()) {
    throw AppError.unauthorized("Refresh token expired");
  }
  if (session.user.status === AccountStatus.BANNED) {
    throw AppError.forbidden("Account is banned");
  }

  // Atomic rotate: revoke old + create new in a single transaction.
  const newRefresh = await prisma.$transaction(async (tx) => {
    await tx.session.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    const newSession = await tx.session.create({
      data: {
        userId: session.userId,
        refreshTokenHash: `pending:${crypto.randomUUID()}`,
        expiresAt: refreshExpiresAt(),
        ip: ctx.ip,
        userAgent: ctx.userAgent,
        deviceLabel: ctx.deviceLabel,
        fingerprint: ctx.fingerprint,
        rotatedFromId: session.id,
      },
    });

    const token = signRefreshToken({ sub: session.userId, sid: newSession.id });
    await tx.session.update({
      where: { id: newSession.id },
      data: { refreshTokenHash: hashRefreshToken(token) },
    });
    return token;
  });

  return {
    user: publicUser(session.user),
    accessToken: issueAccessToken(session.user),
    refreshToken: newRefresh,
  };
}

/**
 * Revoke a session (or every session of the user).
 *
 * Logout doesn't strictly need the refresh token — possessing a valid
 * access token is enough — but if the client supplies the refresh token
 * we can target exactly that session.
 */
export async function logout(opts: {
  userId: string;
  refreshToken?: string;
  allDevices?: boolean;
}): Promise<{ revoked: number }> {
  if (opts.allDevices) {
    const result = await prisma.session.updateMany({
      where: { userId: opts.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { revoked: result.count };
  }

  if (opts.refreshToken) {
    const tokenHash = hashRefreshToken(opts.refreshToken);
    const result = await prisma.session.updateMany({
      where: { userId: opts.userId, refreshTokenHash: tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { revoked: result.count };
  }

  // Fallback: revoke the most recently active session of this user.
  const last = await prisma.session.findFirst({
    where: { userId: opts.userId, revokedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!last) return { revoked: 0 };
  await prisma.session.update({ where: { id: last.id }, data: { revokedAt: new Date() } });
  return { revoked: 1 };
}

export async function me(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw AppError.notFound("User");
  return publicUser(user);
}
