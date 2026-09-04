import { apiClient } from "../../../services/api/client";
import { ApiEnvelope } from "../../auth/types/auth.types";
import {
  AdminUser,
  AssignTenantPayload,
  AuditLogsFilter,
  CreateTenantPayload,
  PaginatedAuditLogs,
  Tenant,
  UpdateTenantPaymentStatusPayload,
  UpdateTenantPlanPayload,
  UpdateTenantSettingsPayload,
  UpdateUserRolePayload,
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

  async updateTenantPlan(
    name: string,
    payload: UpdateTenantPlanPayload,
  ): Promise<Tenant> {
    const response = await apiClient.put<ApiEnvelope<{ tenant: Tenant }>>(
      `/admin/tenants/${encodeURIComponent(name)}/plan`,
      payload,
    );
    return response.data.data.tenant;
  },

  async updateTenantPaymentStatus(
    name: string,
    payload: UpdateTenantPaymentStatusPayload,
  ): Promise<Tenant> {
    const response = await apiClient.put<ApiEnvelope<{ tenant: Tenant }>>(
      `/admin/tenants/${encodeURIComponent(name)}/payment-status`,
      payload,
    );
    return response.data.data.tenant;
  },

  async updateTenantSettings(
    name: string,
    payload: UpdateTenantSettingsPayload,
  ): Promise<Tenant> {
    const response = await apiClient.put<ApiEnvelope<{ tenant: Tenant }>>(
      `/admin/tenants/${encodeURIComponent(name)}/settings`,
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

  async updateUserRole(
    userId: string,
    payload: UpdateUserRolePayload,
  ): Promise<AdminUser> {
    const response = await apiClient.put<ApiEnvelope<{ user: AdminUser }>>(
      `/admin/users/${userId}/role`,
      payload,
    );
    return response.data.data.user;
  },

  async getAuditLogs(params?: AuditLogsFilter): Promise<PaginatedAuditLogs> {
    const queryParams: Record<string, unknown> = {};
    if (params) {
      if (params.page !== undefined) queryParams.page = params.page;
      if (params.limit !== undefined) queryParams.limit = params.limit;
      const entity = params.entity_type || params.entityType;
      if (entity) {
        queryParams.entity_type = entity;
        queryParams.entityType = entity;
      }
      if (params.action) {
        queryParams.action = params.action;
      }
      const user = params.user_id || params.userId;
      if (user) {
        queryParams.user_id = user;
        queryParams.userId = user;
      }
      const start = params.start_date || params.startDate;
      if (start) {
        queryParams.start_date = start;
        queryParams.startDate = start;
      }
      const end = params.end_date || params.endDate;
      if (end) {
        queryParams.end_date = end;
        queryParams.endDate = end;
      }
    }
    const response = await apiClient.get<ApiEnvelope<PaginatedAuditLogs>>(
      "/admin/logs",
      { params: queryParams },
    );
    return response.data.data;
  },
};
