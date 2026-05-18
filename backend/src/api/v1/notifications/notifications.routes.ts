import { buildStubRouter } from "../_stub.js";

export const notificationsRouter = buildStubRouter("notifications", [
  { method: "get",   path: "/",                       description: "List in-app notifications, filterable by type and read state", plannedIn: "PR#11", requiresAuth: true },
  { method: "get",   path: "/unread-count",           description: "Cheap unread counter for the bell badge",                      plannedIn: "PR#11", requiresAuth: true },
  { method: "post",  path: "/:id/read",               description: "Mark a single notification as read",                           plannedIn: "PR#11", requiresAuth: true },
  { method: "post",  path: "/read-all",               description: "Mark all notifications as read",                               plannedIn: "PR#11", requiresAuth: true },
  { method: "get",   path: "/preferences",            description: "Per-channel notification preferences",                         plannedIn: "PR#11", requiresAuth: true },
  { method: "patch", path: "/preferences",            description: "Update per-channel preferences (do-not-disturb, quiet hours)", plannedIn: "PR#11", requiresAuth: true },
  { method: "post",  path: "/push/subscribe",         description: "Register a Web Push subscription",                             plannedIn: "PR#11", requiresAuth: true },
  { method: "delete",path: "/push/subscribe/:id",     description: "Remove a Web Push subscription",                               plannedIn: "PR#11", requiresAuth: true },
  { method: "post",  path: "/test",                   description: "Send a test notification through every enabled channel",       plannedIn: "PR#11", requiresAuth: true },
]);
