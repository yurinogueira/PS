import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { useAuthStore } from "../features/auth/state/auth.store";
import { authService } from "../features/auth/services/auth.service";
import i18n from "../i18n";

vi.mock("../features/auth/services/auth.service", () => ({
  authService: {
    logout: vi.fn(),
  },
}));

const mockedNavigate = vi.fn();
vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockedNavigate,
  };
});

describe("Sidebar Layout and User Profile Footer (Issue #95)", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    await i18n.changeLanguage("pt-BR");
    useAuthStore.setState({
      user: {
        id: "user-1",
        name: "Yuri Nogueira Moreira",
        email: "yuri@ps.com",
        role: "admin",
      },
      isAuthenticated: true,
    });
  });

  it("renders main navigation items and admin items for admin user", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Sidebar
          mobileOpen={false}
          onDrawerToggle={vi.fn()}
          drawerWidth={280}
        />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Visão Geral")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Eventos")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Fotógrafos")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Clientes e Fotos")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Organizações")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Gestão de Usuários")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Logs de Auditoria")[0]).toBeInTheDocument();
  });

  it("renders user profile footer widget with avatar, name, and email", () => {
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Sidebar
          mobileOpen={false}
          onDrawerToggle={vi.fn()}
          drawerWidth={280}
        />
      </MemoryRouter>,
    );

    // Profile button
    const profileBtns = screen.getAllByTestId("sidebar-profile-btn");
    expect(profileBtns.length).toBeGreaterThan(0);

    // Avatar with user initial
    expect(screen.getAllByText("Y")[0]).toBeInTheDocument();

    // User name and email with truncation styling
    const nameEl = screen.getAllByText("Yuri Nogueira Moreira")[0];
    expect(nameEl).toBeInTheDocument();
    expect(nameEl).toHaveStyle({
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    });

    const emailEl = screen.getAllByText("yuri@ps.com")[0];
    expect(emailEl).toBeInTheDocument();
    expect(emailEl).toHaveStyle({
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis",
    });

    // Logout button
    const logoutBtns = screen.getAllByTestId("sidebar-logout-btn");
    expect(logoutBtns.length).toBeGreaterThan(0);
  });

  it("navigates to /profile on click and closes drawer when mobileOpen is true", () => {
    const handleToggle = vi.fn();
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Sidebar
          mobileOpen={true}
          onDrawerToggle={handleToggle}
          drawerWidth={280}
        />
      </MemoryRouter>,
    );

    const profileBtns = screen.getAllByTestId("sidebar-profile-btn");
    fireEvent.click(profileBtns[0]);

    expect(handleToggle).toHaveBeenCalled();
    expect(mockedNavigate).toHaveBeenCalledWith("/profile");
  });

  it("triggers logout, clears auth store, and redirects to /login", async () => {
    vi.mocked(authService.logout).mockResolvedValueOnce(undefined);
    const handleToggle = vi.fn();

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Sidebar
          mobileOpen={true}
          onDrawerToggle={handleToggle}
          drawerWidth={280}
        />
      </MemoryRouter>,
    );

    const logoutBtns = screen.getAllByTestId("sidebar-logout-btn");
    fireEvent.click(logoutBtns[0]);

    expect(handleToggle).toHaveBeenCalled();
    expect(authService.logout).toHaveBeenCalled();

    // Wait for async logout handler to complete
    await vi.waitFor(() => {
      expect(useAuthStore.getState().user).toBeNull();
      expect(mockedNavigate).toHaveBeenCalledWith("/login");
    });
  });

  it("handles fallback gracefully when user is not defined", () => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Sidebar
          mobileOpen={false}
          onDrawerToggle={vi.fn()}
          drawerWidth={280}
        />
      </MemoryRouter>,
    );

    expect(screen.getAllByText("Usuário")[0]).toBeInTheDocument();
    expect(screen.queryByText("yuri@ps.com")).not.toBeInTheDocument();
  });
});
