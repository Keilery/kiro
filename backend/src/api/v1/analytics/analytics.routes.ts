import { buildStubRouter } from "../_stub.js";

export const analyticsRouter = buildStubRouter("analytics", [
  { method: "post",  path: "/events",            description: "Ingest a client-side analytics event (anonymous or identified)", plannedIn: "PR#8" },
  { method: "post",  path: "/page-views",        description: "Ingest a page-view event with referrer / device",                plannedIn: "PR#8" },
  { method: "get",   path: "/me/dashboard",      description: "Seller-facing analytics: GMV, conversion, top listings, ETAs",   plannedIn: "PR#8", requiresAuth: true, minRole: "SELLER" },
  { method: "get",   path: "/me/funnel",         description: "Seller funnel: views → favorites → checkouts → purchases",       plannedIn: "PR#8", requiresAuth: true, minRole: "SELLER" },
  { method: "get",   path: "/public/stats",      description: "Public platform stats (24h sales, GMV, online sellers)",         plannedIn: "PR#8" },
]);
