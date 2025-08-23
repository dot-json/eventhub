import { AxiosError } from "axios";

export interface ApiErrorResponse {
  message: string;
}

/**
 * Extracts a user-friendly error message from various error types
 */
function extractErrorMessage(error: unknown): string {
  // If it's an axios error with a response
  if (error && typeof error === "object" && "response" in error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;

    // Check if we have our API error format
    if (axiosError.response?.data?.message) {
      return axiosError.response.data.message;
    }

    // Fallback to status text if available
    if (axiosError.response?.statusText) {
      return axiosError.response.statusText;
    }
  }

  // If it's a regular error with a message
  if (error && typeof error === "object" && "message" in error) {
    const regularError = error as Error;
    return regularError.message;
  }

  // If it's a string
  if (typeof error === "string") {
    return error;
  }

  // Fallback for unknown error types
  return "An unexpected error occurred";
}

export interface AppError {
  message: string;
  type:
    | "BAD_REQUEST"
    | "UNAUTHORIZED"
    | "FORBIDDEN"
    | "NOT_FOUND"
    | "INTERNAL_SERVER_ERROR"
    | "UNKNOWN";
}

export const createAppError = (error: any): AppError => {
  const message = extractErrorMessage(error);
  const statusCode = error?.response?.status;

  let type: AppError["type"] = "UNKNOWN";

  // Map status code to error type
  switch (statusCode) {
    case 400:
      type = "BAD_REQUEST";
      break;
    case 401:
      type = "UNAUTHORIZED";
      break;
    case 403:
      type = "FORBIDDEN";
      break;
    case 404:
      type = "NOT_FOUND";
      break;
    case 500:
      type = "INTERNAL_SERVER_ERROR";
      break;
  }

  return { message, type };
};
