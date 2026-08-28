import { apiClient } from "../../../services/api/client";
import { ApiEnvelope } from "../../auth/types/auth.types";
import {
  AdminUser,
  AssignTenantPayload,
  CreateTenantPayload,
  Tenant,
} from "../types/admin.types";

export const adminService = {
  async getTenants(): Promise<Tenant[]> {
    const response =
      await apiClient.get<ApiEnvelope<{ tenants: Tenant[] }>>("/admin/tenants");
    return response.data.data.tenants || [];
  },

  async createTenant(payload: CreateTenantPayload): Promise<Tenant> {
    const response = await apiClient.post<ApiEnvelope<{ tenant: Tenant }>>(
      "/admin/tenants",
      payload,
    );
    return response.data.data.tenant;
  },

  async getUsers(): Promise<AdminUser[]> {
    const response =
      await apiClient.get<ApiEnvelope<{ users: AdminUser[] }>>("/admin/users");
    return response.data.data.users || [];
  },

  async assignTenant(
    userId: string,
    payload: AssignTenantPayload,
  ): Promise<AdminUser> {
    const response = await apiClient.put<ApiEnvelope<{ user: AdminUser }>>(
      `/admin/users/${userId}/tenant`,
      payload,
    );
    return response.data.data.user;
  },
};
