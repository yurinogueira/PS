import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { SeasonsPage } from "./SeasonsPage";
import { seasonService, Season } from "../../../services/api/season.service";
import { photographerService } from "../../../services/api/photographer.service";
import { useSeasonStore } from "../../../store/seasonStore";
import i18n from "../../../i18n";

describe("SeasonsPage", () => {
  const mockSeasons: Season[] = [
    {
      id: "season-1",
      name: "Dog Show 2026",
      photographer_ids: ["p1"],
      judges: ["Juiz A", "Juiz B"],
    },
    {
      id: "season-2",
      name: "Agility Cup 2026",
      photographer_ids: [],
      judges: [],
    },
  ];

  beforeEach(async () => {
    vi.restoreAllMocks();
    await i18n.changeLanguage("pt-BR");
    useSeasonStore.setState({ activeSeason: null });
    vi.spyOn(seasonService, "list").mockResolvedValue(mockSeasons);
    vi.spyOn(photographerService, "list").mockResolvedValue([]);
    vi.spyOn(seasonService, "delete").mockResolvedValue();
  });

  it("renders seasons list correctly", async () => {
    render(
      <BrowserRouter>
        <SeasonsPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Eventos")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Dog Show 2026")).toBeInTheDocument();
      expect(screen.getByText("Agility Cup 2026")).toBeInTheDocument();
    });
  });

  it("opens delete confirmation modal with cascade entities warning", async () => {
    render(
      <BrowserRouter>
        <SeasonsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Dog Show 2026")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button", { name: /excluir/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Confirmar Exclusão")).toBeInTheDocument();
      expect(
        screen.getByText(/removidos permanentemente em cascata/i),
      ).toBeInTheDocument();
    });
  });

  it("deletes season and updates activeSeason in store when deleted season was active", async () => {
    useSeasonStore.setState({ activeSeason: mockSeasons[0] });

    render(
      <BrowserRouter>
        <SeasonsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Dog Show 2026")).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByRole("button", { name: /excluir/i });
    fireEvent.click(deleteButtons[0]);

    await waitFor(() => {
      expect(screen.getByText("Confirmar Exclusão")).toBeInTheDocument();
    });

    // Mock list after delete returning only season-2
    vi.spyOn(seasonService, "list").mockResolvedValue([mockSeasons[1]]);

    const confirmButton = screen.getByRole("button", { name: "Excluir" });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(seasonService.delete).toHaveBeenCalledWith("season-1");
      expect(useSeasonStore.getState().activeSeason?.id).toBe("season-2");
    });
  });

  it("renders enriched seasons table without raw UUID column", async () => {
    render(
      <BrowserRouter>
        <SeasonsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Dog Show 2026")).toBeInTheDocument();
    });

    // Check that ID column header is NOT present
    expect(
      screen.queryByRole("columnheader", { name: /^ID$/i }),
    ).not.toBeInTheDocument();
    // Raw UUID values should not be directly displayed
    expect(screen.queryByText("season-1")).not.toBeInTheDocument();
    expect(screen.queryByText("season-2")).not.toBeInTheDocument();

    // Verify enriched columns
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("Juízes")).toBeInTheDocument();
    expect(screen.getByText("Data de Criação")).toBeInTheDocument();
    expect(screen.getByText("Juiz A")).toBeInTheDocument();
    expect(screen.getByText("Juiz B")).toBeInTheDocument();
  });

  it("allows setting a season as active from the table", async () => {
    render(
      <BrowserRouter>
        <SeasonsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Dog Show 2026")).toBeInTheDocument();
    });

    const setAsActiveButtons = screen.getAllByRole("button", {
      name: /definir como ativo/i,
    });
    fireEvent.click(setAsActiveButtons[0]);

    expect(useSeasonStore.getState().activeSeason?.id).toBe("season-1");
  });

  it("filters seasons using search input and clears filter", async () => {
    render(
      <BrowserRouter>
        <SeasonsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Dog Show 2026")).toBeInTheDocument();
      expect(screen.getByText("Agility Cup 2026")).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Buscar por nome ou ano/i);
    fireEvent.change(searchInput, { target: { value: "Agility" } });

    expect(screen.queryByText("Dog Show 2026")).not.toBeInTheDocument();
    expect(screen.getByText("Agility Cup 2026")).toBeInTheDocument();

    const clearButton = screen.getByLabelText(/Cancelar/i);
    fireEvent.click(clearButton);

    expect(screen.getByText("Dog Show 2026")).toBeInTheDocument();
    expect(screen.getByText("Agility Cup 2026")).toBeInTheDocument();
  });

  it("paginates seasons when count exceeds rowsPerPage", async () => {
    const manySeasons = Array.from({ length: 12 }, (_, i) => ({
      id: `season-id-${i + 1}`,
      name: `Evento ${i + 1}`,
      photographer_ids: [],
      judges: [],
    }));

    vi.spyOn(seasonService, "list").mockResolvedValueOnce(manySeasons);

    render(
      <BrowserRouter>
        <SeasonsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Evento 1")).toBeInTheDocument();
    });

    expect(screen.getByText("Evento 10")).toBeInTheDocument();
    expect(screen.queryByText("Evento 11")).not.toBeInTheDocument();

    const nextPageBtn = screen.getByRole("button", {
      name: /next page|próxima página/i,
    });
    fireEvent.click(nextPageBtn);

    expect(screen.queryByText("Evento 1")).not.toBeInTheDocument();
    expect(screen.getByText("Evento 11")).toBeInTheDocument();
    expect(screen.getByText("Evento 12")).toBeInTheDocument();
  });
});
