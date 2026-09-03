import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { PhotographersPage } from "./PhotographersPage";
import {
  photographerService,
  Photographer,
} from "../../../services/api/photographer.service";
import { seasonService, Season } from "../../../services/api/season.service";
import i18n from "../../../i18n";

describe("PhotographersPage", () => {
  const mockPhotographers: Photographer[] = [
    {
      id: "photog-uuid-1",
      name: "Carlos Fotografia",
      created_at: "2026-05-10T10:00:00Z",
    },
    {
      id: "photog-uuid-2",
      name: "Mariana Lentes",
      created_at: "2026-06-15T14:30:00Z",
    },
  ];

  const mockSeasons: Season[] = [
    {
      id: "season-1",
      name: "Dog Show 2026",
      photographer_ids: ["photog-uuid-1"],
      judges: [],
    },
    {
      id: "season-2",
      name: "Agility Championship",
      photographer_ids: ["photog-uuid-1", "photog-uuid-2"],
      judges: [],
    },
  ];

  beforeEach(async () => {
    vi.restoreAllMocks();
    await i18n.changeLanguage("pt-BR");
    vi.spyOn(photographerService, "list").mockResolvedValue(mockPhotographers);
    vi.spyOn(seasonService, "list").mockResolvedValue(mockSeasons);
    vi.spyOn(photographerService, "create").mockResolvedValue({
      id: "photog-3",
      name: "Novo Fotógrafo",
    });
    vi.spyOn(photographerService, "delete").mockResolvedValue();
  });

  it("renders photographers list without raw UUID column and with enriched linked events", async () => {
    render(
      <BrowserRouter>
        <PhotographersPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Fotógrafos")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Carlos Fotografia")).toBeInTheDocument();
      expect(screen.getByText("Mariana Lentes")).toBeInTheDocument();
    });

    // Check that ID column header is NOT present
    expect(
      screen.queryByRole("columnheader", { name: /^ID$/i }),
    ).not.toBeInTheDocument();

    // Raw UUIDs should not be displayed
    expect(screen.queryByText("photog-uuid-1")).not.toBeInTheDocument();
    expect(screen.queryByText("photog-uuid-2")).not.toBeInTheDocument();

    // Check enriched columns
    expect(screen.getByText("Eventos Vinculados")).toBeInTheDocument();
    expect(screen.getByText("Data de Cadastro")).toBeInTheDocument();

    // Check linked event names
    expect(screen.getByText("Dog Show 2026")).toBeInTheDocument();
    expect(
      screen.getAllByText("Agility Championship").length,
    ).toBeGreaterThanOrEqual(1);
  });

  it("opens create modal and saves new photographer", async () => {
    render(
      <BrowserRouter>
        <PhotographersPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Carlos Fotografia")).toBeInTheDocument();
    });

    const addButton = screen.getByRole("button", { name: /novo fotógrafo/i });
    fireEvent.click(addButton);

    expect(screen.getByRole("dialog")).toBeInTheDocument();

    const input = screen.getByLabelText(/nome/i);
    fireEvent.change(input, { target: { value: "Novo Fotógrafo" } });

    const saveButton = screen.getByRole("button", { name: "Salvar" });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(photographerService.create).toHaveBeenCalledWith({
        name: "Novo Fotógrafo",
      });
    });
  });

  it("opens delete confirmation modal and confirms deletion", async () => {
    render(
      <BrowserRouter>
        <PhotographersPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Carlos Fotografia")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button", {
      name: /excluir fotógrafo/i,
    });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(
        screen.getByText(/tem certeza que deseja excluir este fotógrafo/i),
      ).toBeInTheDocument();
    });

    const confirmButtons = screen.getAllByRole("button", {
      name: /excluir fotógrafo/i,
    });
    // The confirm button inside the dialog
    const modalConfirmButton = confirmButtons[confirmButtons.length - 1];
    fireEvent.click(modalConfirmButton);

    await waitFor(() => {
      expect(photographerService.delete).toHaveBeenCalledWith("photog-uuid-1");
    });
  });

  it("filters photographers by name using search input", async () => {
    render(
      <BrowserRouter>
        <PhotographersPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Carlos Fotografia")).toBeInTheDocument();
      expect(screen.getByText("Mariana Lentes")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      /Buscar fotógrafo por nome/i,
    );
    fireEvent.change(searchInput, { target: { value: "Mariana" } });

    expect(screen.queryByText("Carlos Fotografia")).not.toBeInTheDocument();
    expect(screen.getByText("Mariana Lentes")).toBeInTheDocument();

    const clearButton = screen.getByLabelText(/Cancelar/i);
    fireEvent.click(clearButton);

    expect(screen.getByText("Carlos Fotografia")).toBeInTheDocument();
    expect(screen.getByText("Mariana Lentes")).toBeInTheDocument();
  });

  it("paginates photographers when list exceeds rowsPerPage", async () => {
    const manyPhotographers = Array.from({ length: 12 }, (_, i) => ({
      id: `photog-id-${i + 1}`,
      name: `Fotógrafo ${i + 1}`,
      created_at: "2026-06-01T10:00:00Z",
    }));

    vi.spyOn(photographerService, "list").mockResolvedValueOnce(
      manyPhotographers,
    );

    render(
      <BrowserRouter>
        <PhotographersPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Fotógrafo 1")).toBeInTheDocument();
    });

    expect(screen.getByText("Fotógrafo 10")).toBeInTheDocument();
    expect(screen.queryByText("Fotógrafo 11")).not.toBeInTheDocument();

    const nextPageBtn = screen.getByRole("button", {
      name: /next page|próxima página/i,
    });
    fireEvent.click(nextPageBtn);

    expect(screen.queryByText("Fotógrafo 1")).not.toBeInTheDocument();
    expect(screen.getByText("Fotógrafo 11")).toBeInTheDocument();
    expect(screen.getByText("Fotógrafo 12")).toBeInTheDocument();
  });
});
