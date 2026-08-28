import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";
import { useSeasonStore } from "../../../store/seasonStore";
import { clientService } from "../../../services/api/client.service";
import { personService } from "../../../services/api/person.service";
import { photographerService } from "../../../services/api/photographer.service";

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useSeasonStore.setState({ activeSeason: null });
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

    vi.spyOn(clientService, "list").mockResolvedValueOnce({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
    });
    vi.spyOn(personService, "list").mockResolvedValueOnce([]);

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

    vi.spyOn(clientService, "list").mockResolvedValueOnce({
      data: [
        {
          id: "client-1",
          person_id: "person-1",
          season_id: "season-1",
          dogs: [
            {
              id: "dog-1",
              breed: "Border Collie",
              judge: "Juiz Silva",
              competitions_won: 1,
              photos: [
                {
                  id: "photo-1",
                  file_number: "DSC_001",
                  photographer_id: "photog-1",
                  payment_method: "Pix",
                },
                {
                  id: "photo-2",
                  file_number: "DSC_002",
                  photographer_id: "photog-1",
                  payment_method: "Pix",
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

    vi.spyOn(personService, "list").mockResolvedValueOnce([
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

    expect(screen.getByText("1")).toBeInTheDocument(); // Cachorros
    expect(screen.getByText("2")).toBeInTheDocument(); // Total de fotos
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

    const vincularBtn = screen.getByRole("button", {
      name: /Vincular Cliente/i,
    });
    fireEvent.click(vincularBtn);

    await waitFor(() => {
      expect(
        screen.getByText("Vincular Cliente na Temporada"),
      ).toBeInTheDocument();
    });
  });
});
