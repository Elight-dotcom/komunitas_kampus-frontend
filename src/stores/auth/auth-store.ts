import { create } from "zustand";

type AuthState = {
  accessToken: string | null;
  user: unknown | null;
};

type AuthActions = {
  setAccessToken: (accessToken: string | null) => void;
  setUser: (user: unknown | null) => void;
  resetAuth: () => void;
};

type AuthStore = AuthState & AuthActions;

const initialState: AuthState = {
  accessToken: null,
  user: null,
};

export const useAuthStore = create<AuthStore>()((set) => ({
  ...initialState,

  setAccessToken: (accessToken) => set({ accessToken }),

  setUser: (user) => set({ user }),

  resetAuth: () => set(initialState),
}));