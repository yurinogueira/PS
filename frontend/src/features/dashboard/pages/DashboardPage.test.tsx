import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";
import { useSeasonStore } from "../../../store/seasonStore";
import { clientService } from "../../../services/api/client.service";
import { personService } from "../../../services/api/person.service";
import { photographerService } from "../../../services/api/photographer.service";
import { reportService } from "../../../services/api/report.service";

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSeasonStore.setState({ activeSeason: null });
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
    expect(
      screen.getByText("Nenhuma temporada selecionada"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Por favor, selecione uma temporada/i),
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
        screen.getByText("Nenhum cliente vinculado nesta temporada"),
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
    expect(screen.getByText("Cachorros no Evento")).toBeInTheDocument();
    expect(screen.getByText("Fotos Registradas")).toBeInTheDocument();
    expect(screen.getByText("Cachorros & Fotos")).toBeInTheDocument();
    expect(screen.getByText("Detalhes")).toBeInTheDocument();
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
        screen.getByText("Vincular Cliente na Temporada"),
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
});
