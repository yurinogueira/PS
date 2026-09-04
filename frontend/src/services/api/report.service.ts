import { apiClient } from "./client";
import { ApiEnvelope } from "../../features/auth/types/auth.types";

export type ReportType =
  | "clients_csv"
  | "paid_clients_csv"
  | "unpaid_clients_csv"
  | "clients_pdf"
  | "dynamic_payment";

export type ReportStatus = "pending" | "processing" | "completed" | "failed";

export interface ReportJobUser {
  user_id?: string;
  user_name?: string;
  user_email?: string;
}

export interface ReportJobFilters {
  is_paid?: boolean;
  payment_methods?: string[];
}

export interface ReportJob {
  id: string;
  tenant_id: string;
  season_id?: string;
  season_name?: string;
  type: ReportType;
  status: ReportStatus;
  filters?: ReportJobFilters;
  requested_by?: ReportJobUser;
  file_path?: string;
  user_email?: string;
  user_name?: string;
  error?: string;
  created_at: string;
  completed_at?: string;
  duration_ms?: number;
}

export interface ReportHistoryResponse {
  jobs: ReportJob[];
  total: number;
  page: number;
  limit: number;
}

export interface DynamicPaymentParams {
  season_id?: string;
  paid_status?: "all" | "paid" | "unpaid";
  is_paid?: boolean;
  payment_methods?: string[];
}

export interface ReportExportResponse {
  message: string;
  job?: ReportJob;
}

export const reportService = {
  exportClientsCsv: async (
    seasonId?: string,
  ): Promise<ReportExportResponse> => {
    const { data } = await apiClient.post<
      ReportExportResponse | ApiEnvelope<ReportExportResponse>
    >("/reports/clients-csv", null, {
      params: seasonId ? { season_id: seasonId } : undefined,
    });
    const payload = (data as ApiEnvelope<ReportExportResponse>)?.data || data;
    return payload as ReportExportResponse;
  },

  exportUnpaidClientsCsv: async (
    seasonId?: string,
  ): Promise<ReportExportResponse> => {
    const { data } = await apiClient.post<
      ReportExportResponse | ApiEnvelope<ReportExportResponse>
    >("/reports/unpaid-clients-csv", null, {
      params: seasonId ? { season_id: seasonId } : undefined,
    });
    const payload = (data as ApiEnvelope<ReportExportResponse>)?.data || data;
    return payload as ReportExportResponse;
  },

  exportPaidClientsCsv: async (
    seasonId?: string,
  ): Promise<ReportExportResponse> => {
    const { data } = await apiClient.post<
      ReportExportResponse | ApiEnvelope<ReportExportResponse>
    >("/reports/paid-clients-csv", null, {
      params: seasonId ? { season_id: seasonId } : undefined,
    });
    const payload = (data as ApiEnvelope<ReportExportResponse>)?.data || data;
    return payload as ReportExportResponse;
  },

  exportClientsPdf: async (
    seasonId?: string,
  ): Promise<ReportExportResponse> => {
    const { data } = await apiClient.post<
      ReportExportResponse | ApiEnvelope<ReportExportResponse>
    >("/reports/clients-pdf", null, {
      params: seasonId ? { season_id: seasonId } : undefined,
    });
    const payload = (data as ApiEnvelope<ReportExportResponse>)?.data || data;
    return payload as ReportExportResponse;
  },

  exportDynamicPayment: async (
    params: DynamicPaymentParams,
  ): Promise<ReportExportResponse> => {
    const { data } = await apiClient.post<
      ReportExportResponse | ApiEnvelope<ReportExportResponse>
    >("/reports/dynamic-payment", params);
    const payload = (data as ApiEnvelope<ReportExportResponse>)?.data || data;
    return payload as ReportExportResponse;
  },

  listHistory: async (params?: {
    page?: number;
    limit?: number;
    season_id?: string;
  }): Promise<ReportHistoryResponse> => {
    const { data } = await apiClient.get<
      ReportHistoryResponse | ApiEnvelope<ReportHistoryResponse>
    >("/reports/history", {
      params: {
        page: params?.page || 1,
        limit: params?.limit || 10,
        season_id: params?.season_id || undefined,
      },
    });
    const payload = (data as ApiEnvelope<ReportHistoryResponse>)?.data || data;
    const history = payload as ReportHistoryResponse;
    return {
      jobs: history?.jobs || [],
      total: history?.total || 0,
      page: history?.page || params?.page || 1,
      limit: history?.limit || params?.limit || 10,
    };
  },

  getJob: async (id: string): Promise<ReportJob> => {
    const { data } = await apiClient.get<ReportJob | ApiEnvelope<ReportJob>>(
      `/reports/jobs/${id}`,
    );
    const payload = (data as ApiEnvelope<ReportJob>)?.data || data;
    return payload as ReportJob;
  },

  downloadClientsPdfDirect: async (seasonId?: string): Promise<Blob> => {
    const { data } = await apiClient.get<Blob>("/reports/clients-pdf", {
      params: seasonId ? { season_id: seasonId } : undefined,
      responseType: "blob",
    });
    return data;
  },

  downloadReport: async (filePath: string): Promise<Blob> => {
    const { data } = await apiClient.get<Blob>("/reports/download", {
      params: { file: filePath },
      responseType: "blob",
    });
    return data;
  },
};
