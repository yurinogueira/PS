import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Topbar } from "./Topbar";
import { useSeasonStore } from "../store/seasonStore";
import { useAuthStore } from "../features/auth/state/auth.store";
import { seasonService } from "../services/api/season.service";
import i18n from "../i18n";

describe("Topbar Responsiveness and Text Truncation (Issue #65)", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await i18n.changeLanguage("pt-BR");
    useSeasonStore.setState({ activeSeason: null });
    useAuthStore.setState({
      user: {
        id: "user-long-name",
        name: "Yuri Nogueira Moreira da Silva de Souza Albuquerque",
        email: "yuri.super.long.developer.email@example.com",
        tenantId: "tenant-1",
      },
      isAuthenticated: true,
    });

    vi.spyOn(seasonService, "list").mockResolvedValue([
      {
        id: "season-special",
        name: "Campeonato Internacional Canino Oficial de Primavera 2026",
        photographer_ids: [],
        judges: [],
      },
    ]);
  });

  it("renders user name with tooltip and ellipsis styling to avoid wrapping", async () => {
    render(
      <BrowserRouter>
        <Topbar onDrawerToggle={vi.fn()} />
      </BrowserRouter>,
    );

    const userNameEl = screen.getByText(
      "Yuri Nogueira Moreira da Silva de Souza Albuquerque",
    );
    expect(userNameEl).toBeInTheDocument();

    // Verify styling properties preventing text wrapping
    expect(userNameEl).toHaveStyle({
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    });
  });

  it("renders active season with event icon context", async () => {
    useSeasonStore.setState({
      activeSeason: {
        id: "season-special",
        name: "Campeonato Internacional Canino Oficial de Primavera 2026",
      },
    });

    render(
      <BrowserRouter>
        <Topbar onDrawerToggle={vi.fn()} />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText(
          "Campeonato Internacional Canino Oficial de Primavera 2026",
        ),
      ).toBeInTheDocument();
    });
  });

  it("renders empty state icon and message when no season is selected", async () => {
    vi.spyOn(seasonService, "list").mockResolvedValue([]);
    useSeasonStore.setState({ activeSeason: null });

    render(
      <BrowserRouter>
        <Topbar onDrawerToggle={vi.fn()} />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Nenhum evento")).toBeInTheDocument();
    });
  });
});
