import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { Topbar } from "../../../layouts/Topbar";
import { DashboardPage } from "./DashboardPage";
import { useSeasonStore } from "../../../store/seasonStore";
import { useAuthStore } from "../../auth/state/auth.store";
import { useTenantStore } from "../../../store/tenantStore";
import { useMenuStore } from "../../../store/menuStore";
import { clientService } from "../../../services/api/client.service";
import { personService } from "../../../services/api/person.service";
import { seasonService } from "../../../services/api/season.service";
import i18n from "../../../i18n";

describe("Dashboard and Topbar Menu Overlapping (Issue #64)", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await i18n.changeLanguage("pt-BR");
    useMenuStore.setState({ activeMenuId: null });
    useSeasonStore.setState({
      activeSeason: { id: "season-1", name: "Temporada Oficial 2026" },
    });
    useAuthStore.setState({
      user: {
        id: "user-1",
        name: "Yuri Nogueira",
        email: "yuri@example.com",
        tenantId: "tenant-1",
      },
      isAuthenticated: true,
    });
    useTenantStore.setState({ tenantStatus: null });

    vi.spyOn(seasonService, "list").mockResolvedValue([
      {
        id: "season-1",
        name: "Temporada Oficial 2026",
        photographer_ids: [],
        judges: [],
      },
    ]);
    vi.spyOn(personService, "list").mockResolvedValue([]);
    vi.spyOn(clientService, "list").mockResolvedValue({
      data: [],
      total: 0,
      page: 1,
      limit: 10,
    });
  });

  it("automatically closes reports menu when user avatar menu is clicked and vice-versa", async () => {
    const { container } = render(
      <BrowserRouter>
        <div>
          <Topbar onDrawerToggle={vi.fn()} />
          <DashboardPage />
        </div>
      </BrowserRouter>,
    );

    // 1. Initially neither menu is open
    expect(
      screen.queryByText("Exportar Clientes (.csv)"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Meu Perfil")).not.toBeInTheDocument();

    // 2. Open Reports Menu in Dashboard
    const reportsBtn = await screen.findByRole("button", {
      name: /relatórios/i,
    });
    fireEvent.click(reportsBtn);

    // Reports dropdown should be visible
    expect(
      await screen.findByText("Exportar Clientes (.csv)"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Meu Perfil")).not.toBeInTheDocument();

    // 3. Click the user avatar button in the Topbar WITHOUT closing reports menu first
    const avatarButton = container.querySelector(
      '[data-testid="topbar-avatar-btn"]',
    ) as HTMLElement;
    expect(avatarButton).toBeTruthy();
    fireEvent.click(avatarButton);

    // 4. Verify User Profile menu opened and Reports menu closed automatically!
    await waitFor(() => {
      expect(screen.getByText("Meu Perfil")).toBeInTheDocument();
      expect(
        screen.queryByText("Exportar Clientes (.csv)"),
      ).not.toBeInTheDocument();
    });

    // 5. Click Reports button again -> User menu closes and Reports menu opens!
    fireEvent.click(reportsBtn);

    await waitFor(() => {
      expect(screen.getByText("Exportar Clientes (.csv)")).toBeInTheDocument();
      expect(screen.queryByText("Meu Perfil")).not.toBeInTheDocument();
    });
  });
});
