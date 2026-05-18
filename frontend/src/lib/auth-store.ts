"use client";

/**
 * Auth store.
 *
 * Holds the signed-in user + token pair across the app. Persists to
 * localStorage so a refresh keeps you logged in; lib/api.ts reads
 * tokens from here on every request via the registerTokenSource hook
 * exposed in the api module.
 *
 * Why Zustand and not React Context:
 *   - We want to read the latest token inside lib/api.ts (a non-React
 *     module). Context can't do that without prop-drilling a hook in.
 *   - Zustand exposes a stable .getState() that works from anywhere
 *     and a typical hook for components.
 *
 * Persistence caveats:
 *   - Tokens in localStorage are vulnerable to XSS. The right long-term
 *     fix is httpOnly cookies served by the API; until that lands in
 *     PR#10/#15 we accept the trade-off and lean on the strict CSP
 *     plus zod-validated input on the backend.
 *   - SSR safety: Zustand's persist middleware is hydration-aware, but
 *     reading state during render before hydration would cause a
 *     mismatch. Components that need the user should either (a) gate
 *     on `_hasHydrated`, or (b) render an unauthenticated UI server-
 *     side and let the client hydrate it. We do (a).
 */

import { useEffect } from "react";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { registerTokenSource, api, type PublicUser, ApiError } from "./api";

interface AuthState {
  user: PublicUser | null;
  accessToken: string | null;
  refreshToken: string | null;

  /**
   * Becomes true once the persisted state has been read off the wire.
   * Components that gate on auth should wait for this before deciding
   * whether to show the "log in" CTA — otherwise the first paint
   * always reads "logged out" and snaps to "logged in" a tick later.
   */
  _hasHydrated: boolean;

  setSession: (
    next: { user: PublicUser; accessToken: string; refreshToken: string },
  ) => void;
  setTokens: (t: { accessToken: string | null; refreshToken: string | null }) => void;
  clear: () => void;
  setHydrated: (b: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      _hasHydrated: false,

      setSession: ({ user, accessToken, refreshToken }) =>
        set({ user, accessToken, refreshToken }),

      setTokens: ({ accessToken, refreshToken }) =>
        // We update tokens-only on refresh rotations; the user object
        // doesn't change, so we don't touch it here.
        set({ accessToken, refreshToken }),

      clear: () => set({ user: null, accessToken: null, refreshToken: null }),

      setHydrated: (b) => set({ _hasHydrated: b }),
    }),
    {
      name: "nexusmarket.auth",
      storage: createJSONStorage(() => localStorage),
      // The hydration callback fires once after the persisted state is
      // applied. Setting the flag flips any UI gating on `_hasHydrated`.
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
      // Only persist the durable bits — the hydration flag is computed
      // at runtime, not loaded from storage.
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);

// ─── api.ts ↔ store wiring ────────────────────────────────────────────
//
// lib/api.ts can't import the store (cycle), so we register getters
// here. .getState() reads always pick up the latest values, including
// after refresh rotations.
registerTokenSource({
  getTokens: () => {
    const s = useAuthStore.getState();
    return { accessToken: s.accessToken, refreshToken: s.refreshToken };
  },
  setTokens: (t) => useAuthStore.getState().setTokens(t),
  clearTokens: () => useAuthStore.getState().clear(),
});

// ─── React helpers ────────────────────────────────────────────────────

/**
 * Re-fetch the current user once after hydration. Mounted from the
 * root layout; no-op when there's no token. This catches the case
 * where the access token expired while the tab was closed but the
 * refresh token is still valid — api.ts will rotate it on this call.
 */
export function useBootstrapAuth(): void {
  const hydrated = useAuthStore((s) => s._hasHydrated);
  const accessToken = useAuthStore((s) => s.accessToken);
  const setSession = useAuthStore((s) => s.setSession);
  const clear = useAuthStore((s) => s.clear);

  useEffect(() => {
    if (!hydrated || !accessToken) return;
    let cancelled = false;
    (async () => {
      try {
        const { user } = await api.auth.me();
        if (!cancelled) {
          // Tokens stay as-is; api.ts may have rotated them transparently.
          const s = useAuthStore.getState();
          setSession({
            user,
            accessToken: s.accessToken!,
            refreshToken: s.refreshToken!,
          });
        }
      } catch (err) {
        // 401 from /me means both tokens are dead. Silently sign out;
        // anything else (network blip, 5xx) — leave state alone so a
        // transient outage doesn't kick the user out.
        if (!cancelled && err instanceof ApiError && err.status === 401) {
          clear();
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrated, accessToken, setSession, clear]);
}

/** Convenience selector — `useUser()` reads just the user. */
export function useUser(): PublicUser | null {
  return useAuthStore((s) => s.user);
}

export function useIsAuthenticated(): boolean {
  return useAuthStore((s) => Boolean(s.user && s.accessToken));
}
