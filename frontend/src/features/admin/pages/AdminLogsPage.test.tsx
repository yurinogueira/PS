import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { AdminLogsPage } from "./AdminLogsPage";
import { adminService } from "../services/admin.service";
import { AuditLog } from "../types/admin.types";

vi.mock("../services/admin.service", () => ({
  adminService: {
    getAuditLogs: vi.fn(),
  },
}));

const mockLogs: AuditLog[] = [
  {
    id: "log-1",
    tenantId: "org-alpha",
    entityType: "season",
    entityId: "season-101",
    userId: "user-1",
    userEmail: "admin@ps.com",
    action: "CREATE",
    createdAt: "2026-09-04T00:00:00Z",
    changes: [
      {
        fieldChanged: "name",
        oldValue: null,
        newValue: "Temporada de Verão",
      },
    ],
  },
  {
    id: "log-2",
    tenantId: "org-alpha",
    entityType: "user",
    entityId: "user-2",
    userId: "user-1",
    userEmail: "admin@ps.com",
    action: "ROLE_CHANGE",
    createdAt: "2026-09-04T01:00:00Z",
    changes: [
      {
        fieldChanged: "role",
        oldValue: "user",
        newValue: "manager",
      },
    ],
  },
];

describe("AdminLogsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders logs page header and logs table with rows", async () => {
    vi.mocked(adminService.getAuditLogs).mockResolvedValueOnce({
      items: mockLogs,
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    render(
      <BrowserRouter>
        <AdminLogsPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Logs de Auditoria")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getAllByText("admin@ps.com").length).toBeGreaterThanOrEqual(
        1,
      );
      expect(screen.getByText("CREATE")).toBeInTheDocument();
      expect(screen.getByText("ROLE_CHANGE")).toBeInTheDocument();
      expect(screen.getByText("season")).toBeInTheDocument();
      expect(screen.getAllByText("org-alpha").length).toBeGreaterThanOrEqual(1);
    });
  });

  it("opens details modal when clicking on Ver Alterações and displays diff", async () => {
    vi.mocked(adminService.getAuditLogs).mockResolvedValueOnce({
      items: mockLogs,
      total: 2,
      page: 1,
      limit: 20,
      totalPages: 1,
    });

    render(
      <BrowserRouter>
        <AdminLogsPage />
      </BrowserRouter>,
    );

    await waitFor(() => {
      expect(screen.getAllByText(/Ver Alterações/i)[0]).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText(/Ver Alterações/i)[0]);

    await waitFor(() => {
      expect(screen.getByText("Detalhes da Alteração")).toBeInTheDocument();
      expect(screen.getByText("Temporada de Verão")).toBeInTheDocument();
    });

    // Close modal
    fireEvent.click(screen.getByRole("button", { name: /Fechar/i }));
    await waitFor(() => {
      expect(
        screen.queryByText("Detalhes da Alteração"),
      ).not.toBeInTheDocument();
    });
  });
});
