"use client";

import { useBootstrapAuth } from "@/lib/auth-store";

/**
 * Mounted once at the root layout. Imports the auth store (which has
 * the api.ts ↔ store wiring as a side effect) and re-validates the
 * persisted session against /api/v1/auth/me.
 *
 * Why a dedicated client component:
 * RootLayout is a server component (so it can hold `<head>`/metadata),
 * but the bootstrap hook needs the client tree to subscribe to store
 * changes. Splitting it here keeps the layout server-rendered and
 * lets this thin wrapper hydrate on the client.
 */
export function AuthBootstrap() {
  useBootstrapAuth();
  return null;
}
