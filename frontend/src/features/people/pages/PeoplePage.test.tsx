import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { PeoplePage } from "./PeoplePage";
import { personService } from "../../../services/api/person.service";

vi.mock("../../../services/api/person.service", () => ({
  personService: {
    list: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

describe("PeoplePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders people list with masked/formatted phone numbers", async () => {
    vi.mocked(personService.list).mockResolvedValueOnce([
      {
        id: "p1",
        name: "Adrian Handler",
        email: "adrian@test.com",
        alternative_email: "",
        phone: "21972978784",
      },
    ]);

    render(
      <BrowserRouter>
        <PeoplePage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Adrian Handler")).toBeInTheDocument();
    });

    expect(screen.getByText("(21) 97297-8784")).toBeInTheDocument();
  });

  it("applies brazilian phone mask dynamically when typing in create modal", async () => {
    vi.mocked(personService.list).mockResolvedValueOnce([]);
    vi.mocked(personService.create).mockResolvedValueOnce({
      id: "p2",
      name: "Novo Cliente",
      email: "novo@test.com",
      alternative_email: "",
      phone: "(21) 99999-9999",
    });

    render(
      <BrowserRouter>
        <PeoplePage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Nenhuma pessoa cadastrada."),
      ).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: /Nova Pessoa/i }));

    const phoneInput = screen.getByLabelText(/Telefone/i);
    expect(phoneInput).toBeInTheDocument();

    fireEvent.change(phoneInput, { target: { value: "21999999999" } });
    expect(phoneInput).toHaveValue("(21) 99999-9999");
  });

  it("loads masked phone when editing a person", async () => {
    vi.mocked(personService.list).mockResolvedValueOnce([
      {
        id: "p3",
        name: "Carlos Teste",
        email: "carlos@test.com",
        alternative_email: "",
        phone: "21988887777",
      },
    ]);

    render(
      <BrowserRouter>
        <PeoplePage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Carlos Teste")).toBeInTheDocument();
    });

    const editBtn = screen.getByRole("button", { name: /Editar/i });
    fireEvent.click(editBtn);

    const phoneInput = screen.getByLabelText(/Telefone/i);
    expect(phoneInput).toHaveValue("(21) 98888-7777");
  });

  it("filters people with search input and clears filter", async () => {
    vi.mocked(personService.list).mockResolvedValueOnce([
      {
        id: "p1",
        name: "Alice Silva",
        email: "alice@test.com",
        alternative_email: "",
        phone: "11999991111",
      },
      {
        id: "p2",
        name: "Bruno Costa",
        email: "bruno@test.com",
        alternative_email: "",
        phone: "21988882222",
      },
    ]);

    render(
      <BrowserRouter>
        <PeoplePage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Alice Silva")).toBeInTheDocument();
      expect(screen.getByText("Bruno Costa")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar por nome/i);
    fireEvent.change(searchInput, { target: { value: "Alice" } });

    expect(screen.getByText("Alice Silva")).toBeInTheDocument();
    expect(screen.queryByText("Bruno Costa")).not.toBeInTheDocument();

    const clearButton = screen.getByLabelText(/Cancelar/i);
    fireEvent.click(clearButton);

    expect(screen.getByText("Alice Silva")).toBeInTheDocument();
    expect(screen.getByText("Bruno Costa")).toBeInTheDocument();
  });

  it("paginates people according to rowsPerPage and page changes", async () => {
    const mockList = Array.from({ length: 12 }, (_, i) => ({
      id: `p-${i + 1}`,
      name: `Pessoa ${i + 1}`,
      email: `pessoa${i + 1}@test.com`,
      alternative_email: "",
      phone: `119000000${i < 10 ? "0" + i : i}`,
    }));

    vi.mocked(personService.list).mockResolvedValueOnce(mockList);

    render(
      <BrowserRouter>
        <PeoplePage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Pessoa 1")).toBeInTheDocument();
    });

    // Default 10 rows: Pessoa 10 is visible, Pessoa 11 and 12 are on next page
    expect(screen.getByText("Pessoa 10")).toBeInTheDocument();
    expect(screen.queryByText("Pessoa 11")).not.toBeInTheDocument();

    // Go to next page
    const nextPageBtn = screen.getByRole("button", {
      name: /next page|próxima página/i,
    });
    fireEvent.click(nextPageBtn);

    expect(screen.queryByText("Pessoa 1")).not.toBeInTheDocument();
    expect(screen.getByText("Pessoa 11")).toBeInTheDocument();
    expect(screen.getByText("Pessoa 12")).toBeInTheDocument();
  });
});
