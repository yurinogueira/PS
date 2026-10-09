import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
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
  CURRENCIES: [
    { label: "Real (R$)", value: "BRL" },
    { label: "Dólar ($)", value: "USD" },
    { label: "Outro", value: "OTHER" },
  ],
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
        photographer_ids: ["ph1"],
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

  it("renders photos with custom USD currency and unpaid status correctly", async () => {
    vi.mocked(clientService.list).mockResolvedValue({
      data: [
        {
          id: "client-1",
          person_id: "p123",
          season_id: "s1",
          dogs: [
            {
              breed: "Beagle",
              is_owner: true,
              competitions_won: 0,
              photos: [
                {
                  file_number: "DSC_0001",
                  photographer_id: "ph1",
                  payment_method: "Cartão de Crédito",
                  currency: "USD",
                  amount_paid: 25.5,
                },
                {
                  file_number: "DSC_0002",
                  photographer_id: "ph1",
                  payment_method: "Não pago",
                  amount_paid: 0,
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

    render(
      <MemoryRouter initialEntries={["/people/p123"]}>
        <Routes>
          <Route path="/people/:id" element={<PersonDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Arquivo: DSC_0001")).toBeInTheDocument();
    expect(screen.getByText("$ 25.50")).toBeInTheDocument();
    expect(screen.getByText("Arquivo: DSC_0002")).toBeInTheDocument();
  });

  it("renders separate total collected chips for USD and BRL on a dog", async () => {
    vi.mocked(clientService.list).mockResolvedValue({
      data: [
        {
          id: "client-1",
          person_id: "p123",
          season_id: "s1",
          dogs: [
            {
              breed: "Pug",
              is_owner: true,
              competitions_won: 0,
              photos: [
                {
                  file_number: "DSC_1001",
                  photographer_id: "ph1",
                  payment_method: "Pix",
                  currency: "BRL",
                  amount_paid: 120,
                },
                {
                  file_number: "DSC_1002",
                  photographer_id: "ph1",
                  payment_method: "Cartão de Crédito",
                  currency: "USD",
                  amount_paid: 40,
                },
                {
                  file_number: "DSC_1003",
                  photographer_id: "ph1",
                  payment_method: "Dinheiro",
                  currency: "OTHER",
                  amount_paid: 60,
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

    render(
      <MemoryRouter initialEntries={["/people/p123"]}>
        <Routes>
          <Route path="/people/:id" element={<PersonDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Total Arrecadado: R$ 120.00"),
    ).toBeInTheDocument();
    expect(screen.getByText("Total Arrecadado: $ 40.00")).toBeInTheDocument();
    expect(
      screen.getByText("Total Arrecadado: Outro 60.00"),
    ).toBeInTheDocument();
    expect(screen.getByText("Outro 60.00")).toBeInTheDocument();
  });

  it("renders photo-level competitions chips on registered photo cards", async () => {
    vi.mocked(clientService.list).mockResolvedValue({
      data: [
        {
          id: "client-1",
          person_id: "p123",
          season_id: "s1",
          dogs: [
            {
              breed: "Doberman",
              is_owner: true,
              competitions_won: 1,
              won_competitions: ["Best in Breed 2026"],
              photos: [
                {
                  file_number: "DOB_001",
                  photographer_id: "ph1",
                  payment_method: "Pix",
                  currency: "BRL",
                  amount_paid: 150,
                  competitions: ["Campeão Jovem Especial", "Melhor Cabeça"],
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

    render(
      <MemoryRouter initialEntries={["/people/p123"]}>
        <Routes>
          <Route path="/people/:id" element={<PersonDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Arquivo: DOB_001")).toBeInTheDocument();
    expect(screen.getByText("Campeão Jovem Especial")).toBeInTheDocument();
    expect(screen.getByText("Melhor Cabeça")).toBeInTheDocument();
  });

  it("renders translated breed label in new dog modal", async () => {
    render(
      <MemoryRouter initialEntries={["/people/p123"]}>
        <Routes>
          <Route path="/people/:id" element={<PersonDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Mariana Souza")).toBeInTheDocument();
    const addDogButtons = await screen.findAllByRole("button", {
      name: /cadastrar cachorro/i,
    });
    fireEvent.click(addDogButtons[0]);

    expect(screen.getByText("Cadastrar Novo Cachorro")).toBeInTheDocument();
    expect(screen.getByLabelText(/Raça/i)).toBeInTheDocument();
    expect(
      screen.queryByText(/clients\.fields\.breed/i),
    ).not.toBeInTheDocument();
  });

  it("filters photographer select by active season photographer_ids in add photo dialog", async () => {
    vi.mocked(photographerService.list).mockResolvedValue([
      { id: "ph1", name: "Ronaldo Rufino" },
      { id: "ph2", name: "Edmilson Reis" },
    ]);
    useSeasonStore.setState({
      activeSeason: {
        id: "s1",
        name: "tgeste teste",
        photographer_ids: ["ph1"],
      },
    });
    vi.mocked(clientService.list).mockResolvedValue({
      data: [
        {
          id: "client-1",
          person_id: "p123",
          season_id: "s1",
          dogs: [
            {
              breed: "Poodle",
              is_owner: true,
              competitions_won: 0,
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

    expect(await screen.findByText("Mariana Souza")).toBeInTheDocument();
    const addPhotosBtn = await screen.findByRole("button", {
      name: /^adicionar fotos$/i,
    });
    fireEvent.click(addPhotosBtn);

    expect(screen.getByText("Adicionar Fotos para Poodle")).toBeInTheDocument();

    const photogSelect = screen.getByLabelText("Fotógrafo");
    fireEvent.mouseDown(photogSelect);

    const listbox = screen.getByRole("listbox");
    expect(within(listbox).getByText("Ronaldo Rufino")).toBeInTheDocument();
    expect(
      within(listbox).queryByText("Edmilson Reis"),
    ).not.toBeInTheDocument();
  });

  it("shows none informed and helper text when active season has no photographers", async () => {
    vi.mocked(photographerService.list).mockResolvedValue([
      { id: "ph1", name: "Ronaldo Rufino" },
    ]);
    useSeasonStore.setState({
      activeSeason: {
        id: "s1",
        name: "Empty Event",
        photographer_ids: [],
      },
    });
    vi.mocked(clientService.list).mockResolvedValue({
      data: [
        {
          id: "client-1",
          person_id: "p123",
          season_id: "s1",
          dogs: [
            {
              breed: "Beagle",
              is_owner: true,
              competitions_won: 0,
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

    expect(await screen.findByText("Mariana Souza")).toBeInTheDocument();
    const addPhotosBtn = await screen.findByRole("button", {
      name: /^adicionar fotos$/i,
    });
    fireEvent.click(addPhotosBtn);

    expect(
      screen.getAllByText("Nenhum fotógrafo vinculado a este evento.").length,
    ).toBeGreaterThan(0);
  });

  it("renders dogs panel header with nowrap button and whitespace styling (Issue #131)", async () => {
    render(
      <MemoryRouter initialEntries={["/people/p123"]}>
        <Routes>
          <Route path="/people/:id" element={<PersonDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByText("Mariana Souza")).toBeInTheDocument();
    const addDogBtn = screen.getByRole("button", { name: /adicionar/i });
    expect(addDogBtn).toBeInTheDocument();
    expect(addDogBtn).toHaveStyle({
      whiteSpace: "nowrap",
    });

    const dogsTitle = screen.getByText("Cachorros");
    expect(dogsTitle).toHaveStyle({
      whiteSpace: "nowrap",
    });
  });

  it("consolidates total collected revenue across all dogs for the client in active season in top header (Issue #110)", async () => {
    vi.mocked(clientService.list).mockResolvedValue({
      data: [
        {
          id: "client-1",
          person_id: "p123",
          season_id: "s1",
          dogs: [
            {
              breed: "Golden Retriever",
              is_owner: true,
              competitions_won: 0,
              photos: [
                {
                  file_number: "DSC_001",
                  photographer_id: "ph1",
                  payment_method: "Pix",
                  currency: "BRL",
                  amount_paid: 150,
                },
                {
                  file_number: "DSC_002",
                  photographer_id: "ph1",
                  payment_method: "Não pago",
                  amount_paid: 0,
                },
              ],
            },
            {
              breed: "Border Collie",
              is_owner: true,
              competitions_won: 0,
              photos: [
                {
                  file_number: "DSC_003",
                  photographer_id: "ph1",
                  payment_method: "Cartão de Crédito",
                  currency: "BRL",
                  amount_paid: 80,
                },
                {
                  file_number: "DSC_004",
                  photographer_id: "ph1",
                  payment_method: "Dinheiro",
                  currency: "USD",
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

    render(
      <MemoryRouter initialEntries={["/people/p123"]}>
        <Routes>
          <Route path="/people/:id" element={<PersonDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    // BRL: 150 + 80 = 230; USD: 50
    expect(
      await screen.findByText("Total Arrecadado: R$ 230.00"),
    ).toBeInTheDocument();
    expect(screen.getByText("Total Arrecadado: $ 50.00")).toBeInTheDocument();

    // Verify chips are placed alongside the event chip in the top header
    const eventChip = screen.getByText("Evento: 2026 - Dog Nikity");
    expect(eventChip).toBeInTheDocument();

    // Verify photos header has photo count and NOT the revenue chips
    expect(screen.getByText("Fotos Cadastradas (2)")).toBeInTheDocument();
  });

  it("renders expanded 44x44 avatar badge for photo file number including long numbers (Issue #110)", async () => {
    vi.mocked(clientService.list).mockResolvedValue({
      data: [
        {
          id: "client-1",
          person_id: "p123",
          season_id: "s1",
          dogs: [
            {
              breed: "Beagle",
              is_owner: true,
              competitions_won: 0,
              photos: [
                {
                  file_number: "10450",
                  photographer_id: "ph1",
                  payment_method: "Pix",
                  currency: "BRL",
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

    render(
      <MemoryRouter initialEntries={["/people/p123"]}>
        <Routes>
          <Route path="/people/:id" element={<PersonDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    const badge = await screen.findByText("#10450");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveStyle({
      width: "44px",
      height: "44px",
    });
  });

  it("renders default R$ 0.00 total collected chip when no photos are paid in active season (Issue #110)", async () => {
    vi.mocked(clientService.list).mockResolvedValue({
      data: [
        {
          id: "client-1",
          person_id: "p123",
          season_id: "s1",
          dogs: [
            {
              breed: "Poodle",
              is_owner: true,
              competitions_won: 0,
              photos: [
                {
                  file_number: "DSC_999",
                  photographer_id: "ph1",
                  payment_method: "Não pago",
                  amount_paid: 0,
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

    render(
      <MemoryRouter initialEntries={["/people/p123"]}>
        <Routes>
          <Route path="/people/:id" element={<PersonDetailsPage />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(
      await screen.findByText("Total Arrecadado: R$ 0.00"),
    ).toBeInTheDocument();
  });
});
