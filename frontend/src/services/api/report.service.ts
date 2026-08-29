import { apiClient } from "./client";

export interface ReportExportResponse {
  message: string;
}

export const reportService = {
  exportClientsCsv: async (): Promise<ReportExportResponse> => {
    const { data } = await apiClient.post<ReportExportResponse>(
      "/reports/clients-csv",
    );
    return data;
  },

  exportUnpaidClientsCsv: async (): Promise<ReportExportResponse> => {
    const { data } = await apiClient.post<ReportExportResponse>(
      "/reports/unpaid-clients-csv",
    );
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
