import { create } from "zustand";
import { persist } from "zustand/middleware";
import { authApi, usersApi, api } from "@/api/client";
import { setupAxiosInterceptors } from "@/api/interceptors";
import { createAppError, type AppError } from "@/utils/errorHandler";
import type {
  User,
  AuthTokens,
  LoginCredentials,
  RegisterData,
} from "../types/user";

// Return types for store functions
export type StoreResult<T> = (T & { message: string }) | { error: AppError };
export type StoreVoidResult = { message: string } | { error: AppError };

interface UserState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  error: AppError | null;

  // Actions
  login: (
    credentials: LoginCredentials,
  ) => Promise<StoreResult<{ user: User; tokens: AuthTokens }>>;
  register: (
    data: RegisterData,
  ) => Promise<StoreResult<{ user: User; tokens: AuthTokens }>>;
  logout: () => void;
  updateProfile: (
    updates: Partial<User>,
  ) => Promise<StoreResult<{ user: User }>>;
  updatePassword: (passwordData: {
    current_password: string;
    new_password: string;
  }) => Promise<StoreVoidResult>;
  refreshUserData: () => Promise<StoreVoidResult>;
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
        async () => {
          await get().refreshUserData();
          // For interceptor, we don't need to handle the error here
          // The store will handle it internally
        },
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

            return {
              user,
              tokens,
              message: response.data.message,
            };
          } catch (error: any) {
            const errorObj = createAppError(error);
            set({
              isLoading: false,
              error: errorObj,
            });
            return {
              error: errorObj,
            };
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

            return {
              user,
              tokens,
              message: response.data.message,
            };
          } catch (error: any) {
            const errorObj = createAppError(error);
            set({
              isLoading: false,
              error: errorObj,
            });
            return {
              error: errorObj,
            };
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

            const response = await usersApi.updateProfile(updates);

            set({
              user: { ...user, ...response.data.data },
              isLoading: false,
            });

            return {
              user: { ...user, ...response.data.data },
              message: response.data.message,
            };
          } catch (error) {
            const errorObj = createAppError(error);
            set({
              isLoading: false,
              error: errorObj,
            });
            return {
              error: errorObj,
            };
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

            const response = await usersApi.updatePassword(passwordData);

            set({ isLoading: false });

            return { message: response.data.message };
          } catch (error: any) {
            const errorObj = createAppError(error);
            set({
              isLoading: false,
              error: errorObj,
            });
            return {
              error: errorObj,
            };
          }
        },

        clearError: () => set({ error: null }),

        refreshUserData: async (): Promise<StoreVoidResult> => {
          try {
            const { user, isAuthenticated } = get();
            if (!isAuthenticated() || !user) {
              return { message: "No authenticated user to refresh" };
            }

            const response = await api.get("/auth/profile");
            const updatedUser = response.data.data;

            set({ user: updatedUser });

            return { message: response.data.message };
          } catch (error: any) {
            console.warn("Failed to refresh user data:", error.message);
            const errorObj = createAppError(error);
            return {
              error: errorObj,
            };
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
