import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import {
  ExportHistoryTable,
  formatDuration,
  formatDate,
} from "./ExportHistoryTable";
import { reportService, ReportJob } from "../../../services/api/report.service";
import i18n from "../../../i18n";

describe("ExportHistoryTable", () => {
  const mockJobs: ReportJob[] = [
    {
      id: "job-1",
      tenant_id: "tenant-1",
      season_id: "season-1",
      season_name: "Dog Show 2026",
      type: "clients_csv",
      status: "completed",
      requested_by: {
        user_name: "Admin User",
        user_email: "admin@ps.com",
      },
      file_path: "reports/tenant_1/clientes_123.csv",
      created_at: "2026-09-03T10:00:00Z",
      completed_at: "2026-09-03T10:00:02Z",
      duration_ms: 2400,
    },
    {
      id: "job-2",
      tenant_id: "tenant-1",
      type: "dynamic_payment",
      status: "processing",
      requested_by: {
        user_name: "Operador",
      },
      created_at: "2026-09-03T11:00:00Z",
    },
    {
      id: "job-3",
      tenant_id: "tenant-1",
      type: "paid_clients_csv",
      status: "failed",
      error: "Falha de conexão com provedor de armazenamento",
      created_at: "2026-09-03T12:00:00Z",
    },
    {
      id: "job-4",
      tenant_id: "tenant-1",
      type: "unpaid_clients_csv",
      status: "expired",
      file_path: "reports/tenant_1/clientes_nao_pagos_old.csv",
      created_at: "2026-08-01T10:00:00Z",
      expired_at: "2026-09-01T10:00:00Z",
    },
  ];

  beforeEach(async () => {
    vi.restoreAllMocks();
    await i18n.changeLanguage("pt-BR");
    vi.spyOn(reportService, "listHistory").mockResolvedValue({
      jobs: mockJobs,
      total: 4,
      page: 1,
      limit: 10,
    });
  });

  it("formats duration correctly", () => {
    expect(formatDuration(undefined)).toBe("-");
    expect(formatDuration(-1)).toBe("-");
    expect(formatDuration(500)).toBe("500ms");
    expect(formatDuration(2400)).toBe("2.4s");
    expect(formatDuration(45000)).toBe("45.0s");
    expect(formatDuration(72000)).toBe("1m 12s");
    expect(formatDuration(120000)).toBe("2m");
  });

  it("formats date correctly", () => {
    expect(formatDate(undefined)).toBe("-");
    expect(formatDate("invalid-date")).toBe("invalid-date");
    expect(formatDate("2026-09-03T10:00:00Z")).toContain("2026");
  });

  it("renders jobs list with proper headers and status chips", async () => {
    render(<ExportHistoryTable />);

    expect(screen.getByText("Histórico de Exportações")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Clientes Geral (CSV)")).toBeInTheDocument();
      expect(
        screen.getByText("Dinâmico por Pagamento (PDF)"),
      ).toBeInTheDocument();
      expect(screen.getByText("Clientes Pagos (CSV)")).toBeInTheDocument();
      expect(screen.getByText("Admin User")).toBeInTheDocument();
      expect(screen.getByText("2.4s")).toBeInTheDocument();
      expect(screen.getByText("Concluído")).toBeInTheDocument();
      expect(screen.getByText("Processando")).toBeInTheDocument();
      expect(screen.getByText("Falha")).toBeInTheDocument();
      expect(screen.getByText("Expirado")).toBeInTheDocument();
    });
  });

  it("renders disabled download action button for expired jobs", async () => {
    render(<ExportHistoryTable />);

    await waitFor(() => {
      expect(screen.getByText("Expirado")).toBeInTheDocument();
    });

    const downloadButtons = screen.getAllByTestId("DownloadRoundedIcon");
    // The expired job button should be disabled
    const disabledButtons = downloadButtons
      .map((icon) => icon.closest("button"))
      .filter((btn) => btn?.hasAttribute("disabled"));

    expect(disabledButtons.length).toBeGreaterThanOrEqual(1);
  });

  it("triggers file download on clicking download button", async () => {
    const downloadMock = vi
      .spyOn(reportService, "downloadReport")
      .mockResolvedValue(new Blob(["csv content"], { type: "text/csv" }));

    // Mock window.URL
    const createObjectURLMock = vi.fn().mockReturnValue("blob:http://dummy");
    const revokeObjectURLMock = vi.fn();
    window.URL.createObjectURL = createObjectURLMock;
    window.URL.revokeObjectURL = revokeObjectURLMock;

    render(<ExportHistoryTable />);

    await waitFor(() => {
      expect(screen.getByText("Clientes Geral (CSV)")).toBeInTheDocument();
    });

    // Find the active (enabled) download button for job-1
    const downloadIcons = screen.getAllByTestId("DownloadRoundedIcon");
    const enabledButton = downloadIcons
      .map((icon) => icon.closest("button"))
      .find((btn) => btn && !btn.hasAttribute("disabled"));

    expect(enabledButton).toBeDefined();
    if (enabledButton) {
      fireEvent.click(enabledButton);
      await waitFor(() => {
        expect(downloadMock).toHaveBeenCalledWith(
          "reports/tenant_1/clientes_123.csv",
        );
        expect(createObjectURLMock).toHaveBeenCalled();
      });
    }
  });

  it("displays expired error message in snackbar if download returns 410 Gone", async () => {
    vi.spyOn(reportService, "downloadReport").mockRejectedValue({
      response: { status: 410 },
    });

    render(<ExportHistoryTable />);

    await waitFor(() => {
      expect(screen.getByText("Clientes Geral (CSV)")).toBeInTheDocument();
    });

    const downloadIcons = screen.getAllByTestId("DownloadRoundedIcon");
    const enabledButton = downloadIcons
      .map((icon) => icon.closest("button"))
      .find((btn) => btn && !btn.hasAttribute("disabled"));

    expect(enabledButton).toBeDefined();
    if (enabledButton) {
      fireEvent.click(enabledButton);
      await waitFor(() => {
        expect(
          screen.getByText(
            "Este relatório expirou e não está mais disponível para download.",
          ),
        ).toBeInTheDocument();
      });
    }
  });
});
