import { Router, type Request, type Response } from "express";
import { rateLimit } from "../../../middleware/rateLimit.js";
import { requireAuth } from "../../../middleware/auth.js";
import { validate } from "../../../utils/validate.js";
import { asyncHandler } from "../../../utils/asyncHandler.js";
import { AppError } from "../../../utils/errors.js";
import {
  RegisterSchema,
  LoginSchema,
  RefreshSchema,
  LogoutSchema,
} from "./auth.dto.js";
import * as service from "./auth.service.js";

const router = Router();

/** Strict per-IP limiter for credential-bearing endpoints — anti brute-force. */
const credentialLimiter = rateLimit({
  windowMs: 15 * 60_000, // 15 minutes
  max: 30,
  key: "auth-cred",
});

function ctxFromReq(req: Request) {
  return {
    ip: req.ip,
    userAgent: req.get("user-agent") ?? undefined,
    deviceLabel: (req.get("x-device-label") as string | undefined) ?? undefined,
    fingerprint: (req.get("x-device-fingerprint") as string | undefined) ?? undefined,
  };
}

router.post(
  "/register",
  credentialLimiter,
  validate({ body: RegisterSchema }),
  asyncHandler(async (req, res) => {
    const result = await service.register(req.body, ctxFromReq(req));
    res.status(201).json(result);
  }),
);

router.post(
  "/login",
  credentialLimiter,
  validate({ body: LoginSchema }),
  asyncHandler(async (req, res) => {
    const result = await service.login(req.body, ctxFromReq(req));
    res.json(result);
  }),
);

router.post(
  "/refresh",
  rateLimit({ windowMs: 60_000, max: 60, key: "auth-refresh" }),
  validate({ body: RefreshSchema }),
  asyncHandler(async (req, res) => {
    const result = await service.refresh(req.body.refreshToken, ctxFromReq(req));
    res.json(result);
  }),
);

router.post(
  "/logout",
  requireAuth,
  validate({ body: LogoutSchema }),
  asyncHandler(async (req, res) => {
    if (!req.user) throw AppError.unauthorized();
    const result = await service.logout({
      userId: req.user.sub,
      refreshToken: req.body.refreshToken,
      allDevices: req.body.allDevices,
    });
    res.json(result);
  }),
);

router.get(
  "/me",
  requireAuth,
  asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw AppError.unauthorized();
    const user = await service.me(req.user.sub);
    res.json({ user });
  }),
);

export { router as authRouter };
