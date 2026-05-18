import { buildStubRouter } from "../_stub.js";

export const automationRouter = buildStubRouter("automation", [
  { method: "get",   path: "/integrations",                       description: "List the user's external integrations (FunPay/Starvell/Playerok)", plannedIn: "PR#7", requiresAuth: true, minRole: "SELLER" },
  { method: "post",  path: "/integrations/funpay/connect",        description: "Connect a FunPay account using credentials/cookies",               plannedIn: "PR#7", requiresAuth: true, minRole: "SELLER" },
  { method: "post",  path: "/integrations/starvell/connect",      description: "Connect a Starvell account",                                       plannedIn: "PR#7", requiresAuth: true, minRole: "SELLER" },
  { method: "post",  path: "/integrations/playerok/connect",      description: "Connect a Playerok account",                                       plannedIn: "PR#7", requiresAuth: true, minRole: "SELLER" },
  { method: "delete",path: "/integrations/:id",                   description: "Disconnect and revoke an integration",                             plannedIn: "PR#7", requiresAuth: true, minRole: "SELLER" },
  { method: "get",   path: "/bots",                               description: "List the user's bots and their states",                            plannedIn: "PR#7", requiresAuth: true, minRole: "SELLER" },
  { method: "post",  path: "/bots",                               description: "Create a bot from a template (auto-bump / price-sync / autoreply)",plannedIn: "PR#7", requiresAuth: true, minRole: "SELLER" },
  { method: "patch", path: "/bots/:id",                           description: "Update bot config / schedule",                                     plannedIn: "PR#7", requiresAuth: true, minRole: "SELLER" },
  { method: "post",  path: "/bots/:id/start",                     description: "Start the bot",                                                    plannedIn: "PR#7", requiresAuth: true, minRole: "SELLER" },
  { method: "post",  path: "/bots/:id/stop",                      description: "Stop the bot",                                                     plannedIn: "PR#7", requiresAuth: true, minRole: "SELLER" },
  { method: "get",   path: "/bots/:id/logs",                      description: "Tail bot logs (paginated)",                                        plannedIn: "PR#7", requiresAuth: true, minRole: "SELLER" },
  { method: "get",   path: "/webhooks",                           description: "Outgoing webhook subscriptions for this user",                     plannedIn: "PR#12", requiresAuth: true, minRole: "SELLER" },
  { method: "post",  path: "/webhooks",                           description: "Create a webhook subscription (HMAC secret returned once)",        plannedIn: "PR#12", requiresAuth: true, minRole: "SELLER" },
  { method: "delete",path: "/webhooks/:id",                       description: "Delete a webhook subscription",                                    plannedIn: "PR#12", requiresAuth: true, minRole: "SELLER" },
  { method: "get",   path: "/webhooks/:id/deliveries",            description: "Recent webhook delivery attempts",                                 plannedIn: "PR#12", requiresAuth: true, minRole: "SELLER" },
]);
