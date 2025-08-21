export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  org_name?: string;
  role: "CUSTOMER" | "ORGANIZER" | "ADMIN";
  is_blocked: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  org_name?: string;
  role?: "CUSTOMER" | "ORGANIZER";
}
