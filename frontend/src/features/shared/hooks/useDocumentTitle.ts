import { useEffect } from "react";

const BASE_TITLE = "PS - Photo Storage";
const BASE_URL = "https://ps.yurinogueira.dev.br";

export function useDocumentTitle(title?: string): void {
  useEffect(() => {
    if (title) {
      document.title = `${title} | ${BASE_TITLE}`;
    } else {
      document.title = `${BASE_TITLE} | Gestão de Fotos de Competições de Cães`;
    }

    if (typeof window !== "undefined") {
      let canonical = document.querySelector<HTMLLinkElement>(
        "link[rel='canonical']",
      );
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.rel = "canonical";
        document.head.appendChild(canonical);
      }
      const cleanPath = window.location.pathname.replace(/\/+$/, "");
      const canonicalUrl = cleanPath
        ? `${BASE_URL}${cleanPath}/`
        : `${BASE_URL}/`;
      canonical.setAttribute("href", canonicalUrl);
    }
  }, [title]);
}
