import { describe, expect, it, vi, beforeEach } from "vitest";
import { adminService } from "./admin.service";
import { apiClient } from "../../../services/api/client";

vi.mock("../../../services/api/client", () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}));

describe("adminService.getAuditLogs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("serializes filter params with both camelCase and snake_case correctly", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          items: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      },
    });

    await adminService.getAuditLogs({
      page: 1,
      limit: 10,
      entityType: "client",
      action: "CREATE",
      userId: "user-123",
      startDate: "2026-09-01T00:00:00Z",
      endDate: "2026-09-02T00:00:00Z",
    });

    expect(apiClient.get).toHaveBeenCalledWith("/admin/logs", {
      params: {
        page: 1,
        limit: 10,
        entityType: "client",
        entity_type: "client",
        action: "CREATE",
        userId: "user-123",
        user_id: "user-123",
        startDate: "2026-09-01T00:00:00Z",
        start_date: "2026-09-01T00:00:00Z",
        endDate: "2026-09-02T00:00:00Z",
        end_date: "2026-09-02T00:00:00Z",
      },
    });
  });

  it("handles empty parameters gracefully", async () => {
    vi.mocked(apiClient.get).mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          items: [],
          total: 0,
          page: 1,
          limit: 10,
          totalPages: 0,
        },
      },
    });

    await adminService.getAuditLogs();

    expect(apiClient.get).toHaveBeenCalledWith("/admin/logs", {
      params: {},
    });
  });
});
