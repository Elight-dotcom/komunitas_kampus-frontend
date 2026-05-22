import type { AuthRole, AuthUser, LoginResponse } from "@/types/auth";
import { create } from "zustand";

type AuthState = {
  accessToken: string | null;
  accessTokenExpiresAt: string | null;
  refreshTokenExpiresAt: string | null;
  user: AuthUser | null;
  role: AuthRole | null;
  isAuthenticated: boolean;
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
};

export const useAuthStore = create<AuthStore>()((set) => ({
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
    }),

  setAuthFromLoginResponse: (response) =>
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
      },
      isAuthenticated: true,
    }),

  clearAuth: () => set(initialState),
}));
