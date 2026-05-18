import { Router } from "express";
import { authRouter } from "./auth/auth.routes.js";
import { usersRouter } from "./users/users.routes.js";
import { marketplaceRouter } from "./marketplace/marketplace.routes.js";
import { ordersRouter } from "./orders/orders.routes.js";
import { paymentsRouter } from "./payments/payments.routes.js";
import { automationRouter } from "./automation/automation.routes.js";
import { rentalRouter } from "./rental/rental.routes.js";
import { supportRouter } from "./support/support.routes.js";
import { adminRouter } from "./admin/admin.routes.js";
import { notificationsRouter } from "./notifications/notifications.routes.js";
import { analyticsRouter } from "./analytics/analytics.routes.js";

/**
 * Aggregating v1 router. Only `auth` is fully implemented in this PR;
 * the other modules respond with 501 + a description of the future
 * endpoint and the PR it lands in.
 */
export const v1Router = Router();

// Surface a discovery endpoint that lists installed modules
v1Router.get("/", (_req, res) => {
  res.json({
    api: "nexusmarket",
    version: "v1",
    modules: [
      { name: "auth",          status: "implemented", path: "/api/v1/auth" },
      { name: "users",         status: "stub",        path: "/api/v1/users",         plannedIn: "PR#13" },
      { name: "marketplace",   status: "implemented", path: "/api/v1/marketplace" },
      { name: "orders",        status: "implemented", path: "/api/v1/orders" },
      { name: "payments",      status: "stub",        path: "/api/v1/payments",      plannedIn: "PR#10" },
      { name: "automation",    status: "stub",        path: "/api/v1/automation",    plannedIn: "PR#7" },
      { name: "rental",        status: "stub",        path: "/api/v1/rental",        plannedIn: "PR#6" },
      { name: "support",       status: "stub",        path: "/api/v1/support",       plannedIn: "PR#9" },
      { name: "admin",         status: "stub",        path: "/api/v1/admin",         plannedIn: "PR#8" },
      { name: "notifications", status: "stub",        path: "/api/v1/notifications", plannedIn: "PR#11" },
      { name: "analytics",     status: "stub",        path: "/api/v1/analytics",     plannedIn: "PR#8" },
    ],
  });
});

v1Router.use("/auth", authRouter);
v1Router.use("/users", usersRouter);
v1Router.use("/marketplace", marketplaceRouter);
v1Router.use("/orders", ordersRouter);
v1Router.use("/payments", paymentsRouter);
v1Router.use("/automation", automationRouter);
v1Router.use("/rental", rentalRouter);
v1Router.use("/support", supportRouter);
v1Router.use("/admin", adminRouter);
v1Router.use("/notifications", notificationsRouter);
v1Router.use("/analytics", analyticsRouter);
