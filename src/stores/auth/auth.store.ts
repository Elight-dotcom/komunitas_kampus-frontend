import type { AuthRole, AuthUser, LoginResponse } from "@/types/auth";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

function parseJwtPayload(token: string): Record<string, unknown> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return {};
    return JSON.parse(atob(parts[1]));
  } catch {
    return {};
  }
}

type AuthState = {
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  user: AuthUser | null;
  role: AuthRole | null;
  isAuthenticated: boolean;
  userId: string | null;
};

type AuthActions = {
  setAccessToken: (accessToken: string | null) => void;
  setUser: (user: AuthUser | null) => void;
  setAuthFromLoginResponse: (response: LoginResponse) => void;
  clearAuth: () => void;
};

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  accessToken: null,
  accessTokenExpiresAt: null,
  refreshTokenExpiresAt: null,
  user: null,
  role: null,
  isAuthenticated: false,
  userId: null,
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      ...initialState,

      setAccessToken: (accessToken) =>
        set({
          accessToken,
          isAuthenticated: Boolean(accessToken),
        }),

      setUser: (user) =>
        set({
          user,
          role: user?.role ?? null,
          isAuthenticated: Boolean(user),
          userId: user?.accountId ?? null,
        }),

      setAuthFromLoginResponse: (response) => {
        // Try to get organizationId from response or JWT token
        let organizationId = response.organizationId;
        if (!organizationId && response.accessToken) {
          const payload = parseJwtPayload(response.accessToken);
          organizationId = (payload.organization_id as string) ?? (payload.organizationId as string) ?? undefined;
        }

        set({
          accessToken: response.accessToken,
          accessTokenExpiresAt: response.accessTokenExpiresAt,
          refreshTokenExpiresAt: response.refreshTokenExpiresAt,
          role: response.role,
          user: {
            accountId: response.accountId,
            username: response.username,
            email: response.email,
            role: response.role,
            organizationId: organizationId,
          },
          isAuthenticated: true,
          userId: response.accountId,
        });
      },

      clearAuth: () => set(initialState),
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        accessToken: state.accessToken,
        accessTokenExpiresAt: state.accessTokenExpiresAt,
        refreshTokenExpiresAt: state.refreshTokenExpiresAt,
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
        userId: state.userId,
      }),
    }
  )
);