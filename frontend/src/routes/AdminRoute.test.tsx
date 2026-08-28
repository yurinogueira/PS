import { describe, expect, it, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AdminRoute } from "./AdminRoute";
import { useAuthStore } from "../features/auth/state/auth.store";

describe("AdminRoute", () => {
  beforeEach(() => {
    useAuthStore.getState().clear();
  });

  it("redirects to /login if not authenticated", () => {
    render(
      <MemoryRouter initialEntries={["/admin/tenants"]}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route element={<AdminRoute />}>
            <Route path="/admin/tenants" element={<div>Admin Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
  });

  it("redirects to /dashboard if authenticated but not superadmin", () => {
    useAuthStore.getState().setUser({
      id: "u1",
      name: "Normal User",
      email: "user@test.com",
      superAdmin: false,
      tenantId: "org-1",
    });

    render(
      <MemoryRouter initialEntries={["/admin/tenants"]}>
        <Routes>
          <Route path="/dashboard" element={<div>Dashboard Page</div>} />
          <Route element={<AdminRoute />}>
            <Route path="/admin/tenants" element={<div>Admin Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Dashboard Page")).toBeInTheDocument();
    expect(screen.queryByText("Admin Content")).not.toBeInTheDocument();
  });

  it("renders admin content if authenticated and superadmin", () => {
    useAuthStore.getState().setUser({
      id: "u1",
      name: "Super Admin",
      email: "admin@test.com",
      superAdmin: true,
      tenantId: "",
    });

    render(
      <MemoryRouter initialEntries={["/admin/tenants"]}>
        <Routes>
          <Route element={<AdminRoute />}>
            <Route path="/admin/tenants" element={<div>Admin Content</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Admin Content")).toBeInTheDocument();
  });
});
