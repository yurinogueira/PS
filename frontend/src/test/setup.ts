import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";
import { cleanup } from "@testing-library/react";

if (typeof window !== "undefined" && !window.localStorage) {
  const store = new Map<string, string>();
  Object.defineProperty(window, "localStorage", {
    value: {
      getItem: vi.fn((key: string) => store.get(key) ?? null),
      setItem: vi.fn((key: string, value: string) => store.set(key, value)),
      removeItem: vi.fn((key: string) => store.delete(key)),
      clear: vi.fn(() => store.clear()),
      key: vi.fn((index: number) => Array.from(store.keys())[index] ?? null),
      get length() {
        return store.size;
      },
    },
    writable: true,
  });
}

afterEach(() => {
  cleanup();
});

// Mock react-i18next so components render with pt-BR translations in tests
// without needing the full i18next initialization
vi.mock("react-i18next", async () => {
  const imported = await import("../locales/pt-BR/translation.json");
  const ptBR = imported.default || imported;

  function getNestedValue(obj: Record<string, unknown>, path: string): string {
    const result = path.split(".").reduce((current: unknown, key: string) => {
      if (current && typeof current === "object") {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj as unknown);
    return typeof result === "string" ? result : path;
  }

  const t = (key: string, options?: Record<string, unknown>): string => {
    let value = getNestedValue(ptBR as Record<string, unknown>, key);
    if (options) {
      Object.entries(options).forEach(([k, v]) => {
        value = value.replace(`{{${k}}}`, String(v));
      });
    }
    return value;
  };

  let currentLang = "pt-BR";

  return {
    useTranslation: () => ({
      t,
      i18n: {
        get language() {
          return currentLang;
        },
        changeLanguage: (lng: string) => {
          currentLang = lng;
          if (typeof window !== "undefined" && window.localStorage) {
            window.localStorage.setItem("ps_language", lng);
          }
        },
        on: vi.fn(),
      },
    }),
    initReactI18next: { type: "3rdParty", init: vi.fn() },
    Trans: ({ children }: { children: React.ReactNode }) => children,
  };
});
