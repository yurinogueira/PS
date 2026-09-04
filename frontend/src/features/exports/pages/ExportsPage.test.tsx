import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ExportsPage } from "./ExportsPage";
import { seasonService, Season } from "../../../services/api/season.service";
import { reportService } from "../../../services/api/report.service";
import { useSeasonStore } from "../../../store/seasonStore";
import { useTenantStore } from "../../../store/tenantStore";
import i18n from "../../../i18n";

describe("ExportsPage", () => {
  const mockSeasons: Season[] = [
    {
      id: "season-1",
      name: "Temporada Oficial 2026",
      photographer_ids: ["photo-1"],
    },
    {
      id: "season-2",
      name: "Copa Outono 2026",
      photographer_ids: ["photo-2"],
    },
  ];

  beforeEach(async () => {
    vi.restoreAllMocks();
    await i18n.changeLanguage("pt-BR");
    useSeasonStore.setState({ activeSeason: null });
    useTenantStore.setState({ tenantStatus: null });

    vi.spyOn(seasonService, "list").mockResolvedValue(mockSeasons);
    vi.spyOn(reportService, "listHistory").mockResolvedValue({
      jobs: [],
      total: 0,
      page: 1,
      limit: 10,
    });
    vi.spyOn(reportService, "exportClientsCsv").mockResolvedValue({
      message: "Exportação CSV iniciada",
    });
    vi.spyOn(reportService, "exportPaidClientsCsv").mockResolvedValue({
      message: "Exportação de pagos iniciada",
    });
    vi.spyOn(reportService, "exportUnpaidClientsCsv").mockResolvedValue({
      message: "Exportação de não pagos iniciada",
    });
    vi.spyOn(reportService, "exportClientsPdf").mockResolvedValue({
      message: "Exportação PDF iniciada",
    });
  });

  it("renders page header and all export cards", async () => {
    render(
      <BrowserRouter>
        <ExportsPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Central de Exportações")).toBeInTheDocument();
    expect(
      screen.getByText(/Gere relatórios customizados/i),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getByText("Relatório Consolidado (PDF)"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Relatório Geral de Clientes (CSV)"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Relatório de Clientes Pagos (CSV)"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Relatório de Não Pagos (CSV)"),
      ).toBeInTheDocument();
      expect(
        screen.getByText("Exportação Dinâmica por Pagamento"),
      ).toBeInTheDocument();
    });
  });

  it("triggers CSV export when clicking export button", async () => {
    render(
      <BrowserRouter>
        <ExportsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Relatório Geral de Clientes (CSV)"),
      ).toBeInTheDocument();
    });

    const exportCsvBtn = screen.getByRole("button", { name: /exportar csv/i });
    fireEvent.click(exportCsvBtn);

    await waitFor(() => {
      expect(reportService.exportClientsCsv).toHaveBeenCalled();
      expect(screen.getByText("Exportação CSV iniciada")).toBeInTheDocument();
    });
  });

  it("disables export buttons when tenant has overdue payment", async () => {
    useTenantStore.setState({
      tenantStatus: {
        name: "Tenant 1",
        isUnpaid: true,
        paymentStatus: "unpaid",
        isTrialExpired: false,
        trialDaysRemaining: 10,
        clientLimitExceeded: false,
        maxClientsInSeason: 300,
        plan: "standard",
        createdAt: "2026-01-01T00:00:00Z",
      },
    });

    render(
      <BrowserRouter>
        <ExportsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      const exportCsvBtn = screen.getByRole("button", {
        name: /exportar csv/i,
      });
      expect(exportCsvBtn).toBeDisabled();
    });
  });

  it("opens dynamic export dialog on clicking configure button", async () => {
    render(
      <BrowserRouter>
        <ExportsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Exportação Dinâmica por Pagamento"),
      ).toBeInTheDocument();
    });

    const configBtn = screen.getByRole("button", {
      name: /configurar e exportar/i,
    });
    fireEvent.click(configBtn);

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
      expect(
        screen.getByText(/Selecione os critérios desejados/i),
      ).toBeInTheDocument();
    });
  });

  it("uses activeSeason from useSeasonStore and does not render event select dropdown", async () => {
    useSeasonStore.setState({
      activeSeason: mockSeasons[0],
    });

    render(
      <BrowserRouter>
        <ExportsPage />
      </BrowserRouter>,
    );

    // Verify active season badge is displayed
    expect(
      screen.getByText(`Evento Ativo: ${mockSeasons[0].name}`),
    ).toBeInTheDocument();

    // Verify no select dropdown exists for choosing another season
    expect(
      screen.queryByLabelText(/Filtrar por Evento/i),
    ).not.toBeInTheDocument();

    // Trigger CSV export and verify it uses active season ID
    const exportCsvBtn = screen.getByRole("button", { name: /exportar csv/i });
    fireEvent.click(exportCsvBtn);

    await waitFor(() => {
      expect(reportService.exportClientsCsv).toHaveBeenCalledWith(
        mockSeasons[0].id,
      );
    });
  });

  it("does not render direct download button on consolidated PDF card and triggers async export", async () => {
    render(
      <BrowserRouter>
        <ExportsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Relatório Consolidado (PDF)"),
      ).toBeInTheDocument();
    });

    // Ensure "Download Direto" is not present anywhere
    expect(
      screen.queryByRole("button", { name: /download direto/i }),
    ).not.toBeInTheDocument();

    // Trigger async PDF export via "Solicitar via E-mail"
    const asyncPdfBtn = screen.getByRole("button", {
      name: /solicitar via e-mail/i,
    });
    fireEvent.click(asyncPdfBtn);

    await waitFor(() => {
      expect(reportService.exportClientsPdf).toHaveBeenCalled();
      expect(screen.getByText("Exportação PDF iniciada")).toBeInTheDocument();
    });
  });
});
