import { z } from "zod";
import { OrderStatus } from "@prisma/client";
import { PaginationQuerySchema } from "../../../utils/pagination.js";

/**
 * Order DTOs.
 *
 * v1 of the orders module accepts only single-listing orders (one
 * OrderItem per Order). Multi-item carts arrive in PR#5 with the
 * official-shop module — the schema already supports it, the API
 * layer just doesn't expose it yet.
 *
 * Promo codes are validated by the payments module (PR#10); we accept
 * the raw string here and forward it to the service which delegates.
 */

export const OrderCreateSchema = z.object({
  listingId: z.string().cuid(),
  quantity: z.number().int().min(1).max(100).default(1),
  promoCode: z.string().min(2).max(64).optional(),
  /**
   * Free-form note from the buyer to the seller (e.g. "deliver to my
   * Steam account NextLevel#1234"). Capped tightly to dissuade abuse
   * — chat lives in the order thread, not here.
   */
  buyerNote: z.string().max(500).optional(),
});

export const OrderListQuerySchema = PaginationQuerySchema.extend({
  /** Default scope is "as buyer". Sellers must opt in explicitly. */
  role: z.enum(["buyer", "seller"]).default("buyer"),
  status: z.nativeEnum(OrderStatus).optional(),
});

export const DisputeOpenSchema = z.object({
  reason: z.string().min(4).max(120),
  details: z.string().max(4000).optional(),
});

/**
 * Resolution shapes the moderator picks from when closing a dispute.
 * "split" keeps the door open for partial refunds in future iterations
 * — for v1 we only honor refund / release.
 */
export const DisputeResolveSchema = z
  .object({
    resolution: z.enum(["refund", "release", "split"]),
    /** Required for "split" — the percent (0-100) of the order total to refund to the buyer. */
    refundPercent: z.number().int().min(1).max(99).optional(),
    note: z.string().max(2000).optional(),
  })
  .refine((v) => v.resolution !== "split" || v.refundPercent != null, {
    message: "refundPercent is required when resolution=split",
    path: ["refundPercent"],
  });

export const OrderIdParam = z.object({ id: z.string().cuid() });

export type OrderCreateInput = z.infer<typeof OrderCreateSchema>;
export type OrderListQuery = z.infer<typeof OrderListQuerySchema>;
export type DisputeOpenInput = z.infer<typeof DisputeOpenSchema>;
export type DisputeResolveInput = z.infer<typeof DisputeResolveSchema>;
