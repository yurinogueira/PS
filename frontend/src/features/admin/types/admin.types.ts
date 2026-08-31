import { User } from "../../auth/types/auth.types";

export interface TenantSettings {
  hideOverviewByDefault?: boolean;
}

export interface Tenant {
  name: string;
  plan?: "free" | "standard";
  paymentStatus?: "paid" | "unpaid";
  settings?: TenantSettings;
  planStartedAt?: string;
  planExpiresAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface CreateTenantPayload {
  name: string;
  plan?: "free" | "standard";
  paymentStatus?: "paid" | "unpaid";
  hideOverviewByDefault?: boolean;
}

export interface UpdateTenantPlanPayload {
  plan: "free" | "standard";
}

export interface UpdateTenantPaymentStatusPayload {
  paymentStatus: "paid" | "unpaid";
}

export interface UpdateTenantSettingsPayload {
  hideOverviewByDefault: boolean;
}

export interface AssignTenantPayload {
  tenantId: string;
}

export type AdminUser = User;
