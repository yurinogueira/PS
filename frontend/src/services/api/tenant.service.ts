import { apiClient } from "./client";
import { ApiEnvelope } from "../../features/auth/types/auth.types";

export interface TenantStatus {
  name: string;
  plan: "free" | "standard";
  paymentStatus: "paid" | "unpaid";
  planStartedAt?: string;
  planExpiresAt?: string;
  isTrialExpired: boolean;
  trialDaysRemaining: number;
  isUnpaid: boolean;
  clientLimitExceeded: boolean;
  maxClientsInSeason: number;
  createdAt: string;
  updatedAt?: string;
}

export const tenantService = {
  async getCurrentTenant(): Promise<TenantStatus> {
    const response =
      await apiClient.get<ApiEnvelope<{ tenant: TenantStatus }>>("/tenant");
    return response.data.data.tenant;
  },
};
