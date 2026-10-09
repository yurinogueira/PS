import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { AddDogModal } from "./AddDogModal";
import { clientService } from "../../../services/api/client.service";
import { personService } from "../../../services/api/person.service";
import { photographerService } from "../../../services/api/photographer.service";
import { useSeasonStore } from "../../../store/seasonStore";
import i18n from "../../../i18n";

describe("AddDogModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(async () => {
    vi.restoreAllMocks();
    await i18n.changeLanguage("pt-BR");
    useSeasonStore.setState({
      activeSeason: {
        id: "season-1",
        name: "Temporada Oficial",
        judges: ["Juiz Especialista 1", "Juiz Internacional 2"],
      },
    });

    vi.spyOn(clientService, "getById").mockResolvedValue({
      id: "client-1",
      person_id: "person-1",
      season_id: "season-1",
      dogs: [
        {
          breed: "Cão Existente",
          competitions_won: 0,
          photos: [],
        },
      ],
    });

    vi.spyOn(personService, "getById").mockResolvedValue({
      id: "person-1",
      name: "Mariana Silva",
      email: "mariana@exemplo.com",
      alternative_email: "",
      phone: "11988887777",
    });

    vi.spyOn(photographerService, "list").mockResolvedValue([
      { id: "photo-1", name: "Fotógrafo Alpha" },
    ]);
  });

  it("renders person details and dog form when open", async () => {
    render(
      <AddDogModal
        clientId="client-1"
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Mariana Silva")).toBeInTheDocument();
    });

    expect(screen.getByText(/mariana@exemplo.com/)).toBeInTheDocument();
    expect(screen.getByText(/\(11\) 98888-7777/)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Adicionar Cachorro" }),
    ).toBeInTheDocument();
  });

  it("allows filling dog breed, competitions won and adding won competition tags", async () => {
    render(
      <AddDogModal
        clientId="client-1"
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Mariana Silva")).toBeInTheDocument();
    });

    const breedInput = screen.getByLabelText(/Raça/i);
    fireEvent.change(breedInput, { target: { value: "Pastor Alemão" } });
    expect(breedInput).toHaveValue("Pastor Alemão");

    const compCountInput = screen.getByLabelText(/Competições Vencidas/i);
    fireEvent.change(compCountInput, { target: { value: "2" } });

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(/Nome da competição vencida.../i),
      ).toBeInTheDocument();
    });

    const addCompInput = screen.getByPlaceholderText(
      /Nome da competição vencida.../i,
    );
    fireEvent.change(addCompInput, { target: { value: "Campeonato 2026" } });
    fireEvent.keyDown(addCompInput, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(screen.getByText("Campeonato 2026")).toBeInTheDocument();
    });
  });

  it("saves dog and prepends to existing client dogs on submit", async () => {
    const updateSpy = vi
      .spyOn(clientService, "update")
      .mockResolvedValue({} as any);

    render(
      <AddDogModal
        clientId="client-1"
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Mariana Silva")).toBeInTheDocument();
    });

    const breedInput = screen.getByLabelText(/Raça/i);
    fireEvent.change(breedInput, { target: { value: "Golden Retriever" } });

    const saveButton = screen.getByRole("button", {
      name: "Adicionar Cachorro",
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(updateSpy).toHaveBeenCalledTimes(1);
    });

    expect(updateSpy).toHaveBeenCalledWith("client-1", {
      id: "client-1",
      person_id: "person-1",
      season_id: "season-1",
      dogs: [
        expect.objectContaining({
          breed: "Golden Retriever",
          competitions_won: 0,
        }),
        expect.objectContaining({
          breed: "Cão Existente",
        }),
      ],
    });

    expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("displays error alert when saving fails", async () => {
    vi.spyOn(clientService, "update").mockRejectedValue(
      new Error("Falha na API"),
    );

    render(
      <AddDogModal
        clientId="client-1"
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Mariana Silva")).toBeInTheDocument();
    });

    const saveButton = screen.getByRole("button", {
      name: "Adicionar Cachorro",
    });
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(
        screen.getByText("Erro ao adicionar cachorro."),
      ).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
    expect(mockOnClose).not.toHaveBeenCalled();
  });
});
