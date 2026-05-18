import { buildStubRouter } from "../_stub.js";

export const usersRouter = buildStubRouter("users", [
  { method: "get",   path: "/me/profile",      description: "Extended profile of the authenticated user (badges, stats, level)", plannedIn: "PR#13", requiresAuth: true },
  { method: "patch", path: "/me/profile",      description: "Update profile (avatar, banner, bio, preferences)",                  plannedIn: "PR#13", requiresAuth: true },
  { method: "get",   path: "/me/sessions",     description: "List active sessions and devices",                                   plannedIn: "PR#13", requiresAuth: true },
  { method: "delete",path: "/me/sessions/:id", description: "Revoke a specific session",                                          plannedIn: "PR#13", requiresAuth: true },
  { method: "post",  path: "/me/2fa/totp",     description: "Enable TOTP 2FA — returns provisioning URI",                         plannedIn: "PR#13", requiresAuth: true },
  { method: "delete",path: "/me/2fa/totp",     description: "Disable TOTP 2FA",                                                   plannedIn: "PR#13", requiresAuth: true },
  { method: "get",   path: "/:username",       description: "Public seller storefront by username",                               plannedIn: "PR#13" },
  { method: "post",  path: "/:id/follow",      description: "Subscribe to a seller's new listings",                               plannedIn: "PR#13", requiresAuth: true },
  { method: "post",  path: "/:id/block",       description: "Block another user",                                                 plannedIn: "PR#13", requiresAuth: true },
  { method: "post",  path: "/:id/report",      description: "Submit an abuse report",                                             plannedIn: "PR#13", requiresAuth: true },
]);
