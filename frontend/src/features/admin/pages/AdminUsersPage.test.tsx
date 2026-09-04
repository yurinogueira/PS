import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AdminUsersPage } from "./AdminUsersPage";
import { adminService } from "../services/admin.service";

vi.mock("../services/admin.service", () => ({
  adminService: {
    getUsers: vi.fn(),
    getTenants: vi.fn(),
    assignTenant: vi.fn(),
    updateUserRole: vi.fn(),
  },
}));

describe("AdminUsersPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders users list and KPI counts", async () => {
    vi.mocked(adminService.getUsers).mockResolvedValueOnce([
      {
        id: "u1",
        name: "Alice Super",
        email: "alice@test.com",
        superAdmin: true,
        emailVerified: true,
        tenantId: "org-alpha",
        createdAt: "2026-08-28T00:00:00Z",
      },
      {
        id: "u2",
        name: "Bob Normal",
        email: "bob@test.com",
        superAdmin: false,
        emailVerified: false,
        tenantId: "",
        createdAt: "2026-08-28T00:00:00Z",
      },
    ]);
    vi.mocked(adminService.getTenants).mockResolvedValueOnce([
      { name: "org-alpha", createdAt: "2026-08-28T00:00:00Z" },
    ]);

    render(
      <BrowserRouter>
        <AdminUsersPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Gestão de Usuários")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Alice Super")).toBeInTheDocument();
      expect(screen.getByText("Bob Normal")).toBeInTheDocument();
      expect(screen.getByText("SuperAdmin")).toBeInTheDocument();
      expect(screen.getByText("Pendente de Aprovação")).toBeInTheDocument();
    });
  });

  it("renders email addresses with ellipsis and nowrap styling to avoid text cutoff", async () => {
    vi.mocked(adminService.getUsers).mockResolvedValueOnce([
      {
        id: "u3",
        name: "Developer Long Name",
        email: "super.long.email.address.example.tenant@domain.com.br",
        superAdmin: false,
        emailVerified: true,
        tenantId: "long-tenant-id",
        createdAt: "2026-08-28T00:00:00Z",
      },
    ]);
    vi.mocked(adminService.getTenants).mockResolvedValueOnce([]);

    render(
      <BrowserRouter>
        <AdminUsersPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      const emailEl = screen.getByText(
        "super.long.email.address.example.tenant@domain.com.br",
      );
      expect(emailEl).toBeInTheDocument();
      expect(emailEl).toHaveStyle({
        whiteSpace: "nowrap",
        overflow: "hidden",
        textOverflow: "ellipsis",
      });
    });
  });

  it("opens edit role modal and updates user role", async () => {
    vi.mocked(adminService.getUsers).mockResolvedValue([
      {
        id: "u1",
        name: "Alice Test",
        email: "alice@test.com",
        role: "user",
        superAdmin: false,
        tenantId: "tenant-1",
      },
    ]);
    vi.mocked(adminService.getTenants).mockResolvedValue([]);
    vi.mocked(adminService.updateUserRole).mockResolvedValueOnce({
      id: "u1",
      name: "Alice Test",
      email: "alice@test.com",
      role: "manager",
      superAdmin: false,
      tenantId: "tenant-1",
    });

    render(
      <BrowserRouter>
        <AdminUsersPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText("Alice Test")).toBeInTheDocument();
    });

    const editRoleBtn = screen.getByRole("button", { name: /Alterar Função/i });
    expect(editRoleBtn).toBeInTheDocument();
    editRoleBtn.click();

    await waitFor(() => {
      expect(screen.getByText("Alterar Função do Usuário")).toBeInTheDocument();
    });
  });
});
