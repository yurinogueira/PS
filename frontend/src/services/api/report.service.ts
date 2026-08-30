import { apiClient } from "./client";

export interface ReportExportResponse {
  message: string;
}

export const reportService = {
  exportClientsCsv: async (
    seasonId?: string,
  ): Promise<ReportExportResponse> => {
    const { data } = await apiClient.post<ReportExportResponse>(
      "/reports/clients-csv",
      null,
      { params: seasonId ? { season_id: seasonId } : undefined },
    );
    return data;
  },

  exportUnpaidClientsCsv: async (
    seasonId?: string,
  ): Promise<ReportExportResponse> => {
    const { data } = await apiClient.post<ReportExportResponse>(
      "/reports/unpaid-clients-csv",
      null,
      { params: seasonId ? { season_id: seasonId } : undefined },
    );
    return data;
  },

  exportPaidClientsCsv: async (
    seasonId?: string,
  ): Promise<ReportExportResponse> => {
    const { data } = await apiClient.post<ReportExportResponse>(
      "/reports/paid-clients-csv",
      null,
      { params: seasonId ? { season_id: seasonId } : undefined },
    );
    return data;
  },

  exportClientsPdf: async (
    seasonId?: string,
  ): Promise<ReportExportResponse> => {
    const { data } = await apiClient.post<ReportExportResponse>(
      "/reports/clients-pdf",
      null,
      { params: seasonId ? { season_id: seasonId } : undefined },
    );
    return data;
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
