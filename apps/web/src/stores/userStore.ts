import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi, usersApi, api } from "@/api/client";
import { setupAxiosInterceptors } from "@/api/interceptors";
import { extractErrorMessage } from "@/utils/errorHandler";
import type {
  User,
  AuthTokens,
  LoginCredentials,
  RegisterData,
} from "../types/user";

interface UserState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  updatePassword: (passwordData: {
    current_password: string;
    new_password: string;
  }) => Promise<void>;
  refreshUserData: () => Promise<void>;
  clearError: () => void;

  // Utils
  isAuthenticated: () => boolean;
  setAuthToken: (token: string) => void;
  updateTokens: (tokens: AuthTokens) => void;
  getTokens: () => AuthTokens | null;
}

export const useUserStore = create<UserState>()(
  persist(
    (set, get) => {
      setupAxiosInterceptors(
        () => get().getTokens(),
        (tokens) => get().updateTokens(tokens),
        () => get().logout(),
        () => get().refreshUserData(),
      );

      return {
        user: null,
        tokens: null,
        isLoading: false,
        error: null,

        // Actions
        login: async (credentials: LoginCredentials) => {
          try {
            set({ isLoading: true, error: null });

            const response = await authApi.login(credentials);
            const { user, access_token, refresh_token } = response.data.data;

            const tokens = { access_token, refresh_token };

            set({
              user,
              tokens,
              isLoading: false,
            });

            get().setAuthToken(access_token);
          } catch (error: any) {
            let errorMessage = extractErrorMessage(error);

            // Override with more specific messages for common scenarios
            if (error.response?.status === 401) {
              errorMessage = "Invalid email or password";
            } else if (error.response?.status === 429) {
              errorMessage = "Too many login attempts. Please try again later";
            }

            set({
              isLoading: false,
              error: errorMessage,
            });

            return Promise.reject(new Error(errorMessage));
          }
        },

        register: async (data: RegisterData) => {
          try {
            set({ isLoading: true, error: null });

            const response = await authApi.register(data);
            const { user, access_token, refresh_token } = response.data.data;

            const tokens = { access_token, refresh_token };

            set({
              user,
              tokens,
              isLoading: false,
            });

            get().setAuthToken(access_token);
          } catch (error: any) {
            set({
              isLoading: false,
              error: error.response?.data?.message || "Registration failed",
            });
            throw error;
          }
        },

        logout: () => {
          set({
            user: null,
            tokens: null,
            error: null,
          });
          delete api.defaults.headers.common["Authorization"];
        },

        updateProfile: async (updates: Partial<User>) => {
          try {
            set({ isLoading: true, error: null });
            const { user } = get();

            if (!user) throw new Error("No user logged in");

            const response = await usersApi.updateProfile(user.id, updates);

            set({
              user: { ...user, ...response.data.data },
              isLoading: false,
            });
          } catch (error: any) {
            set({
              isLoading: false,
              error: extractErrorMessage(error),
            });
            throw error;
          }
        },

        updatePassword: async (passwordData: {
          current_password: string;
          new_password: string;
        }) => {
          try {
            set({ isLoading: true, error: null });
            const { user } = get();

            if (!user) throw new Error("No user logged in");

            await usersApi.updatePassword(user.id, passwordData);

            set({ isLoading: false });
          } catch (error: any) {
            set({
              isLoading: false,
              error: extractErrorMessage(error),
            });
            throw error;
          }
        },

        clearError: () => set({ error: null }),

        refreshUserData: async () => {
          try {
            const { user, isAuthenticated } = get();
            if (!isAuthenticated() || !user) return;

            const response = await api.get("/auth/profile");
            const updatedUser = response.data.data;

            set({ user: updatedUser });
          } catch (error: any) {
            console.warn("Failed to refresh user data:", error.message);
          }
        },

        // Utils
        isAuthenticated: () => {
          const { user, tokens } = get();
          return !!(user && tokens?.access_token);
        },

        setAuthToken: (token: string) => {
          api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        },

        updateTokens: (tokens: AuthTokens) => {
          set({ tokens });
          get().setAuthToken(tokens.access_token);
        },

        getTokens: () => {
          return get().tokens;
        },
      };
    },
    {
      name: "eventhub-user-store",
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.tokens?.access_token) {
          state.setAuthToken(state.tokens.access_token);
        }
      },
    },
  ),
);
