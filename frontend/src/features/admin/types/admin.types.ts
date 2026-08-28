import { User } from "../../auth/types/auth.types";

export interface Tenant {
  name: string;
  createdAt: string;
}

export interface CreateTenantPayload {
  name: string;
}

export interface AssignTenantPayload {
  tenantId: string;
}

export type AdminUser = User;
