export type UserRole = "admin" | "manager" | "user";

export interface User {
  id: string;
  name: string;
  email: string;
  tenantId?: string;
  superAdmin?: boolean;
  role?: UserRole;
  emailVerified?: boolean;
  emailVerifiedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export function getUserRole(user: User | null | undefined): UserRole {
  if (!user) return "user";
  if (user.role) return user.role;
  if (user.superAdmin) return "admin";
  return "user";
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseData {
  user: User;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: unknown;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface ForgotPasswordPayload {
  email: string;
}

export interface ResetPasswordPayload {
  token: string;
  newPassword: string;
}

export interface VerifyEmailPayload {
  token: string;
}
