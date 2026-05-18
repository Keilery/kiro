/**
 * OpenAPI 3.1 document.
 *
 * Hand-written for now; PR#12 ("API & SDK") will move this to a registry
 * generated from the route definitions. Updated per PR as modules ship:
 *   - PR#2: auth
 *   - PR#3: marketplace (listings, reviews) + orders + escrow
 *   - PR#5+: shop, rental, payments, automation, notifications, etc.
 */
export const openapiDoc = {
  openapi: "3.1.0",
  info: {
    title: "NexusMarket API",
    version: "0.3.0",
    description:
      "Versioned REST API for the NexusMarket platform. " +
      "Modules implemented: auth, marketplace, orders, reviews. " +
      "Other modules return 501 with a `plannedIn` PR pointer until they land.",
    contact: { name: "NexusMarket", url: "https://nexusmarket.local" },
    license: { name: "Proprietary" },
  },
  servers: [
    { url: "http://localhost:4000", description: "Local dev" },
    { url: "https://api.nexusmarket.local", description: "Production (placeholder)" },
  ],
  tags: [
    { name: "auth",        description: "Registration, login, refresh, sessions" },
    { name: "marketplace", description: "Listings CRUD, search, games, categories" },
    { name: "reviews",     description: "Listing & seller reviews tied to completed orders" },
    { name: "orders",      description: "Escrow, dispute resolution, lifecycle transitions" },
    { name: "system",      description: "Health, readiness, metrics, OpenAPI" },
  ],

  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
      // ─── Generic ─────────────────────────────────────────────────
      Error: {
        type: "object",
        properties: {
          error: {
            type: "object",
            required: ["code", "message"],
            properties: {
              code: { type: "string", example: "UNAUTHORIZED" },
              message: { type: "string" },
              details: {},
              requestId: { type: "string", nullable: true },
            },
          },
        },
      },
      Page: {
        type: "object",
        required: ["items", "hasMore", "nextCursor", "limit"],
        properties: {
          items: { type: "array", items: {} },
          hasMore: { type: "boolean" },
          nextCursor: { type: "string", nullable: true },
          limit: { type: "integer" },
        },
      },

      // ─── Auth ────────────────────────────────────────────────────
      PublicUser: {
        type: "object",
        required: ["id", "email", "username", "role", "status"],
        properties: {
          id: { type: "string" },
          email: { type: "string", format: "email" },
          username: { type: "string" },
          displayName: { type: "string", nullable: true },
          role: { type: "string", enum: ["USER", "SELLER", "MODERATOR", "ADMIN", "SUPERADMIN"] },
          status: { type: "string", enum: ["ACTIVE", "MUTED", "BANNED", "PENDING_VERIFICATION"] },
          emailVerifiedAt: { type: "string", format: "date-time", nullable: true },
          avatarUrl: { type: "string", format: "uri", nullable: true },
        },
      },
      AuthResult: {
        type: "object",
        required: ["user", "accessToken", "refreshToken"],
        properties: {
          user: { $ref: "#/components/schemas/PublicUser" },
          accessToken: { type: "string" },
          refreshToken: { type: "string" },
        },
      },

      // ─── Marketplace ─────────────────────────────────────────────
      ListingType:    { type: "string", enum: ["ACCOUNT", "KEY", "SERVICE", "ITEM", "CURRENCY", "BOOST", "RENTAL"] },
      ListingStatus:  { type: "string", enum: ["DRAFT", "PENDING_REVIEW", "ACTIVE", "PAUSED", "SOLD_OUT", "REJECTED", "ARCHIVED"] },
      DeliveryMode:   { type: "string", enum: ["AUTO", "MANUAL", "SCHEDULED"] },
      Currency:       { type: "string", enum: ["RUB", "USD", "EUR", "UAH"] },
      Platform:       { type: "string", enum: ["PC", "PLAYSTATION", "XBOX", "MOBILE", "NINTENDO", "CROSS_PLATFORM"] },
      SellerTier:     { type: "string", enum: ["NONE", "BRONZE", "SILVER", "GOLD", "PLATINUM"] },

      ListingImage: {
        type: "object",
        properties: {
          id: { type: "string" },
          url: { type: "string", format: "uri" },
          width: { type: "integer", nullable: true },
          height: { type: "integer", nullable: true },
          position: { type: "integer" },
          isCover: { type: "boolean" },
        },
      },

      ListingCard: {
        type: "object",
        required: ["id", "slug", "title", "type", "status", "currency", "price"],
        properties: {
          id: { type: "string" },
          slug: { type: "string" },
          title: { type: "string" },
          type: { $ref: "#/components/schemas/ListingType" },
          status: { $ref: "#/components/schemas/ListingStatus" },
          currency: { $ref: "#/components/schemas/Currency" },
          price: { type: "string", description: "Decimal as string" },
          compareAtPrice: { type: "string", nullable: true },
          ratingAvg: { type: "number" },
          reviewCount: { type: "integer" },
          salesCount: { type: "integer" },
          viewCount: { type: "integer" },
          boostedUntil: { type: "string", format: "date-time", nullable: true },
          images: { type: "array", items: { $ref: "#/components/schemas/ListingImage" } },
          game: {
            type: "object",
            nullable: true,
            properties: { slug: { type: "string" }, title: { type: "string" } },
          },
          seller: {
            type: "object",
            properties: {
              id: { type: "string" },
              username: { type: "string" },
              displayName: { type: "string", nullable: true },
              sellerTier: { $ref: "#/components/schemas/SellerTier" },
            },
          },
        },
      },

      ListingDetail: {
        allOf: [
          { $ref: "#/components/schemas/ListingCard" },
          {
            type: "object",
            properties: {
              description: { type: "string", nullable: true },
              tags: { type: "array", items: { type: "string" } },
              platform: { $ref: "#/components/schemas/Platform" },
              serverName: { type: "string", nullable: true },
              stockQty: { type: "integer" },
              unlimited: { type: "boolean" },
              deliveryMode: { $ref: "#/components/schemas/DeliveryMode" },
              category: {
                type: "object",
                nullable: true,
                properties: { id: { type: "string" }, slug: { type: "string" }, title: { type: "string" } },
              },
            },
          },
        ],
      },

      ListingCreate: {
        type: "object",
        required: ["title", "type", "price"],
        properties: {
          title: { type: "string", minLength: 6, maxLength: 140 },
          description: { type: "string", maxLength: 8000, nullable: true },
          type: { $ref: "#/components/schemas/ListingType" },
          gameId: { type: "string", nullable: true },
          categoryId: { type: "string", nullable: true },
          currency: { $ref: "#/components/schemas/Currency" },
          price: { type: "number", minimum: 0 },
          compareAtPrice: { type: "number", nullable: true },
          stockQty: { type: "integer", minimum: 0, default: 1 },
          unlimited: { type: "boolean", default: false },
          deliveryMode: { $ref: "#/components/schemas/DeliveryMode" },
          deliveryCodes: { type: "array", items: { type: "string" }, maxItems: 10000 },
          platform: { $ref: "#/components/schemas/Platform" },
          serverName: { type: "string", nullable: true },
          tags: { type: "array", items: { type: "string", pattern: "^[a-z0-9-]+$" }, maxItems: 12 },
          metaTitle: { type: "string", nullable: true },
          metaDescription: { type: "string", nullable: true },
        },
      },

      ListingPage: {
        allOf: [
          { $ref: "#/components/schemas/Page" },
          { type: "object", properties: { items: { type: "array", items: { $ref: "#/components/schemas/ListingCard" } } } },
        ],
      },

      Game: {
        type: "object",
        properties: {
          id: { type: "string" },
          slug: { type: "string" },
          title: { type: "string" },
          publisher: { type: "string", nullable: true },
          coverUrl: { type: "string", nullable: true },
          iconUrl: { type: "string", nullable: true },
          platforms: { type: "array", items: { $ref: "#/components/schemas/Platform" } },
          popularity: { type: "integer" },
        },
      },
      Category: {
        type: "object",
        properties: {
          id: { type: "string" },
          slug: { type: "string" },
          title: { type: "string" },
          iconName: { type: "string", nullable: true },
          position: { type: "integer" },
          children: { type: "array", items: { $ref: "#/components/schemas/Category" } },
        },
      },

      // ─── Reviews ─────────────────────────────────────────────────
      Review: {
        type: "object",
        required: ["id", "rating", "createdAt"],
        properties: {
          id: { type: "string" },
          rating: { type: "integer", minimum: 1, maximum: 5 },
          body: { type: "string", nullable: true },
          imageUrls: { type: "array", items: { type: "string", format: "uri" } },
          sellerReply: { type: "string", nullable: true },
          sellerRepliedAt: { type: "string", format: "date-time", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          author: {
            type: "object",
            properties: {
              id: { type: "string" },
              username: { type: "string" },
              displayName: { type: "string", nullable: true },
              avatarUrl: { type: "string", nullable: true },
            },
          },
        },
      },
      ReviewPage: {
        allOf: [
          { $ref: "#/components/schemas/Page" },
          { type: "object", properties: { items: { type: "array", items: { $ref: "#/components/schemas/Review" } } } },
        ],
      },
      ReviewCreate: {
        type: "object",
        required: ["orderId", "rating"],
        properties: {
          orderId: { type: "string" },
          rating: { type: "integer", minimum: 1, maximum: 5 },
          body: { type: "string", maxLength: 2000, nullable: true },
          imageUrls: { type: "array", items: { type: "string", format: "uri" }, maxItems: 4 },
        },
      },

      // ─── Orders ──────────────────────────────────────────────────
      OrderStatus: {
        type: "string",
        enum: ["PENDING", "PAID", "DELIVERING", "DELIVERED", "COMPLETED", "DISPUTED", "REFUNDED", "CANCELLED"],
      },
      OrderItem: {
        type: "object",
        properties: {
          id: { type: "string" },
          listingId: { type: "string" },
          titleSnapshot: { type: "string" },
          priceSnapshot: { type: "string", description: "Decimal as string" },
          currency: { $ref: "#/components/schemas/Currency" },
          quantity: { type: "integer" },
          deliveredPayload: { type: "object", nullable: true },
        },
      },
      Order: {
        type: "object",
        required: ["id", "number", "status", "currency", "subtotal", "total"],
        properties: {
          id: { type: "string" },
          number: { type: "string", example: "NM-2026-000123" },
          status: { $ref: "#/components/schemas/OrderStatus" },
          currency: { $ref: "#/components/schemas/Currency" },
          subtotal: { type: "string" },
          commission: { type: "string" },
          discount: { type: "string" },
          total: { type: "string" },
          paidAt: { type: "string", format: "date-time", nullable: true },
          deliveredAt: { type: "string", format: "date-time", nullable: true },
          confirmedAt: { type: "string", format: "date-time", nullable: true },
          autoConfirmAt: { type: "string", format: "date-time", nullable: true },
          disputedAt: { type: "string", format: "date-time", nullable: true },
          cancelledAt: { type: "string", format: "date-time", nullable: true },
          refundedAt: { type: "string", format: "date-time", nullable: true },
          buyerNote: { type: "string", nullable: true },
          sellerNote: { type: "string", nullable: true },
          items: { type: "array", items: { $ref: "#/components/schemas/OrderItem" } },
          buyer: { $ref: "#/components/schemas/PublicUser" },
          seller: { $ref: "#/components/schemas/PublicUser" },
        },
      },
      OrderPage: {
        allOf: [
          { $ref: "#/components/schemas/Page" },
          { type: "object", properties: { items: { type: "array", items: { $ref: "#/components/schemas/Order" } } } },
        ],
      },
      OrderCreate: {
        type: "object",
        required: ["listingId"],
        properties: {
          listingId: { type: "string" },
          quantity: { type: "integer", minimum: 1, maximum: 100, default: 1 },
          promoCode: { type: "string", nullable: true },
          buyerNote: { type: "string", maxLength: 500, nullable: true },
        },
      },
      DisputeOpen: {
        type: "object",
        required: ["reason"],
        properties: {
          reason: { type: "string", minLength: 4, maxLength: 120 },
          details: { type: "string", maxLength: 4000, nullable: true },
        },
      },
      DisputeResolve: {
        type: "object",
        required: ["resolution"],
        properties: {
          resolution: { type: "string", enum: ["refund", "release", "split"] },
          refundPercent: {
            type: "integer",
            minimum: 1,
            maximum: 99,
            description: "Required when resolution=split",
          },
          note: { type: "string", maxLength: 2000, nullable: true },
        },
      },
    },
  },

  paths: {
    // ─── System ────────────────────────────────────────────────────
    "/healthz": { get: { tags: ["system"], summary: "Liveness check", responses: { "200": { description: "OK" } } } },
    "/readyz":  { get: { tags: ["system"], summary: "Readiness check (db + redis)", responses: { "200": { description: "ready" }, "500": { description: "not ready" } } } },
    "/metrics": { get: { tags: ["system"], summary: "Prometheus exposition format", responses: { "200": { description: "text/plain; version=0.0.4" } } } },

    // ─── Auth ──────────────────────────────────────────────────────
    "/api/v1/auth/register": {
      post: {
        tags: ["auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: { "application/json": { schema: {
            type: "object",
            required: ["email", "username", "password"],
            properties: {
              email: { type: "string", format: "email" },
              username: { type: "string", pattern: "^[a-z0-9_]{3,32}$" },
              password: { type: "string", minLength: 10 },
              displayName: { type: "string", nullable: true },
              referralCode: { type: "string", nullable: true },
            },
          } } },
        },
        responses: {
          "201": { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResult" } } } },
          "409": { description: "Conflict", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "422": { description: "Validation failed", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/v1/auth/login": {
      post: {
        tags: ["auth"],
        summary: "Log in by email or username",
        requestBody: {
          required: true,
          content: { "application/json": { schema: {
            type: "object",
            required: ["identifier", "password"],
            properties: {
              identifier: { type: "string", description: "email or username" },
              password: { type: "string" },
            },
          } } },
        },
        responses: {
          "200": { description: "Authenticated", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResult" } } } },
          "401": { description: "Invalid credentials", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
        },
      },
    },
    "/api/v1/auth/refresh": {
      post: {
        tags: ["auth"],
        summary: "Rotate the refresh token (single-use rotation)",
        requestBody: {
          required: true,
          content: { "application/json": { schema: {
            type: "object",
            required: ["refreshToken"],
            properties: { refreshToken: { type: "string" } },
          } } },
        },
        responses: {
          "200": { description: "Rotated", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResult" } } } },
          "401": { description: "Invalid or reused refresh token" },
        },
      },
    },
    "/api/v1/auth/logout": {
      post: {
        tags: ["auth"],
        summary: "Revoke current session (or every session via allDevices=true)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: false,
          content: { "application/json": { schema: {
            type: "object",
            properties: {
              refreshToken: { type: "string", nullable: true },
              allDevices: { type: "boolean", nullable: true },
            },
          } } },
        },
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/v1/auth/me": {
      get: {
        tags: ["auth"],
        summary: "Current user",
        security: [{ bearerAuth: [] }],
        responses: {
          "200": { description: "User", content: { "application/json": { schema: { type: "object", properties: { user: { $ref: "#/components/schemas/PublicUser" } } } } } },
          "401": { description: "Unauthenticated" },
        },
      },
    },

    // ─── Catalog ───────────────────────────────────────────────────
    "/api/v1/marketplace/games": {
      get: {
        tags: ["marketplace"],
        summary: "List supported games, ordered by popularity",
        responses: {
          "200": {
            description: "Games",
            content: { "application/json": { schema: {
              type: "object",
              properties: { games: { type: "array", items: { $ref: "#/components/schemas/Game" } } },
            } } },
          },
        },
      },
    },
    "/api/v1/marketplace/categories": {
      get: {
        tags: ["marketplace"],
        summary: "Category tree",
        responses: {
          "200": {
            description: "Categories",
            content: { "application/json": { schema: {
              type: "object",
              properties: { categories: { type: "array", items: { $ref: "#/components/schemas/Category" } } },
            } } },
          },
        },
      },
    },

    // ─── Listings: read ────────────────────────────────────────────
    "/api/v1/marketplace/listings": {
      get: {
        tags: ["marketplace"],
        summary: "List active listings with filters, sort, cursor pagination",
        parameters: [
          { name: "cursor", in: "query", schema: { type: "string" } },
          { name: "limit",  in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
          { name: "q",      in: "query", schema: { type: "string" } },
          { name: "gameId", in: "query", schema: { type: "string" } },
          { name: "gameSlug", in: "query", schema: { type: "string" } },
          { name: "categoryId", in: "query", schema: { type: "string" } },
          { name: "type",     in: "query", schema: { $ref: "#/components/schemas/ListingType" } },
          { name: "platform", in: "query", schema: { $ref: "#/components/schemas/Platform" } },
          { name: "sellerId", in: "query", schema: { type: "string" } },
          { name: "priceMin", in: "query", schema: { type: "number" } },
          { name: "priceMax", in: "query", schema: { type: "number" } },
          { name: "ratingMin", in: "query", schema: { type: "number", minimum: 0, maximum: 5 } },
          { name: "sort", in: "query", schema: { type: "string", enum: ["newest", "price_asc", "price_desc", "popular", "rating"] } },
          { name: "status", in: "query", schema: { $ref: "#/components/schemas/ListingStatus" }, description: "Restricted: only the seller or moderators may set this." },
        ],
        responses: {
          "200": { description: "Listings page", content: { "application/json": { schema: { $ref: "#/components/schemas/ListingPage" } } } },
          "403": { description: "Forbidden status filter", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "422": { description: "Validation failed" },
        },
      },
      post: {
        tags: ["marketplace"],
        summary: "Create a listing (SELLER+)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ListingCreate" } } },
        },
        responses: {
          "201": { description: "Created", content: { "application/json": { schema: { type: "object", properties: { listing: { $ref: "#/components/schemas/ListingDetail" } } } } } },
          "401": { description: "Unauthenticated" },
          "403": { description: "Requires SELLER role" },
          "422": { description: "Validation failed" },
        },
      },
    },
    "/api/v1/marketplace/listings/search": {
      get: {
        tags: ["marketplace"],
        summary: "Autocomplete suggestions for listing titles",
        parameters: [
          { name: "q", in: "query", required: true, schema: { type: "string", minLength: 2, maxLength: 60 } },
          { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 10 } },
        ],
        responses: {
          "200": {
            description: "Suggestions",
            content: { "application/json": { schema: {
              type: "object",
              properties: {
                suggestions: { type: "array", items: { type: "object", properties: {
                  id: { type: "string" }, slug: { type: "string" }, title: { type: "string" },
                } } },
              },
            } } },
          },
        },
      },
    },
    "/api/v1/marketplace/listings/featured": {
      get: {
        tags: ["marketplace"],
        summary: "Boosted listings for homepage rails",
        responses: {
          "200": { description: "Featured listings", content: { "application/json": { schema: { type: "object", properties: { listings: { type: "array", items: { $ref: "#/components/schemas/ListingCard" } } } } } } },
        },
      },
    },
    "/api/v1/marketplace/listings/{slug}": {
      get: {
        tags: ["marketplace"],
        summary: "Listing detail by slug",
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Listing", content: { "application/json": { schema: { type: "object", properties: { listing: { $ref: "#/components/schemas/ListingDetail" } } } } } },
          "404": { description: "Not found (or hidden — non-owners cannot tell the difference)" },
        },
      },
    },
    "/api/v1/marketplace/listings/{slug}/related": {
      get: {
        tags: ["marketplace"],
        summary: "Up to 6 related listings (same game + type, different seller)",
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Related", content: { "application/json": { schema: { type: "object", properties: { listings: { type: "array", items: { $ref: "#/components/schemas/ListingCard" } } } } } } },
        },
      },
    },

    // ─── Listings: write ──────────────────────────────────────────
    "/api/v1/marketplace/listings/{id}": {
      patch: {
        tags: ["marketplace"],
        summary: "Update a listing (owner only — moderators may also edit)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ListingCreate" } } } },
        responses: {
          "200": { description: "Updated", content: { "application/json": { schema: { type: "object", properties: { listing: { $ref: "#/components/schemas/ListingDetail" } } } } } },
          "403": { description: "Not the owner" },
          "404": { description: "Not found" },
        },
      },
      delete: {
        tags: ["marketplace"],
        summary: "Soft-delete (archive) a listing",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "Archived" }, "403": { description: "Not the owner" }, "404": { description: "Not found" } },
      },
    },
    "/api/v1/marketplace/listings/{id}/status": {
      patch: {
        tags: ["marketplace"],
        summary: "Toggle listing status between ACTIVE / PAUSED / ARCHIVED",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["status"], properties: { status: { type: "string", enum: ["ACTIVE", "PAUSED", "ARCHIVED"] } } } } },
        },
        responses: { "200": { description: "Updated" }, "403": { description: "Not the owner" } },
      },
    },
    "/api/v1/marketplace/listings/{id}/duplicate": {
      post: {
        tags: ["marketplace"],
        summary: "Clone a listing as a new DRAFT (stockQty=0, copies images)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "201": { description: "Created", content: { "application/json": { schema: { type: "object", properties: { listing: { $ref: "#/components/schemas/ListingDetail" } } } } } } },
      },
    },
    "/api/v1/marketplace/listings/{id}/boost": {
      post: {
        tags: ["marketplace"],
        summary: "Boost a listing for N hours (extends from max(now, current boostedUntil))",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["hours"], properties: { hours: { type: "integer", minimum: 1, maximum: 168 } } } } },
        },
        responses: { "200": { description: "Boosted" } },
      },
    },
    "/api/v1/marketplace/listings/{id}/report": {
      post: {
        tags: ["marketplace"],
        summary: "Report a listing for moderation",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["reason"], properties: { reason: { type: "string", minLength: 4, maxLength: 80 }, details: { type: "string", maxLength: 2000 } } } } },
        },
        responses: { "201": { description: "Report filed" }, "404": { description: "Listing not found" } },
      },
    },

    // ─── Reviews ───────────────────────────────────────────────────
    "/api/v1/marketplace/listings/{id}/reviews": {
      get: {
        tags: ["reviews"],
        summary: "List reviews for a listing",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
          { name: "cursor", in: "query", schema: { type: "string" } },
          { name: "limit",  in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
          { name: "ratingMin", in: "query", schema: { type: "integer", minimum: 1, maximum: 5 } },
          { name: "includeHidden", in: "query", schema: { type: "boolean" }, description: "Owner / moderator only" },
        ],
        responses: { "200": { description: "Reviews", content: { "application/json": { schema: { $ref: "#/components/schemas/ReviewPage" } } } } },
      },
    },
    "/api/v1/marketplace/reviews": {
      post: {
        tags: ["reviews"],
        summary: "Submit a review tied to a completed order",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/ReviewCreate" } } } },
        responses: {
          "201": { description: "Created", content: { "application/json": { schema: { type: "object", properties: { review: { $ref: "#/components/schemas/Review" } } } } } },
          "400": { description: "Order not in COMPLETED state" },
          "403": { description: "Not the buyer of this order" },
          "409": { description: "Already reviewed this order" },
        },
      },
    },
    "/api/v1/marketplace/reviews/{id}/reply": {
      post: {
        tags: ["reviews"],
        summary: "Seller reply to a review",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { type: "object", required: ["reply"], properties: { reply: { type: "string", minLength: 1, maxLength: 2000 } } } } },
        },
        responses: { "200": { description: "Reply saved" }, "403": { description: "Not the subject of this review" } },
      },
    },
    "/api/v1/marketplace/sellers/{sellerId}/reviews": {
      get: {
        tags: ["reviews"],
        summary: "Reviews received by a seller",
        parameters: [
          { name: "sellerId", in: "path", required: true, schema: { type: "string" } },
          { name: "cursor", in: "query", schema: { type: "string" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "ratingMin", in: "query", schema: { type: "integer", minimum: 1, maximum: 5 } },
        ],
        responses: { "200": { description: "Reviews", content: { "application/json": { schema: { $ref: "#/components/schemas/ReviewPage" } } } } },
      },
    },

    // ─── Orders ────────────────────────────────────────────────────
    "/api/v1/orders": {
      get: {
        tags: ["orders"],
        summary: "List orders (as buyer or seller)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "cursor", in: "query", schema: { type: "string" } },
          { name: "limit",  in: "query", schema: { type: "integer", minimum: 1, maximum: 100 } },
          { name: "role",   in: "query", schema: { type: "string", enum: ["buyer", "seller"] }, description: "Default: buyer" },
          { name: "status", in: "query", schema: { $ref: "#/components/schemas/OrderStatus" } },
        ],
        responses: {
          "200": { description: "Orders page", content: { "application/json": { schema: { $ref: "#/components/schemas/OrderPage" } } } },
        },
      },
      post: {
        tags: ["orders"],
        summary: "Create an order (debits buyer wallet, freezes seller escrow, decrements stock)",
        security: [{ bearerAuth: [] }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/OrderCreate" } } } },
        responses: {
          "201": { description: "Created", content: { "application/json": { schema: { type: "object", properties: { order: { $ref: "#/components/schemas/Order" } } } } } },
          "402": { description: "Insufficient balance", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "409": { description: "Listing inactive / out of stock / cannot buy own listing" },
        },
      },
    },
    "/api/v1/orders/{id}": {
      get: {
        tags: ["orders"],
        summary: "Order detail (buyer, seller, or moderator only)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Order", content: { "application/json": { schema: { type: "object", properties: { order: { $ref: "#/components/schemas/Order" } } } } } },
          "404": { description: "Not found (or not the requesting user's)" },
        },
      },
    },
    "/api/v1/orders/{id}/deliver": {
      patch: {
        tags: ["orders"],
        summary: "Seller marks order as delivered (PAID → DELIVERING)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Delivered" }, "409": { description: "Not in PAID state" } },
      },
    },
    "/api/v1/orders/{id}/confirm": {
      patch: {
        tags: ["orders"],
        summary: "Buyer confirms receipt → escrow released (DELIVERING → COMPLETED)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Completed" }, "409": { description: "Not in DELIVERING state" } },
      },
    },
    "/api/v1/orders/{id}/cancel": {
      patch: {
        tags: ["orders"],
        summary: "Cancel an unpaid order — restores stock (PENDING → CANCELLED)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Cancelled" },
          "409": { description: "Not in PENDING state — open a dispute instead" },
        },
      },
    },
    "/api/v1/orders/{id}/dispute": {
      post: {
        tags: ["orders"],
        summary: "Open a dispute (PAID|DELIVERING → DISPUTED)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/DisputeOpen" } } } },
        responses: { "200": { description: "Disputed" }, "409": { description: "Wrong state" } },
      },
    },
    "/api/v1/orders/{id}/dispute/resolve": {
      post: {
        tags: ["orders"],
        summary: "Resolve a dispute (MODERATOR+ only) — refund / release / split",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/DisputeResolve" } } } },
        responses: {
          "200": { description: "Resolved" },
          "403": { description: "Requires MODERATOR role" },
          "409": { description: "Order not in DISPUTED state" },
        },
      },
    },
  },
} as const;
