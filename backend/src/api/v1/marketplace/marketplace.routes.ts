import { buildStubRouter } from "../_stub.js";

export const marketplaceRouter = buildStubRouter("marketplace", [
  { method: "get",   path: "/listings",                description: "List active listings with filters, sorting, cursor pagination",   plannedIn: "PR#3" },
  { method: "get",   path: "/listings/search",         description: "Full-text search with autocomplete suggestions",                  plannedIn: "PR#3" },
  { method: "get",   path: "/listings/featured",       description: "Boosted + curated listings for homepage rails",                   plannedIn: "PR#3" },
  { method: "get",   path: "/listings/:slug",          description: "Single listing by slug, with images, seller card, related items", plannedIn: "PR#3" },
  { method: "post",  path: "/listings",                description: "Create a new listing (seller only)",                              plannedIn: "PR#3", requiresAuth: true, minRole: "SELLER" },
  { method: "patch", path: "/listings/:id",            description: "Update an existing listing",                                      plannedIn: "PR#3", requiresAuth: true, minRole: "SELLER" },
  { method: "delete",path: "/listings/:id",            description: "Archive a listing (soft delete)",                                 plannedIn: "PR#3", requiresAuth: true, minRole: "SELLER" },
  { method: "post",  path: "/listings/:id/duplicate",  description: "Duplicate an existing listing as a new draft",                    plannedIn: "PR#3", requiresAuth: true, minRole: "SELLER" },
  { method: "post",  path: "/listings/:id/boost",      description: "Purchase boosted placement for N hours",                          plannedIn: "PR#3", requiresAuth: true, minRole: "SELLER" },
  { method: "post",  path: "/listings/:id/favorite",   description: "Favorite/unfavorite a listing for the current user",              plannedIn: "PR#4", requiresAuth: true },
  { method: "post",  path: "/listings/:id/report",     description: "Report a listing to moderation",                                  plannedIn: "PR#3", requiresAuth: true },
  { method: "post",  path: "/listings/:id/reviews",    description: "Submit a review tied to a completed order",                       plannedIn: "PR#3", requiresAuth: true },
  { method: "get",   path: "/listings/:id/reviews",    description: "Paginated reviews for a listing",                                 plannedIn: "PR#3" },
  { method: "get",   path: "/games",                   description: "Catalog of supported games",                                      plannedIn: "PR#3" },
  { method: "get",   path: "/categories",              description: "Tree of categories",                                              plannedIn: "PR#3" },
]);
