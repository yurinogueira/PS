import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { ClientsPage } from "./ClientsPage";
import {
  clientService,
  SeasonClient,
} from "../../../services/api/client.service";
import { personService, Person } from "../../../services/api/person.service";
import { photographerService } from "../../../services/api/photographer.service";
import { useSeasonStore } from "../../../store/seasonStore";
import i18n from "../../../i18n";

describe("ClientsPage", () => {
  const mockPeople: Person[] = [
    {
      id: "person-1",
      name: "Renata Prado",
      email: "renata@test.com",
      alternative_email: "",
      phone: "11988887777",
    },
    {
      id: "person-2",
      name: "Gabriel Martins",
      email: "gabriel@test.com",
      alternative_email: "",
      phone: "21977776666",
    },
  ];

  const mockClients: SeasonClient[] = [
    {
      id: "client-1",
      person_id: "person-1",
      season_id: "season-1",
      dogs: [
        {
          breed: "Border Collie",
          competitions_won: 1,
          photos: [
            {
              file_number: "IMG_1001",
              photographer_id: "p1",
              payment_method: "Pix",
            },
          ],
        },
      ],
    },
    {
      id: "client-2",
      person_id: "person-2",
      season_id: "season-1",
      dogs: [
        {
          breed: "Golden Retriever",
          competitions_won: 0,
          photos: [
            {
              file_number: "IMG_2002",
              photographer_id: "p1",
              payment_method: "Pix",
            },
          ],
        },
      ],
    },
  ];

  beforeEach(async () => {
    vi.restoreAllMocks();
    await i18n.changeLanguage("pt-BR");
    useSeasonStore.setState({
      activeSeason: {
        id: "season-1",
        name: "Temporada Oficial 2026",
        photographer_ids: [],
      },
    });

    vi.spyOn(clientService, "list").mockResolvedValue({
      data: mockClients,
      total: 2,
      page: 1,
      limit: 100,
    });
    vi.spyOn(personService, "list").mockResolvedValue(mockPeople);
    vi.spyOn(photographerService, "list").mockResolvedValue([]);
  });

  it("renders clients list with person name and dog/photo counts", async () => {
    render(
      <BrowserRouter>
        <ClientsPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Clientes e Fotos")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Renata Prado")).toBeInTheDocument();
      expect(screen.getByText("Gabriel Martins")).toBeInTheDocument();
    });

    expect(screen.getAllByRole("row").length).toBeGreaterThan(2);
  });

  it("filters clients with search input and clears filter", async () => {
    render(
      <BrowserRouter>
        <ClientsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Renata Prado")).toBeInTheDocument();
      expect(screen.getByText("Gabriel Martins")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar por pessoa/i);
    fireEvent.change(searchInput, { target: { value: "Renata" } });

    expect(screen.getByText("Renata Prado")).toBeInTheDocument();
    expect(screen.queryByText("Gabriel Martins")).not.toBeInTheDocument();

    const clearButton = screen.getByLabelText(/Cancelar/i);
    fireEvent.click(clearButton);

    expect(screen.getByText("Renata Prado")).toBeInTheDocument();
    expect(screen.getByText("Gabriel Martins")).toBeInTheDocument();
  });

  it("paginates clients when list exceeds rowsPerPage", async () => {
    const manyClients: SeasonClient[] = Array.from({ length: 12 }, (_, i) => ({
      id: `client-uuid-${i + 1}`,
      person_id: "person-1",
      season_id: "season-1",
      dogs: [
        {
          breed: `Raça ${i + 1}`,
          competitions_won: 0,
          photos: [],
        },
      ],
    }));

    vi.spyOn(clientService, "list").mockResolvedValueOnce({
      data: manyClients,
      total: 12,
      page: 1,
      limit: 100,
    });

    render(
      <BrowserRouter>
        <ClientsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText("Renata Prado").length).toBe(10);
    });

    const nextPageBtn = screen.getByRole("button", {
      name: /next page|próxima página/i,
    });
    fireEvent.click(nextPageBtn);

    expect(screen.getAllByText("Renata Prado").length).toBe(2);
  });
});
