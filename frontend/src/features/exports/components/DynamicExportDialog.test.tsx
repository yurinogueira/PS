import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { DynamicExportDialog } from "./DynamicExportDialog";
import i18n from "../../../i18n";

describe("DynamicExportDialog", () => {
  beforeEach(async () => {
    vi.restoreAllMocks();
    await i18n.changeLanguage("pt-BR");
  });

  it("renders with default paid status, displays disabled payment methods when considering all methods, and submits", async () => {
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

    // Payment methods section and chips must remain visible even with allMethods checked
    const paymentMethods = [
      "Dinheiro",
      "Pix",
      "Cartão de Crédito",
      "Cartão de Débito",
      "Transferência",
    ];

    paymentMethods.forEach((method) => {
      const chip = screen.getByText(method).closest(".MuiChip-root");
      expect(chip).toBeInTheDocument();
      expect(chip).toHaveClass("Mui-disabled");
    });

    // "Selecionar Todos" button must be disabled when allMethods is active
    const selectAllBtn = screen.getByRole("button", {
      name: /selecionar todos/i,
    });
    expect(selectAllBtn).toBeDisabled();

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

    // Chips should now be enabled and interactive
    const pixChip = screen.getByText("Pix").closest(".MuiChip-root");
    expect(pixChip).not.toHaveClass("Mui-disabled");

    // Select "Pix" and "Dinheiro"
    fireEvent.click(screen.getByText("Pix"));
    fireEvent.click(screen.getByText("Dinheiro"));

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

  it("handles 'Selecionar Todos' / 'Desmarcar Todos' and shows validation error when none selected", async () => {
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

    // Uncheck allMethods
    const allMethodsCheckbox = screen.getByLabelText(
      /considerar todas as formas de pagamento/i,
    );
    fireEvent.click(allMethodsCheckbox);

    // Click "Selecionar Todos"
    const selectAllBtn = screen.getByRole("button", {
      name: /selecionar todos/i,
    });
    expect(selectAllBtn).toBeEnabled();
    fireEvent.click(selectAllBtn);

    // Button should now show "Desmarcar Todos"
    const deselectAllBtn = screen.getByRole("button", {
      name: /desmarcar todos/i,
    });
    expect(deselectAllBtn).toBeInTheDocument();

    // Click "Desmarcar Todos"
    fireEvent.click(deselectAllBtn);

    // Now 0 methods are selected. Attempt submit -> validation error
    const submitBtn = screen.getByRole("button", {
      name: /iniciar exportação/i,
    });
    fireEvent.click(submitBtn);

    expect(
      screen.getByText(
        "Selecione ao menos um método de pagamento ou marque a opção para considerar todos.",
      ),
    ).toBeInTheDocument();
    expect(onExport).not.toHaveBeenCalled();
  });

  it("allows selecting unpaid status and hides payment methods section", async () => {
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

    // Payment methods section should not be rendered when unpaid
    expect(
      screen.queryByText(/Formas de Pagamento Específicas/i),
    ).not.toBeInTheDocument();

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
