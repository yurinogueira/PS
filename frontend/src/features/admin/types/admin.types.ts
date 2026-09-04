import { User, UserRole } from "../../auth/types/auth.types";

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

export interface UpdateUserRolePayload {
  role: UserRole;
}

export type AuditLogAction =
  "CREATE" | "UPDATE" | "DELETE" | "ROLE_CHANGE" | "ASSIGN_TENANT";

export type AuditLogEntityType =
  "user" | "tenant" | "season" | "photographer" | "person" | "client";

export interface AuditLogChange {
  fieldChanged: string;
  oldValue: unknown;
  newValue: unknown;
}

export interface AuditLog {
  id: string;
  tenantId?: string;
  entityType: AuditLogEntityType;
  entityId: string;
  userId: string;
  userEmail: string;
  action: AuditLogAction;
  changes: AuditLogChange[];
  createdAt: string;
}

export interface AuditLogsFilter {
  page?: number;
  limit?: number;
  entityType?: AuditLogEntityType | "";
  entity_type?: AuditLogEntityType | "";
  action?: AuditLogAction | "";
  userId?: string;
  user_id?: string;
  startDate?: string;
  start_date?: string;
  endDate?: string;
  end_date?: string;
}

export interface PaginatedAuditLogs {
  items: AuditLog[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
