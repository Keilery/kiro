/**
 * Cursor pagination helpers.
 *
 * Strategy: Prisma's `cursor` keyset pagination on the row's `id`. Every
 * paginated query MUST `orderBy` end with a stable `{ id: <dir> }` so
 * that the cursor uniquely anchors a position even when the primary sort
 * column has ties (e.g. two listings created at the same millisecond).
 *
 * The cursor token sent over the wire is the row's id, base64url-encoded
 * to keep it opaque. Encoding is intentionally trivial — there is no
 * security boundary here, only "don't surface raw DB ids in URLs".
 */

import { z } from "zod";

export const DEFAULT_PAGE_SIZE = 24;
export const MAX_PAGE_SIZE = 100;

/** Common shape consumed by every list endpoint. */
export const PaginationQuerySchema = z.object({
  cursor: z.string().min(1).max(256).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).optional(),
});
export type PaginationQuery = z.infer<typeof PaginationQuerySchema>;

export interface Page<T> {
  items: T[];
  nextCursor: string | null;
  hasMore: boolean;
  /** Echo back the effective limit so clients can detect truncation. */
  limit: number;
}

/**
 * Build the Prisma `cursor` / `take` / `skip` fragment from a request
 * query. The caller is responsible for `orderBy` (which must end with
 * `{ id: <dir> }`) and for passing the result of `paginate()` into
 * Prisma's `findMany`.
 *
 * Always fetch `limit + 1` rows so we can detect `hasMore` without a
 * second round trip.
 */
export function paginate(query: PaginationQuery): {
  take: number;
  skip: 0 | 1;
  cursor: { id: string } | undefined;
  limit: number;
} {
  const limit = query.limit ?? DEFAULT_PAGE_SIZE;
  const decoded = query.cursor ? decodeCursor(query.cursor) : null;
  return {
    take: limit + 1,
    // skip:1 jumps past the cursor row itself; without it we'd return
    // the anchor again as the first row of the next page.
    skip: decoded ? 1 : 0,
    cursor: decoded ? { id: decoded } : undefined,
    limit,
  };
}

/** Wrap query results in a paged envelope. `idOf` extracts the row id. */
export function buildPage<T>(rows: T[], limit: number, idOf: (row: T) => string): Page<T> {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  return {
    items,
    hasMore,
    limit,
    nextCursor: hasMore && last ? encodeCursor(idOf(last)) : null,
  };
}

// ─── Cursor encoding ─────────────────────────────────────────────────

function encodeCursor(id: string): string {
  return Buffer.from(id, "utf8").toString("base64url");
}

function decodeCursor(token: string): string | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    // Cuids are alphanumeric; reject anything weirder so we don't pass
    // attacker-controlled strings into Prisma's cursor.
    if (!/^[a-zA-Z0-9_-]{4,128}$/.test(decoded)) return null;
    return decoded;
  } catch {
    return null;
  }
}
