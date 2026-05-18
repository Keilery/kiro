/**
 * OpenAPI 3.1 placeholder document.
 *
 * Today this only documents the implemented `auth/*` endpoints plus the
 * service-level shape. Each future PR will append schemas + paths for
 * the module it lands. PR#12 ("API & SDK") will switch this to be
 * generated from a registry instead of hand-written.
 */
export const openapiDoc = {
  openapi: "3.1.0",
  info: {
    title: "NexusMarket API",
    version: "0.1.0",
    description:
      "Versioned REST API for the NexusMarket platform. " +
      "PR#2 ships /auth + scaffolding; subsequent PRs fill in marketplace, orders, automation, etc.",
    contact: { name: "NexusMarket", url: "https://nexusmarket.local" },
    license: { name: "Proprietary" },
  },
  servers: [
    { url: "http://localhost:4000", description: "Local dev" },
    { url: "https://api.nexusmarket.local", description: "Production (placeholder)" },
  ],
  tags: [
    { name: "auth", description: "Registration, login, refresh, sessions" },
    { name: "marketplace", description: "Listings, search, reviews — stubbed in PR#2" },
    { name: "orders", description: "Escrow, disputes, invoices — stubbed in PR#2" },
    { name: "system", description: "Health, readiness, metrics" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" },
    },
    schemas: {
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
    },
  },
  paths: {
    "/healthz": {
      get: {
        tags: ["system"],
        summary: "Liveness check",
        responses: { "200": { description: "OK" } },
      },
    },
    "/readyz": {
      get: {
        tags: ["system"],
        summary: "Readiness check (db + redis)",
        responses: { "200": { description: "ready" }, "500": { description: "not ready" } },
      },
    },
    "/metrics": {
      get: {
        tags: ["system"],
        summary: "Prometheus exposition format",
        responses: { "200": { description: "text/plain; version=0.0.4" } },
      },
    },
    "/api/v1/auth/register": {
      post: {
        tags: ["auth"],
        summary: "Register a new user",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["email", "username", "password"],
                properties: {
                  email: { type: "string", format: "email" },
                  username: { type: "string", pattern: "^[a-z0-9_]{3,32}$" },
                  password: { type: "string", minLength: 10 },
                  displayName: { type: "string", nullable: true },
                  referralCode: { type: "string", nullable: true },
                },
              },
            },
          },
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
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["identifier", "password"],
                properties: {
                  identifier: { type: "string", description: "email or username" },
                  password: { type: "string" },
                },
              },
            },
          },
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
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: { refreshToken: { type: "string" } },
              },
            },
          },
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
          content: {
            "application/json": {
              schema: {
                type: "object",
                properties: {
                  refreshToken: { type: "string", nullable: true },
                  allDevices: { type: "boolean", nullable: true },
                },
              },
            },
          },
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
          "200": {
            description: "User",
            content: { "application/json": { schema: { type: "object", properties: { user: { $ref: "#/components/schemas/PublicUser" } } } } },
          },
          "401": { description: "Unauthenticated" },
        },
      },
    },
  },
} as const;
