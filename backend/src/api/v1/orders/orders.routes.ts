import { Router } from "express";
import { UserRole } from "@prisma/client";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { validate } from "../../../utils/validate.js";
import { requireAuth, requireRole } from "../../../middleware/auth.js";
import { rateLimit } from "../../../middleware/rateLimit.js";
import { AppError } from "../../../utils/errors.js";
import {
  OrderCreateSchema,
  OrderListQuerySchema,
  DisputeOpenSchema,
  DisputeResolveSchema,
  OrderIdParam,
} from "./orders.dto.js";
import * as svc from "./orders.service.js";

/**
 * Orders HTTP layer.
 *
 * Auth model:
 *   - All endpoints require auth (no public order surface).
 *   - The service layer enforces buyer-or-seller ownership on each
 *     order; the dispute-resolve endpoint additionally requires
 *     MODERATOR+.
 *
 * Rate limits:
 *   - Order creation is the most expensive call (locks listing row,
 *     runs a multi-step transaction). Tighter limit so we shed load
 *     under bot-driven scraping.
 *   - State transitions stay generous to avoid frustrating real users
 *     who tap "confirm" twice on a slow connection.
 */

const router = Router();

const checkoutLimiter = rateLimit({ windowMs: 60_000, max: 20, key: "order-create" });
const transitionLimiter = rateLimit({ windowMs: 60_000, max: 60, key: "order-transition" });

router.get("/", requireAuth, validate({ query: OrderListQuerySchema }), asyncHandler(async (req, res) => {
  if (!req.user) throw AppError.unauthorized();
  const page = await svc.listOrders(req.user.sub, req.query as never);
  res.json(page);
}));

router.post(
  "/",
  requireAuth,
  checkoutLimiter,
  validate({ body: OrderCreateSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    const order = await svc.createOrder(req.user.sub, req.body);
    res.status(201).json({ order });
  }),
);

router.get(
  "/:id",
  requireAuth,
  validate({ params: OrderIdParam }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    const isMod =
      req.user.role === UserRole.MODERATOR ||
      req.user.role === UserRole.ADMIN ||
      req.user.role === UserRole.SUPERADMIN;
    const order = await svc.getOrder(req.user.sub, req.params.id, isMod);
    res.json({ order });
  }),
);

router.patch(
  "/:id/deliver",
  requireAuth,
  requireRole(UserRole.SELLER),
  transitionLimiter,
  validate({ params: OrderIdParam }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    const order = await svc.markDelivered(req.user.sub, req.params.id);
    res.json({ order });
  }),
);

router.patch(
  "/:id/confirm",
  requireAuth,
  transitionLimiter,
  validate({ params: OrderIdParam }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    const order = await svc.confirmOrder(req.user.sub, req.params.id);
    res.json({ order });
  }),
);

router.patch(
  "/:id/cancel",
  requireAuth,
  transitionLimiter,
  validate({ params: OrderIdParam }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    const order = await svc.cancelOrder(req.user.sub, req.params.id);
    res.json({ order });
  }),
);

router.post(
  "/:id/dispute",
  requireAuth,
  transitionLimiter,
  validate({ params: OrderIdParam, body: DisputeOpenSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    const order = await svc.openDispute(req.user.sub, req.params.id, req.body);
    res.json({ order });
  }),
);

router.post(
  "/:id/dispute/resolve",
  requireAuth,
  requireRole(UserRole.MODERATOR),
  transitionLimiter,
  validate({ params: OrderIdParam, body: DisputeResolveSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    const order = await svc.resolveDispute(req.user.sub, req.params.id, req.body);
    res.json({ order });
  }),
);

export { router as ordersRouter };
