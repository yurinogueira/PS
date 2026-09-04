import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DynamicExportDialog } from "./DynamicExportDialog";
import i18n from "../../../i18n";

describe("DynamicExportDialog", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await i18n.changeLanguage("pt-BR");
  });

  it("renders with default paid status and submits when considering all methods", async () => {
    const onExport = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <DynamicExportDialog
        open={true}
        onClose={onClose}
        onExport={onExport}
        seasonId="season-1"
        seasonName="Dog Show 2026"
      />,
    );

    expect(
      screen.getByText("Exportação Dinâmica por Pagamento"),
    ).toBeInTheDocument();
    expect(screen.getByText("Dog Show 2026")).toBeInTheDocument();

    const submitBtn = screen.getByRole("button", {
      name: /iniciar exportação/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onExport).toHaveBeenCalledWith({
        season_id: "season-1",
        paid_status: "paid",
        payment_methods: undefined,
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("allows selecting specific payment methods when all methods is unchecked", async () => {
    const onExport = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <DynamicExportDialog
        open={true}
        onClose={onClose}
        onExport={onExport}
        seasonId="season-1"
      />,
    );

    // Uncheck "Considerar todas as formas de pagamento"
    const allMethodsCheckbox = screen.getByLabelText(
      /considerar todas as formas de pagamento/i,
    );
    fireEvent.click(allMethodsCheckbox);

    // Select "Pix" and "Dinheiro"
    const pixChip = screen.getByText("Pix");
    fireEvent.click(pixChip);

    const dinheiroChip = screen.getByText("Dinheiro");
    fireEvent.click(dinheiroChip);

    const submitBtn = screen.getByRole("button", {
      name: /iniciar exportação/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onExport).toHaveBeenCalledWith({
        season_id: "season-1",
        paid_status: "paid",
        payment_methods: ["Pix", "Dinheiro"],
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it("allows selecting unpaid status", async () => {
    const onExport = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();

    render(
      <DynamicExportDialog
        open={true}
        onClose={onClose}
        onExport={onExport}
        seasonId="season-1"
      />,
    );

    const unpaidRadio = screen.getByLabelText(/Apenas Não Pagos/i);
    fireEvent.click(unpaidRadio);

    const submitBtn = screen.getByRole("button", {
      name: /iniciar exportação/i,
    });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onExport).toHaveBeenCalledWith({
        season_id: "season-1",
        paid_status: "unpaid",
        payment_methods: undefined,
      });
    });
  });
});
