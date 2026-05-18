import { z } from "zod";

/**
 * Auth DTOs.
 *
 * Hard rules — failure here returns 422 from the global error handler.
 * Soft feedback (e.g. password strength) belongs in the UI.
 */

export const RegisterSchema = z.object({
  email: z.string().email().max(254).toLowerCase(),
  username: z
    .string()
    .min(3)
    .max(32)
    .regex(/^[a-z0-9_]+$/, "lowercase letters, digits, underscore only"),
  password: z
    .string()
    .min(10, "Password must be at least 10 characters")
    .max(128)
    .regex(/[A-Za-z]/, "Password must contain a letter")
    .regex(/\d/, "Password must contain a digit"),
  displayName: z.string().min(1).max(64).optional(),
  // For invite-only flows; ignored if empty
  referralCode: z.string().min(4).max(32).optional(),
});

export const LoginSchema = z.object({
  // Login by email OR username — accept either
  identifier: z.string().min(3).max(254),
  password: z.string().min(1).max(128),
});

export const RefreshSchema = z.object({
  refreshToken: z.string().min(20),
});

export const LogoutSchema = z.object({
  refreshToken: z.string().min(20).optional(),
  // If true, terminate every active session for this user (used by
  // "log out everywhere" flow on the security page).
  allDevices: z.boolean().optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
export type RefreshInput = z.infer<typeof RefreshSchema>;
export type LogoutInput = z.infer<typeof LogoutSchema>;
