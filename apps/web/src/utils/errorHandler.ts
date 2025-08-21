import { AxiosError } from "axios";

export interface ApiErrorResponse {
  success: boolean;
  message: string;
}

/**
 * Extracts a user-friendly error message from various error types
 */
export function extractErrorMessage(error: unknown): string {
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
