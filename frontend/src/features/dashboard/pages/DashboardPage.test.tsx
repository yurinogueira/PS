import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";
import { personService } from "../../../services/api/person.service";
import { clientService } from "../../../services/api/client.service";

vi.mock("../../../services/api/person.service", () => ({
  personService: {
    list: vi.fn(),
    create: vi.fn(),
  },
}));

vi.mock("../../../services/api/client.service", () => ({
  clientService: {
    list: vi.fn(),
  },
}));

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(personService.list).mockResolvedValue([
      {
        id: "p1",
        name: "Carlos Silva",
        email: "carlos@example.com",
        alternative_email: "",
        phone: "11999999999",
      },
    ]);
    vi.mocked(clientService.list).mockResolvedValue([]);
  });

  it("renders overview title and metric cards", async () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Visão Geral")).toBeInTheDocument();
    expect(screen.getByText("Total de Pessoas")).toBeInTheDocument();
    expect(screen.getByText("Cachorros no Evento")).toBeInTheDocument();
    expect(screen.getByText("Fotos Registradas")).toBeInTheDocument();
  });
});
