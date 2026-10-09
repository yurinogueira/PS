import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ClientDetailsModal } from "./ClientDetailsModal";
import { clientService } from "../../../services/api/client.service";
import { personService } from "../../../services/api/person.service";
import { photographerService } from "../../../services/api/photographer.service";
import { useSeasonStore } from "../../../store/seasonStore";
import i18n from "../../../i18n";

describe("ClientDetailsModal", () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();

  beforeEach(async () => {
    vi.restoreAllMocks();
    await i18n.changeLanguage("pt-BR");
    useSeasonStore.setState({
      activeSeason: {
        id: "season-1",
        name: "Temporada Oficial",
        judges: ["Juiz Especialista 1"],
      },
    });

    vi.spyOn(clientService, "getById").mockResolvedValue({
      id: "client-1",
      person_id: "person-1",
      season_id: "season-1",
      dogs: [
        {
          breed: "Border Collie",
          competitions_won: 2,
          won_competitions: ["Campeão Adulto", "Melhor da Raça"],
          photos: [
            {
              file_number: "BC_001",
              photographer_id: "photo-1",
              payment_method: "Pix",
              currency: "BRL",
              amount_paid: 100,
              competitions: ["Melhor da Raça"],
            },
          ],
        },
      ],
    });

    vi.spyOn(personService, "getById").mockResolvedValue({
      id: "person-1",
      name: "Carlos Eduardo",
      email: "carlos@exemplo.com",
      alternative_email: "",
      phone: "11999998888",
    });

    vi.spyOn(photographerService, "list").mockResolvedValue([
      { id: "photo-1", name: "Fotógrafo Alpha" },
    ]);
  });

  it("renders client details and photo competitions autocomplete field", async () => {
    render(
      <ClientDetailsModal
        clientId="client-1"
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Carlos Eduardo")).toBeInTheDocument();
    });

    expect(screen.getByText(/carlos@exemplo.com/)).toBeInTheDocument();
    expect(screen.getByText("Border Collie")).toBeInTheDocument();
    expect(screen.getByLabelText(/Competições da Foto/i)).toBeInTheDocument();
  });
});
