import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PersonDetailsPage } from "./PersonDetailsPage";
import { personService } from "../../../services/api/person.service";
import { clientService } from "../../../services/api/client.service";
import { photographerService } from "../../../services/api/photographer.service";
import { useSeasonStore } from "../../../store/seasonStore";

vi.mock("../../../services/api/person.service", () => ({
  personService: {
    getById: vi.fn(),
  },
}));

vi.mock("../../../services/api/client.service", () => ({
  clientService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}));

vi.mock("../../../services/api/photographer.service", () => ({
  photographerService: {
    list: vi.fn(),
  },
}));

describe("PersonDetailsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useSeasonStore.setState({
      activeSeason: {
        id: "s1",
        name: "2026 - Dog Nikity",
      },
    });
    vi.mocked(personService.getById).mockResolvedValue({
      id: "p123",
      name: "Mariana Souza",
      email: "mariana@example.com",
      alternative_email: "",
      phone: "11988887777",
    });
    vi.mocked(clientService.list).mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
    });
    vi.mocked(photographerService.list).mockResolvedValue([
      { id: "ph1", name: "Fotógrafo João" },
    ]);
  });

  it("renders person details and master-detail sections", async () => {
    render(
      <MemoryRouter initialEntries={["/people/p123"]}>
        <Routes>
          <Route path="/people/:id" element={<PersonDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Mariana Souza")).toBeInTheDocument();
    expect(screen.getByText("mariana@example.com")).toBeInTheDocument();
    expect(screen.getByText("(11) 98888-7777")).toBeInTheDocument();
    expect(screen.getByText("Cachorros")).toBeInTheDocument();
  });

  it("renders won competitions for dog", async () => {
    vi.mocked(clientService.list).mockResolvedValue({
      data: [
        {
          id: "client-1",
          person_id: "p123",
          season_id: "s1",
          dogs: [
            {
              breed: "Golden Retriever",
              judge: "Juiz Silva",
              is_owner: true,
              competitions_won: 2,
              won_competitions: ["Best in Show 2026", "Nacional Canina"],
              photos: [],
            },
          ],
        },
      ],
      total: 1,
      page: 1,
      limit: 10,
    });

    render(
      <MemoryRouter initialEntries={["/people/p123"]}>
        <Routes>
          <Route path="/people/:id" element={<PersonDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const breedElements = await screen.findAllByText("Golden Retriever");
    expect(breedElements.length).toBeGreaterThan(0);
    expect(screen.getByText("Vitórias:")).toBeInTheDocument();
    expect(screen.getByText("Best in Show 2026")).toBeInTheDocument();
    expect(screen.getByText("Nacional Canina")).toBeInTheDocument();
  });
});
