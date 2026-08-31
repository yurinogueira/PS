import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LanguageSelector } from "./LanguageSelector";
import i18n from "../i18n";

describe("LanguageSelector", () => {
  beforeEach(() => {
    localStorage.clear();
    i18n.changeLanguage("pt-BR");
  });

  it("renders with default variant showing current language label", () => {
    render(<LanguageSelector />);

    const combobox = screen.getByRole("combobox");
    expect(combobox).toBeInTheDocument();
    expect(screen.getByText("PT-BR")).toBeInTheDocument();
  });

  it("renders with auth variant", () => {
    render(<LanguageSelector variant="auth" />);

    const combobox = screen.getByRole("combobox");
    expect(combobox).toBeInTheDocument();
    expect(screen.getByText("PT-BR")).toBeInTheDocument();
  });

  it("changes language to en-US on selection and persists to localStorage", () => {
    render(<LanguageSelector />);

    const combobox = screen.getByRole("combobox");
    fireEvent.mouseDown(combobox);

    const enOption = screen.getByRole("option", { name: /EN-US/i });
    expect(enOption).toBeInTheDocument();
    fireEvent.click(enOption);

    expect(localStorage.getItem("ps_language")).toBe("en-US");
  });
});
