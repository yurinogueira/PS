import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";
import { useSeasonStore } from "../../../store/seasonStore";
import { useTenantStore } from "../../../store/tenantStore";
import { clientService } from "../../../services/api/client.service";
import { personService } from "../../../services/api/person.service";
import { photographerService } from "../../../services/api/photographer.service";
import { reportService } from "../../../services/api/report.service";

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSeasonStore.setState({ activeSeason: null });
    useTenantStore.setState({ tenantStatus: null });
    vi.spyOn(personService, "list").mockResolvedValue([]);
    vi.spyOn(clientService, "list").mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
    });
    vi.spyOn(photographerService, "list").mockResolvedValue([]);
  });

  it("renders alert when no active season is selected", () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Visão Geral")).toBeInTheDocument();
    expect(screen.getByText("Nenhum evento selecionado")).toBeInTheDocument();
    expect(
      screen.getByText(/Por favor, selecione um evento/i),
    ).toBeInTheDocument();
  });

  it("renders empty state when season has no clients", async () => {
    useSeasonStore.setState({
      activeSeason: { id: "season-1", name: "Temporada Oficial 2026" },
    });

    vi.spyOn(clientService, "list").mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
    });
    vi.spyOn(personService, "list").mockResolvedValue([]);

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Nenhum cliente vinculado neste evento"),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("Vincular Primeiro Cliente")).toBeInTheDocument();
  });

  it("renders clients table with calculations for dogs and photos", async () => {
    useSeasonStore.setState({
      activeSeason: { id: "season-1", name: "Temporada 2026" },
    });

    vi.spyOn(clientService, "list").mockResolvedValue({
      data: [
        {
          id: "client-1",
          person_id: "person-1",
          season_id: "season-1",
          dogs: [
            {
              breed: "Border Collie",
              judge: "Juiz Silva",
              competitions_won: 1,
              won_competitions: ["Nacional 2026"],
              photos: [
                {
                  file_number: "DSC_001",
                  photographer_id: "photog-1",
                  payment_method: "Pix",
                  amount_paid: 50,
                },
                {
                  file_number: "DSC_002",
                  photographer_id: "photog-1",
                  payment_method: "Pix",
                  amount_paid: 50,
                },
              ],
            },
          ],
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    });

    vi.spyOn(personService, "list").mockResolvedValue([
      {
        id: "person-1",
        name: "Carlos Ferreira",
        email: "carlos@example.com",
        alternative_email: "",
        phone: "1199999999",
      },
    ]);

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Carlos Ferreira")).toBeInTheDocument();
    });

    expect(screen.getByText("Total de Pessoas")).toBeInTheDocument();
    expect(
      screen.getAllByText("Cachorros no Evento").length,
    ).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("Fotos Registradas")).toBeInTheDocument();
    expect(screen.getByText("Cachorros & Fotos")).toBeInTheDocument();
    expect(screen.getByText("Editar Dados")).toBeInTheDocument();
  });

  it("triggers search and shows empty search state when no results", async () => {
    useSeasonStore.setState({
      activeSeason: { id: "season-1", name: "Temporada 2026" },
    });

    const listSpy = vi.spyOn(clientService, "list").mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
    });
    vi.spyOn(personService, "list").mockResolvedValue([]);

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    const searchInput = screen.getByPlaceholderText(
      "Buscar por pessoa, cão ou número da foto...",
    );
    fireEvent.change(searchInput, { target: { value: "Inexistente" } });

    await waitFor(
      () => {
        expect(listSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            search: "Inexistente",
          }),
        );
      },
      { timeout: 1000 },
    );

    await waitFor(() => {
      expect(screen.getByText("Nenhum cliente encontrado")).toBeInTheDocument();
    });
  });

  it("opens LinkClientModal when clicking Vincular Cliente", async () => {
    useSeasonStore.setState({
      activeSeason: { id: "season-1", name: "Temporada 2026" },
    });

    vi.spyOn(clientService, "list").mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
    });
    vi.spyOn(personService, "list").mockResolvedValue([
      {
        id: "p1",
        name: "Maria Santos",
        email: "maria@test.com",
        alternative_email: "",
        phone: "123",
      },
    ]);
    vi.spyOn(photographerService, "list").mockResolvedValue([]);

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    const vincularBtns = screen.getAllByRole("button", {
      name: /Vincular Cliente/i,
    });
    fireEvent.click(vincularBtns[0]);

    await waitFor(() => {
      expect(
        screen.getByText("Vincular Cliente no Evento"),
      ).toBeInTheDocument();
    });
  });

  it("triggers export of clients csv report from report menu", async () => {
    useSeasonStore.setState({
      activeSeason: { id: "season-1", name: "Temporada 2026" },
    });

    const exportSpy = vi
      .spyOn(reportService, "exportClientsCsv")
      .mockResolvedValue({ message: "Exportação iniciada!" });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    const reportBtn = screen.getByRole("button", { name: /Relatórios/i });
    fireEvent.click(reportBtn);

    const exportOption = await screen.findByText("Exportar Clientes (.csv)");
    fireEvent.click(exportOption);

    await waitFor(() => {
      expect(exportSpy).toHaveBeenCalled();
      expect(screen.getByText("Exportação iniciada!")).toBeInTheDocument();
    });
  });

  it("triggers export of unpaid clients csv report from report menu", async () => {
    useSeasonStore.setState({
      activeSeason: { id: "season-1", name: "Temporada 2026" },
    });

    const exportSpy = vi
      .spyOn(reportService, "exportUnpaidClientsCsv")
      .mockResolvedValue({ message: "Exportação de não pagos iniciada!" });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    const reportBtn = screen.getByRole("button", { name: /Relatórios/i });
    fireEvent.click(reportBtn);

    const exportOption = await screen.findByText("Exportar Não Pagos (.csv)");
    fireEvent.click(exportOption);

    await waitFor(() => {
      expect(exportSpy).toHaveBeenCalled();
      expect(
        screen.getByText("Exportação de não pagos iniciada!"),
      ).toBeInTheDocument();
    });
  });

  it("triggers export of paid clients csv report from report menu", async () => {
    useSeasonStore.setState({
      activeSeason: { id: "season-1", name: "Temporada 2026" },
    });

    const exportSpy = vi
      .spyOn(reportService, "exportPaidClientsCsv")
      .mockResolvedValue({ message: "Exportação de pagos iniciada!" });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    const reportBtn = screen.getByRole("button", { name: /Relatórios/i });
    fireEvent.click(reportBtn);

    const exportOption = await screen.findByText("Exportar Pagos (.csv)");
    fireEvent.click(exportOption);

    await waitFor(() => {
      expect(exportSpy).toHaveBeenCalled();
      expect(
        screen.getByText("Exportação de pagos iniciada!"),
      ).toBeInTheDocument();
    });
  });

  it("opens quick create person modal when clicking Nova Pessoa", async () => {
    useSeasonStore.setState({
      activeSeason: { id: "season-1", name: "Temporada 2026" },
    });

    vi.spyOn(clientService, "list").mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
    });
    vi.spyOn(personService, "list").mockResolvedValue([]);
    vi.spyOn(photographerService, "list").mockResolvedValue([]);

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    const novaPessoaBtn = screen.getByRole("button", {
      name: /Nova Pessoa/i,
    });
    fireEvent.click(novaPessoaBtn);

    await waitFor(() => {
      expect(screen.getByText("Cadastrar Nova Pessoa")).toBeInTheDocument();
      expect(screen.getByText("Salvar e Editar Dados")).toBeInTheDocument();
    });
  });

  it("toggles overview visibility when clicking toggle button", async () => {
    useSeasonStore.setState({
      activeSeason: { id: "season-1", name: "Temporada 2026" },
    });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    // Initial state: toggle button shows "Ocultar Visão Geral"
    const toggleBtn = screen.getByRole("button", {
      name: /Ocultar Visão Geral/i,
    });
    expect(toggleBtn).toBeInTheDocument();

    // Click to hide
    fireEvent.click(toggleBtn);

    expect(
      screen.getByRole("button", { name: /Exibir Visão Geral/i }),
    ).toBeInTheDocument();

    // Click to show again
    fireEvent.click(
      screen.getByRole("button", { name: /Exibir Visão Geral/i }),
    );

    expect(
      screen.getByRole("button", { name: /Ocultar Visão Geral/i }),
    ).toBeInTheDocument();
  });

  it("starts with overview hidden when tenant has hideOverviewByDefault flag set to true", async () => {
    useSeasonStore.setState({
      activeSeason: { id: "season-1", name: "Temporada 2026" },
    });
    useTenantStore.setState({
      tenantStatus: {
        name: "test-org",
        plan: "standard",
        paymentStatus: "paid",
        settings: { hideOverviewByDefault: true },
        isTrialExpired: false,
        trialDaysRemaining: 14,
        isUnpaid: false,
        clientLimitExceeded: false,
        maxClientsInSeason: 10,
        createdAt: "2026-08-30T00:00:00Z",
      },
    });

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    // Button should initially be "Exibir Visão Geral"
    expect(
      screen.getByRole("button", { name: /Exibir Visão Geral/i }),
    ).toBeInTheDocument();
  });

  it("renders revenue separated into BRL and USD without summing them", async () => {
    useSeasonStore.setState({
      activeSeason: { id: "season-1", name: "Temporada 2026" },
    });

    vi.spyOn(clientService, "list").mockResolvedValue({
      data: [
        {
          id: "client-1",
          person_id: "person-1",
          season_id: "season-1",
          dogs: [
            {
              breed: "Border Collie",
              competitions_won: 0,
              photos: [
                {
                  file_number: "DSC_001",
                  photographer_id: "photog-1",
                  payment_method: "Pix",
                  currency: "BRL",
                  amount_paid: 250,
                },
                {
                  file_number: "DSC_002",
                  photographer_id: "photog-1",
                  payment_method: "Cartão de Crédito",
                  currency: "USD",
                  amount_paid: 75,
                },
                {
                  file_number: "DSC_003",
                  photographer_id: "photog-1",
                  payment_method: "Não pago",
                  amount_paid: 100,
                },
              ],
            },
          ],
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    });

    vi.spyOn(personService, "list").mockResolvedValue([
      {
        id: "person-1",
        name: "Carlos Ferreira",
        email: "carlos@example.com",
        alternative_email: "",
        phone: "1199999999",
      },
    ]);

    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("R$ 250.00")).toBeInTheDocument();
      expect(screen.getByText("$ 75.00")).toBeInTheDocument();
    });
  });
});
