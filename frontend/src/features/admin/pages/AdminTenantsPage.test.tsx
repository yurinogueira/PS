import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AdminTenantsPage } from "./AdminTenantsPage";
import { adminService } from "../services/admin.service";

vi.mock("../services/admin.service", () => ({
  adminService: {
    getTenants: vi.fn(),
    createTenant: vi.fn(),
    updateTenantPlan: vi.fn(),
    updateTenantPaymentStatus: vi.fn(),
    updateTenantSettings: vi.fn(),
  },
}));

describe("AdminTenantsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders tenants list with plan, payment status and overview preference successfully", async () => {
    vi.mocked(adminService.getTenants).mockResolvedValueOnce([
      {
        name: "tenant-alpha",
        plan: "free",
        paymentStatus: "paid",
        settings: { hideOverviewByDefault: true },
        createdAt: "2026-08-28T00:00:00Z",
      },
      {
        name: "tenant-beta",
        plan: "standard",
        paymentStatus: "unpaid",
        settings: { hideOverviewByDefault: false },
        createdAt: "2026-08-28T01:00:00Z",
      },
    ]);

    render(
      <BrowserRouter>
        <AdminTenantsPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Organizações")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("tenant-alpha")).toBeInTheDocument();
      expect(screen.getByText("tenant-beta")).toBeInTheDocument();
      expect(screen.getByText("Gratuito (Trial)")).toBeInTheDocument();
      expect(screen.getByText("Padrão")).toBeInTheDocument();
      expect(screen.getByText("Em dia")).toBeInTheDocument();
      expect(screen.getByText("Inadimplente")).toBeInTheDocument();
      expect(screen.getByText("Oculta por Padrão")).toBeInTheDocument();
      expect(screen.getByText("Expandida por Padrão")).toBeInTheDocument();
    });
  });

  it("renders empty state when no tenants found", async () => {
    vi.mocked(adminService.getTenants).mockResolvedValueOnce([]);

    render(
      <BrowserRouter>
        <AdminTenantsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(
        screen.getByText("Nenhuma organização encontrada"),
      ).toBeInTheDocument();
    });
  });
});
