import { buildStubRouter } from "../_stub.js";

export const ordersRouter = buildStubRouter("orders", [
  { method: "get",   path: "/",                      description: "List orders for the current user (buyer+seller views)",        plannedIn: "PR#3", requiresAuth: true },
  { method: "post",  path: "/",                      description: "Create an order (initiates escrow + payment intent)",          plannedIn: "PR#3", requiresAuth: true },
  { method: "get",   path: "/:id",                   description: "Order details with items, transactions, dispute thread",       plannedIn: "PR#3", requiresAuth: true },
  { method: "patch", path: "/:id/confirm",           description: "Buyer confirms receipt → escrow released to seller",           plannedIn: "PR#3", requiresAuth: true },
  { method: "patch", path: "/:id/cancel",            description: "Cancel an unpaid order",                                       plannedIn: "PR#3", requiresAuth: true },
  { method: "post",  path: "/:id/dispute",           description: "Open a dispute — moves status to DISPUTED",                    plannedIn: "PR#3", requiresAuth: true },
  { method: "post",  path: "/:id/dispute/resolve",   description: "Moderator resolves a dispute (refund / release / split)",      plannedIn: "PR#3", requiresAuth: true, minRole: "MODERATOR" },
  { method: "post",  path: "/:id/messages",          description: "Send a message in the buyer↔seller chat for this order",       plannedIn: "PR#4 + PR#11", requiresAuth: true },
  { method: "get",   path: "/:id/messages",          description: "List messages in the buyer↔seller chat",                       plannedIn: "PR#4 + PR#11", requiresAuth: true },
  { method: "get",   path: "/:id/invoice",           description: "Download invoice as PDF",                                      plannedIn: "PR#3", requiresAuth: true },
]);
