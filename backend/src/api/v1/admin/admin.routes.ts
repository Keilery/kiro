import { buildStubRouter } from "../_stub.js";

export const adminRouter = buildStubRouter("admin", [
  { method: "get",   path: "/stats",                  description: "Headline metrics: GMV, DAU/MAU, conversion, retention, churn",   plannedIn: "PR#8", requiresAuth: true, minRole: "ADMIN" },
  { method: "get",   path: "/users",                  description: "Search and paginate users with filters",                         plannedIn: "PR#8", requiresAuth: true, minRole: "MODERATOR" },
  { method: "patch", path: "/users/:id/ban",          description: "Ban or unban a user (audit-logged)",                             plannedIn: "PR#8", requiresAuth: true, minRole: "ADMIN" },
  { method: "patch", path: "/users/:id/role",         description: "Change a user's role (SUPERADMIN only)",                         plannedIn: "PR#8", requiresAuth: true, minRole: "SUPERADMIN" },
  { method: "patch", path: "/users/:id/verify-seller",description: "Mark a seller as KYC-verified",                                  plannedIn: "PR#8", requiresAuth: true, minRole: "ADMIN" },
  { method: "get",   path: "/listings/pending",       description: "Listings awaiting moderation",                                   plannedIn: "PR#8", requiresAuth: true, minRole: "MODERATOR" },
  { method: "patch", path: "/listings/:id/approve",   description: "Approve a pending listing",                                      plannedIn: "PR#8", requiresAuth: true, minRole: "MODERATOR" },
  { method: "patch", path: "/listings/:id/reject",    description: "Reject a pending listing with a reason",                         plannedIn: "PR#8", requiresAuth: true, minRole: "MODERATOR" },
  { method: "get",   path: "/withdrawals",            description: "Pending withdrawals for review",                                 plannedIn: "PR#8", requiresAuth: true, minRole: "ADMIN" },
  { method: "patch", path: "/withdrawals/:id/approve",description: "Approve a withdrawal",                                           plannedIn: "PR#8", requiresAuth: true, minRole: "ADMIN" },
  { method: "patch", path: "/withdrawals/:id/reject", description: "Reject a withdrawal with a reason",                              plannedIn: "PR#8", requiresAuth: true, minRole: "ADMIN" },
  { method: "get",   path: "/promos",                 description: "Manage promo codes",                                             plannedIn: "PR#8", requiresAuth: true, minRole: "ADMIN" },
  { method: "post",  path: "/promos",                 description: "Create a promo code",                                            plannedIn: "PR#8", requiresAuth: true, minRole: "ADMIN" },
  { method: "get",   path: "/audit-log",              description: "Audit log of administrative actions",                            plannedIn: "PR#8", requiresAuth: true, minRole: "ADMIN" },
  { method: "post",  path: "/cache/flush",            description: "Flush an entire cache namespace (Redis)",                        plannedIn: "PR#8", requiresAuth: true, minRole: "SUPERADMIN" },
]);
