import { z } from "zod";
import { PaginationQuerySchema } from "../../../utils/pagination.js";

/**
 * Review DTOs.
 *
 * One review per (author, order) is enforced by a unique constraint at
 * the database level — see Review @@unique([authorId, orderId]) in the
 * schema. The service still checks first to return a friendly 409
 * before bouncing off the constraint.
 *
 * Image URLs are accepted, not uploaded blobs. Direct uploads land in
 * PR#15 once the S3 client is wired; for now the frontend will use the
 * /uploads endpoint (also PR#15) and pass the resulting URL here.
 */

export const ReviewCreateSchema = z.object({
  /** The completed order this review is tied to. */
  orderId: z.string().cuid(),
  rating: z.number().int().min(1).max(5),
  body: z.string().max(2000).optional(),
  imageUrls: z.array(z.string().url().max(2048)).max(4).optional(),
});

export const ReviewReplySchema = z.object({
  reply: z.string().min(1).max(2000),
});

export const ReviewListQuerySchema = PaginationQuerySchema.extend({
  /** When listing reviews for a seller's profile. */
  ratingMin: z.coerce.number().int().min(1).max(5).optional(),
  /** Hide unpublished (e.g. hidden by mods) — sellers can opt-in to seeing them on their own dashboard. */
  includeHidden: z.coerce.boolean().optional(),
});

export const ReviewIdParam = z.object({ id: z.string().cuid() });

export type ReviewCreateInput = z.infer<typeof ReviewCreateSchema>;
export type ReviewReplyInput = z.infer<typeof ReviewReplySchema>;
export type ReviewListQuery = z.infer<typeof ReviewListQuerySchema>;
