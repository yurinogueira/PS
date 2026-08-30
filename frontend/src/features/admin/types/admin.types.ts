import { User } from "../../auth/types/auth.types";

export interface Tenant {
  name: string;
  plan?: "free" | "standard";
  paymentStatus?: "paid" | "unpaid";
  planStartedAt?: string;
  planExpiresAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTenantPayload {
  name: string;
  plan?: "free" | "standard";
  paymentStatus?: "paid" | "unpaid";
}

export interface UpdateTenantPlanPayload {
  plan: "free" | "standard";
}

export interface UpdateTenantPaymentStatusPayload {
  paymentStatus: "paid" | "unpaid";
}

export interface AssignTenantPayload {
  tenantId: string;
}

export type AdminUser = User;
