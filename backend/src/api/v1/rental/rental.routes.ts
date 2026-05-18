import { buildStubRouter } from "../_stub.js";

export const rentalRouter = buildStubRouter("rental", [
  { method: "get",   path: "/games",                description: "Catalog of games available for rental, with plans",      plannedIn: "PR#6" },
  { method: "get",   path: "/games/:slug",          description: "Game detail with screenshots, requirements, plan list",  plannedIn: "PR#6" },
  { method: "get",   path: "/availability/:gameId", description: "Live unit availability — count, ETA, queue length",      plannedIn: "PR#6" },
  { method: "post",  path: "/rentals",              description: "Reserve and pay for a rental on a chosen plan",          plannedIn: "PR#6", requiresAuth: true },
  { method: "get",   path: "/rentals/me",           description: "Active and historical rentals of the current user",      plannedIn: "PR#6", requiresAuth: true },
  { method: "post",  path: "/rentals/:id/extend",   description: "Extend an active rental",                                 plannedIn: "PR#6", requiresAuth: true },
  { method: "post",  path: "/rentals/:id/cancel",   description: "Cancel a rental (within grace period for a refund)",      plannedIn: "PR#6", requiresAuth: true },
  { method: "get",   path: "/rentals/:id/access",   description: "One-time launch credentials (auto-login)",                plannedIn: "PR#6", requiresAuth: true },
]);
