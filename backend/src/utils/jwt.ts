import jwt, { type SignOptions, type JwtPayload } from "jsonwebtoken";
import type { UserRole } from "@prisma/client";
import { env } from "../config/env.js";
import { AppError } from "./errors.js";

/**
 * Token payloads.
 *
 * Access tokens are short-lived and carry just enough to authorize a
 * request without re-querying the database. Refresh tokens carry only
 * the session id; everything else is loaded from the Session row when
 * rotating.
 */
export interface AccessTokenPayload extends JwtPayload {
  sub: string;            // user id
  role: UserRole;
  username: string;
  // typ helps us reject misuse (e.g. presenting a refresh token as access)
  typ: "access";
}

export interface RefreshTokenPayload extends JwtPayload {
  sub: string;            // user id
  sid: string;            // session id
  typ: "refresh";
}

const ACCESS_OPTS: SignOptions = {
  expiresIn: env.JWT_ACCESS_TTL as SignOptions["expiresIn"],
  issuer: "nexusmarket",
  audience: "nexusmarket-api",
};

const REFRESH_OPTS: SignOptions = {
  expiresIn: env.JWT_REFRESH_TTL as SignOptions["expiresIn"],
  issuer: "nexusmarket",
  audience: "nexusmarket-api",
};

export function signAccessToken(payload: Omit<AccessTokenPayload, "typ" | "iat" | "exp" | "iss" | "aud">): string {
  return jwt.sign({ ...payload, typ: "access" } satisfies Partial<AccessTokenPayload>, env.JWT_ACCESS_SECRET, ACCESS_OPTS);
}

export function signRefreshToken(payload: Omit<RefreshTokenPayload, "typ" | "iat" | "exp" | "iss" | "aud">): string {
  return jwt.sign({ ...payload, typ: "refresh" } satisfies Partial<RefreshTokenPayload>, env.JWT_REFRESH_SECRET, REFRESH_OPTS);
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: "nexusmarket",
    audience: "nexusmarket-api",
  });
  if (typeof decoded === "string" || decoded.typ !== "access") {
    throw AppError.unauthorized("Wrong token type");
  }
  return decoded as AccessTokenPayload;
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: "nexusmarket",
    audience: "nexusmarket-api",
  });
  if (typeof decoded === "string" || decoded.typ !== "refresh") {
    throw AppError.unauthorized("Wrong token type");
  }
  return decoded as RefreshTokenPayload;
}

/**
 * Hash a refresh token for storage. We never store raw refresh tokens —
 * only their SHA-256 digest, so a stolen DB row can't be replayed.
 *
 * SHA-256 is sufficient here: the input is already cryptographically
 * random (signed JWT), so we don't need argon2's slowdown.
 */
import { createHash } from "node:crypto";
export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
