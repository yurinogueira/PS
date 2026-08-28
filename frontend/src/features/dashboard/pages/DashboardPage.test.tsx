import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { DashboardPage } from "./DashboardPage";

describe("DashboardPage", () => {
  it("renders welcome message", () => {
    render(
      <BrowserRouter>
        <DashboardPage />
      </BrowserRouter>,
    );

    expect(screen.getByText("Visão Geral")).toBeInTheDocument();
    expect(
      screen.getByText(/Bem-vindo ao Photo Storage \(PS\)/i),
    ).toBeInTheDocument();
  });
});
