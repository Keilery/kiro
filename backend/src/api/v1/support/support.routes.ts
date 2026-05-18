import { buildStubRouter } from "../_stub.js";

export const supportRouter = buildStubRouter("support", [
  { method: "get",   path: "/tickets",              description: "List the user's tickets, filterable by status/category",       plannedIn: "PR#9", requiresAuth: true },
  { method: "post",  path: "/tickets",              description: "Open a new ticket with optional attachments",                  plannedIn: "PR#9", requiresAuth: true },
  { method: "get",   path: "/tickets/:id",          description: "Ticket detail with the message thread",                        plannedIn: "PR#9", requiresAuth: true },
  { method: "post",  path: "/tickets/:id/messages", description: "Append a message to a ticket",                                 plannedIn: "PR#9", requiresAuth: true },
  { method: "post",  path: "/tickets/:id/close",    description: "Mark a ticket as resolved",                                    plannedIn: "PR#9", requiresAuth: true },
  { method: "post",  path: "/tickets/:id/csat",     description: "Submit CSAT (1..5) for a closed ticket",                       plannedIn: "PR#9", requiresAuth: true },
  { method: "get",   path: "/faq",                  description: "Searchable FAQ entries",                                       plannedIn: "PR#9" },
  { method: "get",   path: "/status",               description: "Public status of platform services (queue lag, uptime, etc.)", plannedIn: "PR#9" },
  { method: "get",   path: "/changelog",            description: "Recent product changelog entries",                             plannedIn: "PR#9" },
]);
