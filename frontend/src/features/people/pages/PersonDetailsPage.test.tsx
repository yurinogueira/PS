import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { PersonDetailsPage } from "./PersonDetailsPage";
import { personService } from "../../../services/api/person.service";
import { clientService } from "../../../services/api/client.service";
import { photographerService } from "../../../services/api/photographer.service";

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
    expect(screen.getByText("Cachorros")).toBeInTheDocument();
  });
});
