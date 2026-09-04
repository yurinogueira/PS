import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AppTablePagination } from "./AppTablePagination";

describe("AppTablePagination", () => {
  it("renders with default standard 10 rows and localized displayedRows", () => {
    const handlePageChange = vi.fn();
    const handleRowsPerPageChange = vi.fn();

    render(
      <AppTablePagination
        count={50}
        page={0}
        rowsPerPage={10}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />,
    );

    expect(screen.getByText("Itens por página:")).toBeInTheDocument();
    expect(screen.getByText("1–10 de 50")).toBeInTheDocument();
  });

  it("handles page change when next button clicked", () => {
    const handlePageChange = vi.fn();
    const handleRowsPerPageChange = vi.fn();

    render(
      <AppTablePagination
        count={50}
        page={0}
        rowsPerPage={10}
        onPageChange={handlePageChange}
        onRowsPerPageChange={handleRowsPerPageChange}
      />,
    );

    const nextButton = screen.getByRole("button", {
      name: /próxima página|next page/i,
    });
    fireEvent.click(nextButton);

    expect(handlePageChange).toHaveBeenCalledWith(expect.anything(), 1);
  });
});
