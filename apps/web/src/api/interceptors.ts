import { authApi, api } from "./client";

// Types
type AuthTokens = { access_token: string; refresh_token: string };
type RefreshResponse = { data: { data: AuthTokens } };

// Store integration functions - will be set by the user store
let getTokens: (() => AuthTokens | null) | null = null;
let updateTokens: ((tokens: AuthTokens) => void) | null = null;
let handleLogout: (() => void) | null = null;
let refreshUserData: (() => Promise<void>) | null = null;

let refreshTokenPromise: Promise<RefreshResponse> | null = null;

export const setupAxiosInterceptors = (
  tokenGetter: () => AuthTokens | null,
  tokenUpdater: (tokens: AuthTokens) => void,
  logoutHandler: () => void,
  userDataRefresher: () => Promise<void>,
) => {
  getTokens = tokenGetter;
  updateTokens = tokenUpdater;
  handleLogout = logoutHandler;
  refreshUserData = userDataRefresher;

  // Request interceptor to add auth headers
  api.interceptors.request.use(
    (config) => {
      const tokens = getTokens?.();
      if (tokens?.access_token) {
        config.headers.Authorization = `Bearer ${tokens.access_token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );
};

// Response interceptor to handle token refresh automatically
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't try to refresh tokens for auth endpoints
    const requestUrl = originalRequest?.url || "";
    const isAuthEndpoint =
      requestUrl.includes("/auth/login") ||
      requestUrl.includes("/auth/register");

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;

      try {
        if (refreshTokenPromise) {
          await refreshTokenPromise;
          return api(originalRequest);
        }

        const tokens = getTokens?.();
        if (!tokens?.refresh_token) {
          console.warn("No refresh token available, redirecting to login");
          handleLogout?.();
          return Promise.reject(new Error("No refresh token available"));
        }

        refreshTokenPromise = authApi.refresh(tokens.refresh_token);
        const response = await refreshTokenPromise;

        const { access_token, refresh_token } = response.data.data;
        const newTokens = { access_token, refresh_token };

        updateTokens?.(newTokens);

        // Refresh user data to get any updates
        try {
          await refreshUserData?.();
        } catch {
          // Don't fail the request if user data refresh fails
          console.warn("Failed to refresh user data after token refresh");
        }

        originalRequest.headers.Authorization = `Bearer ${access_token}`;

        return api(originalRequest);
      } catch (refreshError) {
        handleLogout?.();
        throw refreshError;
      } finally {
        refreshTokenPromise = null;
      }
    }

    return Promise.reject(error);
  },
);
